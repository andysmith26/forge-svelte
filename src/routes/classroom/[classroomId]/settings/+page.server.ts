import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getClassroomSettings } from '$lib/application/useCases/classroom/getClassroomSettings';
import { updateModules } from '$lib/application/useCases/classroom/updateModules';
import {
  CLASSROOM_MODULES,
  DEFAULT_CLASSROOM_SETTINGS,
  type ClassroomModule
} from '$lib/domain/types/classroom-settings';

export const load: PageServerLoad = async ({ parent }) => {
  const parentData = await parent();
  const env = getEnvironment();

  const settingsResult = await getClassroomSettings(
    { classroomRepo: env.classroomRepo },
    { classroomId: parentData.classroom.id }
  );

  return {
    classroomSettings:
      settingsResult.status === 'ok' ? settingsResult.value : DEFAULT_CLASSROOM_SETTINGS
  };
};

export const actions: Actions = {
  updateModules: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();

    const modules: Partial<Record<ClassroomModule, boolean>> = {};
    for (const mod of Object.values(CLASSROOM_MODULES)) {
      const value = formData.get(mod);
      if (value !== null) {
        modules[mod] = value === 'on';
      }
    }

    const env = getEnvironment();
    const result = await updateModules(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId, modules }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  }
};
