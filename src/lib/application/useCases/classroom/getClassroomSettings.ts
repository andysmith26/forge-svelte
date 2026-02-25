import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { ClassroomSettings } from '$lib/domain/types/classroom-settings';
import { parseClassroomSettings } from '$lib/domain/types/classroom-settings';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetClassroomSettingsError =
  | { type: 'NOT_FOUND'; classroomId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function getClassroomSettings(
  deps: { classroomRepo: ClassroomRepository },
  input: { classroomId: string }
): Promise<Result<ClassroomSettings, GetClassroomSettingsError>> {
  try {
    const classroom = await deps.classroomRepo.getById(input.classroomId);

    if (!classroom) {
      return err({ type: 'NOT_FOUND', classroomId: input.classroomId });
    }

    return ok(parseClassroomSettings(classroom.settings));
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
