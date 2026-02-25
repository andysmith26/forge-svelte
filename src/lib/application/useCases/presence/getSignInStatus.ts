import type { PresenceRepository, SignInRecord } from '$lib/application/ports/PresenceRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetSignInStatusError = { type: 'INTERNAL_ERROR'; message: string };

export async function getSignInStatus(
  deps: { presenceRepo: PresenceRepository },
  input: { sessionId: string; personId: string }
): Promise<Result<SignInRecord | null, GetSignInStatusError>> {
  try {
    const signIn = await deps.presenceRepo.getSignIn(input.sessionId, input.personId);
    return ok(signIn);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
