import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import type { PresenceRepository, SignInRecord } from '$lib/application/ports/PresenceRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import { SignInEntity } from '$lib/domain/entities/sign-in.entity';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type SignOutError =
  | { type: 'SESSION_NOT_FOUND' }
  | { type: 'NOT_SIGNED_IN' }
  | { type: 'WRONG_CLASSROOM' }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'SIGN_IN_NOT_FOUND_AFTER_UPDATE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function signOut(
  deps: {
    sessionRepo: SessionRepository;
    presenceRepo: PresenceRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
  },
  input: {
    sessionId: string;
    personId: string;
    actorId: string;
    pinClassroomId?: string | null;
  }
): Promise<Result<SignInRecord, SignOutError>> {
  try {
    const [session, signInRecord] = await Promise.all([
      deps.sessionRepo.getById(input.sessionId),
      deps.presenceRepo.getActiveSignIn(input.sessionId, input.personId)
    ]);

    if (!session) {
      return err({ type: 'SESSION_NOT_FOUND' });
    }

    if (!signInRecord) {
      return err({ type: 'NOT_SIGNED_IN' });
    }

    const signInEntity = SignInEntity.fromRecord(signInRecord);
    if (!signInEntity.canSignOut()) {
      return err({ type: 'NOT_SIGNED_IN' });
    }

    if (input.pinClassroomId && input.pinClassroomId !== session.classroomId) {
      return err({ type: 'WRONG_CLASSROOM' });
    }

    const isSelfSignOut = input.actorId === input.personId;
    const signoutType = isSelfSignOut ? 'self' : 'manual';

    const [byTeacher, classroom] = await Promise.all([
      !isSelfSignOut
        ? checkIsTeacher(deps, input.actorId, session.classroomId)
        : Promise.resolve(false),
      deps.classroomRepo.getById(session.classroomId)
    ]);

    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: session.classroomId,
      sessionId: session.id,
      eventType: 'PERSON_SIGNED_OUT',
      entityType: 'SignIn',
      entityId: signInRecord.id,
      actorId: input.actorId,
      payload: {
        signInId: signInRecord.id,
        sessionId: session.id,
        classroomId: session.classroomId,
        personId: input.personId,
        signedOutBy: input.actorId,
        signoutType,
        byTeacher
      }
    });

    return ok({
      ...signInRecord,
      signedOutAt: new Date(),
      signedOutById: input.actorId,
      signoutType
    });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
