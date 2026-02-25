import type {
  SessionRepository,
  SessionRecord,
  SessionType
} from '$lib/application/ports/SessionRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type CreateSessionError =
  | { type: 'ACTIVE_SESSION_EXISTS' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function createSession(
  deps: { sessionRepo: SessionRepository },
  input: {
    classroomId: string;
    name?: string | null;
    sessionType: SessionType;
    scheduledDate: Date;
    startTime: Date;
    endTime: Date;
  }
): Promise<Result<SessionRecord, CreateSessionError>> {
  try {
    const activeSession = await deps.sessionRepo.findActive(input.classroomId);

    if (activeSession) {
      return err({ type: 'ACTIVE_SESSION_EXISTS' });
    }

    const session = await deps.sessionRepo.create({
      classroomId: input.classroomId,
      name: input.name,
      sessionType: input.sessionType,
      scheduledDate: input.scheduledDate,
      startTime: input.startTime,
      endTime: input.endTime,
      status: 'scheduled'
    });

    return ok(session);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
