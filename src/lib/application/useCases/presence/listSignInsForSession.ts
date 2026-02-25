import type {
  PresenceRepository,
  SignInWithActors
} from '$lib/application/ports/PresenceRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListSignInsForSessionError = { type: 'INTERNAL_ERROR'; message: string };

export async function listSignInsForSession(
  deps: { presenceRepo: PresenceRepository },
  input: { sessionId: string }
): Promise<Result<SignInWithActors[], ListSignInsForSessionError>> {
  try {
    const signIns = await deps.presenceRepo.listSignInsForSession(input.sessionId);
    return ok(signIns);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
