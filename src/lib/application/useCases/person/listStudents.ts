import type { PersonRepository, StudentSummary } from '$lib/application/ports/PersonRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListStudentsError = { type: 'INTERNAL_ERROR'; message: string };

export async function listStudents(
  deps: { personRepo: PersonRepository },
  input: { classroomId: string }
): Promise<Result<StudentSummary[], ListStudentsError>> {
  try {
    const students = await deps.personRepo.listStudents(input.classroomId);
    return ok(students);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
