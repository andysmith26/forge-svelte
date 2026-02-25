import bcrypt from 'bcryptjs';
import type { PinRepository } from '$lib/application/ports/PinRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

const BCRYPT_ROUNDS = 10;

export type SetPinError =
  | { type: 'NOT_FOUND' }
  | { type: 'PIN_IN_USE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function setPin(
  deps: { pinRepo: PinRepository },
  input: { classroomId: string; personId: string; pin: string }
): Promise<Result<void, SetPinError>> {
  try {
    const membership = await deps.pinRepo.getMembership(input.personId, input.classroomId);

    if (!membership) {
      return err({ type: 'NOT_FOUND' });
    }

    const candidates = await deps.pinRepo.findLoginCandidates(input.classroomId);

    for (const candidate of candidates) {
      if (candidate.personId === input.personId) continue;
      const isMatch = await bcrypt.compare(input.pin, candidate.pinHash);
      if (isMatch) {
        return err({ type: 'PIN_IN_USE' });
      }
    }

    const pinHash = await bcrypt.hash(input.pin, BCRYPT_ROUNDS);
    await deps.pinRepo.updatePersonPinHash(input.personId, pinHash);

    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
