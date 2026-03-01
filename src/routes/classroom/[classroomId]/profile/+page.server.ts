import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getProfile } from '$lib/application/useCases/person/getProfile';
import { updateProfile } from '$lib/application/useCases/person/updateProfile';
import { getClassroomSettings } from '$lib/application/useCases/classroom/getClassroomSettings';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const parentData = await parent();

  if (!parentData.settings?.modules.profile?.enabled) {
    redirect(302, `/classroom/${parentData.classroom.id}`);
  }

  const actor = locals.actor!;
  const env = getEnvironment();

  const profileResult = await getProfile(
    { personRepo: env.personRepo },
    { personId: actor.personId }
  );

  return {
    profile:
      profileResult.status === 'ok'
        ? profileResult.value
        : {
            id: actor.personId,
            displayName: '',
            legalName: '',
            pronouns: null,
            askMeAbout: [],
            themeColor: null,
            currentlyWorkingOn: null,
            helpQueueVisible: true,
            email: null
          }
  };
};

export const actions: Actions = {
  updateProfile: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.profile?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

    const formData = await request.formData();
    const displayName = formData.get('displayName') as string;
    const pronouns = (formData.get('pronouns') as string) || null;
    const askMeAboutRaw = formData.get('askMeAbout') as string;
    const askMeAbout = askMeAboutRaw
      ? askMeAboutRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const themeColor = (formData.get('themeColor') as string) || null;
    const currentlyWorkingOn = (formData.get('currentlyWorkingOn') as string) || null;
    const helpQueueVisible = formData.get('helpQueueVisible') !== 'false';

    const result = await updateProfile(
      { personRepo: env.personRepo, eventStore: env.eventStore },
      {
        personId: actor.personId,
        displayName,
        pronouns,
        askMeAbout,
        themeColor,
        currentlyWorkingOn,
        helpQueueVisible
      }
    );

    if (result.status === 'err') {
      const errorMessage =
        result.error.type === 'NOT_FOUND' ? 'Profile not found' : result.error.message;
      return fail(400, { error: errorMessage });
    }

    return { success: true };
  }
};
