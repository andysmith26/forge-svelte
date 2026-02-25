import type {
  ClassroomRepository,
  ClassroomRecord
} from '$lib/application/ports/ClassroomRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetClassroomError =
  | { type: 'NOT_FOUND'; classroomId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function getClassroom(
  deps: { classroomRepo: ClassroomRepository },
  input: { classroomId: string }
): Promise<Result<ClassroomRecord, GetClassroomError>> {
  try {
    const classroom = await deps.classroomRepo.getById(input.classroomId);

    if (!classroom) {
      return err({ type: 'NOT_FOUND', classroomId: input.classroomId });
    }

    return ok(classroom);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
