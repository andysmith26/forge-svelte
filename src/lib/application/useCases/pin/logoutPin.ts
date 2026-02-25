import type { PinRepository } from '$lib/application/ports/PinRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type LogoutPinError = { type: 'INTERNAL_ERROR'; message: string };

export async function logoutPin(
  deps: { pinRepo: PinRepository },
  input: { token: string }
): Promise<Result<void, LogoutPinError>> {
  try {
    await deps.pinRepo.deletePinSession(input.token);
    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
