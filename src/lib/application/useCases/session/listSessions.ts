import type {
  SessionRepository,
  SessionRecord,
  SessionFilters
} from '$lib/application/ports/SessionRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListSessionsError = { type: 'INTERNAL_ERROR'; message: string };

export async function listSessions(
  deps: { sessionRepo: SessionRepository },
  input: { classroomId: string; filters?: SessionFilters }
): Promise<Result<SessionRecord[], ListSessionsError>> {
  try {
    const sessions = await deps.sessionRepo.listByClassroom(input.classroomId, input.filters);
    return ok(sessions);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
