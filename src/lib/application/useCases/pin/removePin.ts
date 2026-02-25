import type { PinRepository } from '$lib/application/ports/PinRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type RemovePinError = { type: 'NOT_FOUND' } | { type: 'INTERNAL_ERROR'; message: string };

export async function removePin(
  deps: { pinRepo: PinRepository },
  input: { classroomId: string; personId: string }
): Promise<Result<void, RemovePinError>> {
  try {
    const membership = await deps.pinRepo.getMembership(input.personId, input.classroomId);

    if (!membership) {
      return err({ type: 'NOT_FOUND' });
    }

    await deps.pinRepo.updatePersonPinHash(input.personId, null);
    await deps.pinRepo.deletePinSessionsForPerson(input.personId);

    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
