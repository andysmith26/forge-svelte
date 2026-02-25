import type { PinRepository, PersonPinRecord } from '$lib/application/ports/PinRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListStudentsWithPinsError = { type: 'INTERNAL_ERROR'; message: string };

export async function listStudentsWithPins(
  deps: { pinRepo: PinRepository },
  input: { classroomId: string }
): Promise<Result<PersonPinRecord[], ListStudentsWithPinsError>> {
  try {
    const students = await deps.pinRepo.listStudentsWithPins(input.classroomId);
    return ok(students);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
