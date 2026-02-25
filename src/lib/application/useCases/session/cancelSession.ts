import type { SessionRepository, SessionRecord } from '$lib/application/ports/SessionRepository';
import { SessionEntity } from '$lib/domain/entities/session.entity';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type CancelSessionError =
  | { type: 'SESSION_NOT_FOUND'; sessionId: string }
  | { type: 'INVALID_STATE'; currentStatus: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function cancelSession(
  deps: { sessionRepo: SessionRepository },
  input: { sessionId: string }
): Promise<Result<SessionRecord, CancelSessionError>> {
  try {
    const session = await deps.sessionRepo.getById(input.sessionId);

    if (!session) {
      return err({ type: 'SESSION_NOT_FOUND', sessionId: input.sessionId });
    }

    const sessionEntity = SessionEntity.fromRecord(session);
    if (!sessionEntity.canCancel()) {
      return err({ type: 'INVALID_STATE', currentStatus: session.status });
    }

    const updatedSession = await deps.sessionRepo.update(input.sessionId, {
      status: 'cancelled'
    });

    return ok(updatedSession);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
