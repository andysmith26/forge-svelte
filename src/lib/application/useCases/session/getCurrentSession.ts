import type { SessionRepository, SessionRecord } from '$lib/application/ports/SessionRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetCurrentSessionError = { type: 'INTERNAL_ERROR'; message: string };

export async function getCurrentSession(
  deps: { sessionRepo: SessionRepository },
  input: { classroomId: string }
): Promise<Result<SessionRecord | null, GetCurrentSessionError>> {
  try {
    const session = await deps.sessionRepo.findActive(input.classroomId);
    return ok(session);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
