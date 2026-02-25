import type {
  SessionRepository,
  SessionWithDetails
} from '$lib/application/ports/SessionRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetSessionError =
  | { type: 'NOT_FOUND'; sessionId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function getSession(
  deps: { sessionRepo: SessionRepository },
  input: { sessionId: string }
): Promise<Result<SessionWithDetails, GetSessionError>> {
  try {
    const session = await deps.sessionRepo.getWithDetails(input.sessionId);

    if (!session) {
      return err({ type: 'NOT_FOUND', sessionId: input.sessionId });
    }

    return ok(session);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
