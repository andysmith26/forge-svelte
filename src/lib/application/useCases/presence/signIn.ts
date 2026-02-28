import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import type { PresenceRepository, SignInRecord } from '$lib/application/ports/PresenceRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { SessionEntity } from '$lib/domain/entities/session.entity';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type SignInError =
  | { type: 'SESSION_NOT_FOUND' }
  | { type: 'SESSION_NOT_ACTIVE' }
  | { type: 'ALREADY_SIGNED_IN' }
  | { type: 'WRONG_CLASSROOM' }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'SIGN_IN_NOT_FOUND_AFTER_CREATE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function signIn(
  deps: {
    sessionRepo: SessionRepository;
    presenceRepo: PresenceRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    sessionId: string;
    personId: string;
    actorId: string;
    pinClassroomId?: string | null;
  }
): Promise<Result<SignInRecord, SignInError>> {
  try {
    const [session, activeSignIn] = await Promise.all([
      deps.sessionRepo.getById(input.sessionId),
      deps.presenceRepo.getActiveSignIn(input.sessionId, input.personId)
    ]);

    if (!session) {
      return err({ type: 'SESSION_NOT_FOUND' });
    }

    const sessionEntity = SessionEntity.fromRecord(session);
    if (!sessionEntity.allowsSignIn()) {
      return err({ type: 'SESSION_NOT_ACTIVE' });
    }

    if (activeSignIn) {
      return err({ type: 'ALREADY_SIGNED_IN' });
    }

    if (input.pinClassroomId && input.pinClassroomId !== session.classroomId) {
      return err({ type: 'WRONG_CLASSROOM' });
    }

    const isSelfSignIn = input.actorId === input.personId;
    const [byTeacher, classroom] = await Promise.all([
      checkIsTeacher(deps, input.actorId, session.classroomId),
      deps.classroomRepo.getById(session.classroomId)
    ]);

    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    const signInId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: session.classroomId,
      sessionId: session.id,
      eventType: 'PERSON_SIGNED_IN',
      entityType: 'SignIn',
      entityId: signInId,
      actorId: input.actorId,
      payload: {
        signInId,
        sessionId: session.id,
        classroomId: session.classroomId,
        personId: input.personId,
        signedInBy: input.actorId,
        isSelfSignIn,
        byTeacher
      }
    });

    const result = await deps.presenceRepo.getActiveSignIn(input.sessionId, input.personId);
    if (!result) {
      return err({ type: 'SIGN_IN_NOT_FOUND_AFTER_CREATE' });
    }

    return ok(result);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
