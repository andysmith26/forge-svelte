import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getProfile } from '$lib/application/useCases/person/getProfile';
import { updateProfile } from '$lib/application/useCases/person/updateProfile';

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
            email: null
          }
  };
};

export const actions: Actions = {
  updateProfile: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

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

    const env = getEnvironment();
    const result = await updateProfile(
      { personRepo: env.personRepo },
      { personId: actor.personId, displayName, pronouns, askMeAbout }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.message });
    }

    return { success: true };
  }
};
