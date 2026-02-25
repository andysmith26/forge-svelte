import type { SessionRepository, SessionRecord } from '$lib/application/ports/SessionRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import { SessionEntity } from '$lib/domain/entities/session.entity';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type EndSessionError =
  | { type: 'SESSION_NOT_FOUND'; sessionId: string }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'INVALID_STATE'; currentStatus: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function endSession(
  deps: {
    sessionRepo: SessionRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
  },
  input: { sessionId: string; actorId: string }
): Promise<Result<SessionRecord, EndSessionError>> {
  try {
    const session = await deps.sessionRepo.getById(input.sessionId);

    if (!session) {
      return err({ type: 'SESSION_NOT_FOUND', sessionId: input.sessionId });
    }

    const sessionEntity = SessionEntity.fromRecord(session);
    if (!sessionEntity.canEnd()) {
      return err({ type: 'INVALID_STATE', currentStatus: session.status });
    }

    const classroom = await deps.classroomRepo.getById(session.classroomId);
    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: session.classroomId,
      sessionId: session.id,
      eventType: 'SESSION_ENDED',
      entityType: 'ClassSession',
      entityId: session.id,
      actorId: input.actorId,
      payload: {
        sessionId: session.id,
        classroomId: session.classroomId,
        endedBy: input.actorId,
        byTeacher: true
      }
    });

    const updatedSession = await deps.sessionRepo.getById(input.sessionId);
    if (!updatedSession) {
      return err({ type: 'SESSION_NOT_FOUND', sessionId: input.sessionId });
    }

    return ok(updatedSession);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
