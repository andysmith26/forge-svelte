import type {
  SessionRepository,
  SessionWithClassroom
} from '$lib/application/ports/SessionRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetPublicCurrentSessionError = { type: 'INTERNAL_ERROR'; message: string };

export async function getPublicCurrentSession(
  deps: { sessionRepo: SessionRepository },
  input: { classroomId: string }
): Promise<Result<SessionWithClassroom | null, GetPublicCurrentSessionError>> {
  try {
    const session = await deps.sessionRepo.getCurrentWithClassroom(input.classroomId);
    return ok(session);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
