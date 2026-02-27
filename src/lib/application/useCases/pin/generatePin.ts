import type { PinRepository, PinCandidate } from '$lib/application/ports/PinRepository';
import type { HashService } from '$lib/application/ports/HashService';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GeneratePinError =
  | { type: 'NOT_FOUND' }
  | { type: 'UNABLE_TO_GENERATE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function generatePin(
  deps: { pinRepo: PinRepository; hashService: HashService },
  input: { classroomId: string; personId: string }
): Promise<Result<string, GeneratePinError>> {
  try {
    const membership = await deps.pinRepo.getMembership(input.personId, input.classroomId);

    if (!membership) {
      return err({ type: 'NOT_FOUND' });
    }

    const pin = await generateUniquePin(
      deps.pinRepo,
      deps.hashService,
      input.classroomId,
      input.personId
    );

    if (!pin) {
      return err({ type: 'UNABLE_TO_GENERATE' });
    }

    const pinHash = await deps.hashService.hash(pin);
    await deps.pinRepo.updatePersonPinHash(input.personId, pinHash);

    return ok(pin);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}

export async function generateUniquePin(
  pinRepo: PinRepository,
  hashService: HashService,
  classroomId: string,
  excludePersonId?: string,
  length: number = 4,
  candidates?: PinCandidate[]
): Promise<string | null> {
  const loginCandidates = candidates ?? (await pinRepo.findLoginCandidates(classroomId));
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const pin = generateRandomPin(length);
    const inUse = await isPinInUse(hashService, pin, loginCandidates, excludePersonId);

    if (!inUse) {
      return pin;
    }
  }

  if (length < 6) {
    return generateUniquePin(
      pinRepo,
      hashService,
      classroomId,
      excludePersonId,
      length + 1,
      loginCandidates
    );
  }

  return null;
}

function generateRandomPin(length: number): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const pin = Math.floor(Math.random() * (max - min + 1)) + min;
  return pin.toString();
}

async function isPinInUse(
  hashService: HashService,
  pin: string,
  candidates: PinCandidate[],
  excludePersonId?: string
): Promise<boolean> {
  for (const candidate of candidates) {
    if (excludePersonId && candidate.personId === excludePersonId) {
      continue;
    }
    const isMatch = await hashService.compare(pin, candidate.pinHash);
    if (isMatch) {
      return true;
    }
  }
  return false;
}
