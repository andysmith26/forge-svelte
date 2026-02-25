import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type { PinRepository } from '$lib/application/ports/PinRepository';
import type { Clock } from '$lib/application/ports/Clock';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

const PIN_SESSION_DURATION_MS = 4 * 60 * 60 * 1000;

export type PinLoginResult = {
  token: string;
  personId: string;
  classroomId: string;
};

export type LoginWithPinError =
  | { type: 'INVALID_CREDENTIALS' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function loginWithPin(
  deps: { pinRepo: PinRepository; clock: Clock },
  input: { classroomCode: string; pin: string }
): Promise<Result<PinLoginResult, LoginWithPinError>> {
  try {
    const classroomId = await deps.pinRepo.findClassroomIdByDisplayCode(
      input.classroomCode.toUpperCase()
    );

    if (!classroomId) {
      return err({ type: 'INVALID_CREDENTIALS' });
    }

    const candidates = await deps.pinRepo.findLoginCandidates(classroomId);

    let matchedPersonId: string | null = null;
    for (const candidate of candidates) {
      const isMatch = await bcrypt.compare(input.pin, candidate.pinHash);
      if (isMatch) {
        matchedPersonId = candidate.personId;
        break;
      }
    }

    if (!matchedPersonId) {
      return err({ type: 'INVALID_CREDENTIALS' });
    }

    const token = randomBytes(32).toString('hex');
    const now = deps.clock.now();
    const expiresAt = new Date(now.getTime() + PIN_SESSION_DURATION_MS);

    await deps.pinRepo.deletePinSessionsForPerson(matchedPersonId);
    await deps.pinRepo.createPinSession({
      personId: matchedPersonId,
      classroomId,
      token,
      expiresAt
    });
    await deps.pinRepo.updatePersonLastLogin(matchedPersonId, now);

    return ok({ token, personId: matchedPersonId, classroomId });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
