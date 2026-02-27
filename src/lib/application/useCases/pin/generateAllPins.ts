import type { PinRepository } from '$lib/application/ports/PinRepository';
import type { HashService } from '$lib/application/ports/HashService';
import { generateUniquePin } from './generatePin';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GenerateAllPinsResult = {
  generated: number;
};

export type GenerateAllPinsError = { type: 'INTERNAL_ERROR'; message: string };

export async function generateAllPins(
  deps: { pinRepo: PinRepository; hashService: HashService },
  input: { classroomId: string }
): Promise<Result<GenerateAllPinsResult, GenerateAllPinsError>> {
  try {
    const studentIds = await deps.pinRepo.listStudentIdsWithoutPins(input.classroomId);

    let generated = 0;
    for (const studentId of studentIds) {
      const pin = await generateUniquePin(
        deps.pinRepo,
        deps.hashService,
        input.classroomId,
        studentId
      );

      if (pin) {
        const pinHash = await deps.hashService.hash(pin);
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
