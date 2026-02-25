import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { ClassroomModule, ClassroomSettings } from '$lib/domain/types/classroom-settings';
import { parseClassroomSettings } from '$lib/domain/types/classroom-settings';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type UpdateModulesError =
  | { type: 'NOT_FOUND'; classroomId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function updateModules(
  deps: { classroomRepo: ClassroomRepository },
  input: {
    classroomId: string;
    modules: Partial<Record<ClassroomModule, boolean>>;
  }
): Promise<Result<ClassroomSettings, UpdateModulesError>> {
  try {
    const classroom = await deps.classroomRepo.getById(input.classroomId);

    if (!classroom) {
      return err({ type: 'NOT_FOUND', classroomId: input.classroomId });
    }

    const currentSettings = parseClassroomSettings(classroom.settings);

    const updatedSettings: ClassroomSettings = {
      ...currentSettings,
      modules: { ...currentSettings.modules }
    };

    for (const [module, enabled] of Object.entries(input.modules)) {
      if (enabled !== undefined && module in updatedSettings.modules) {
        updatedSettings.modules[module as ClassroomModule] = { enabled };
      }
    }

    await deps.classroomRepo.updateSettings(input.classroomId, updatedSettings);

    return ok(updatedSettings);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
