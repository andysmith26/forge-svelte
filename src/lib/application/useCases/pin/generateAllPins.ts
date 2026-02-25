import bcrypt from 'bcryptjs';
import type { PinRepository } from '$lib/application/ports/PinRepository';
import { generateUniquePin } from './generatePin';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

const BCRYPT_ROUNDS = 10;

export type GenerateAllPinsResult = {
  generated: number;
};

export type GenerateAllPinsError = { type: 'INTERNAL_ERROR'; message: string };

export async function generateAllPins(
  deps: { pinRepo: PinRepository },
  input: { classroomId: string }
): Promise<Result<GenerateAllPinsResult, GenerateAllPinsError>> {
  try {
    const studentIds = await deps.pinRepo.listStudentIdsWithoutPins(input.classroomId);

    let generated = 0;
    for (const studentId of studentIds) {
      const pin = await generateUniquePin(deps.pinRepo, input.classroomId, studentId);

      if (pin) {
        const pinHash = await bcrypt.hash(pin, BCRYPT_ROUNDS);
        await deps.pinRepo.updatePersonPinHash(studentId, pinHash);
        generated += 1;
      }
    }

    return ok({ generated });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
