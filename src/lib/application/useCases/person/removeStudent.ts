import type { PersonRepository } from '$lib/application/ports/PersonRepository';
import type { Clock } from '$lib/application/ports/Clock';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type RemoveStudentError =
  | { type: 'NOT_FOUND' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function removeStudent(
  deps: { personRepo: PersonRepository; clock: Clock },
  input: { classroomId: string; personId: string }
): Promise<Result<void, RemoveStudentError>> {
  try {
    const membership = await deps.personRepo.getMembership(input.personId, input.classroomId);

    if (!membership) {
      return err({ type: 'NOT_FOUND' });
    }

    await deps.personRepo.updateMembership(membership.id, {
      isActive: false,
      leftAt: deps.clock.now()
    });

    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
