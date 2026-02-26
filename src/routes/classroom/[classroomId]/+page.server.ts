import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getProfile } from '$lib/application/useCases/person/getProfile';
import { createAndStartSession } from '$lib/application/useCases/session/createAndStartSession';
import { endSession } from '$lib/application/useCases/session/endSession';
import { cancelSession } from '$lib/application/useCases/session/cancelSession';
import { getSignInStatus } from '$lib/application/useCases/presence/getSignInStatus';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const parentData = await parent();
  const env = getEnvironment();
  const actor = locals.actor!;

  const profileResult = await getProfile(
    { personRepo: env.personRepo },
    { personId: actor.personId }
  );

  let signInStatus: { isSignedIn: boolean } = { isSignedIn: false };
  if (parentData.currentSession) {
    const statusResult = await getSignInStatus(
      { presenceRepo: env.presenceRepo },
      { sessionId: parentData.currentSession.id, personId: actor.personId }
    );
    if (statusResult.status === 'ok' && statusResult.value && !statusResult.value.signedOutAt) {
      signInStatus = { isSignedIn: true };
    }
  }

  return {
    profile:
      profileResult.status === 'ok'
        ? {
            displayName: profileResult.value.displayName,
            pronouns: profileResult.value.pronouns,
            askMeAbout: profileResult.value.askMeAbout
          }
        : null,
    signInStatus
  };
};

export const actions: Actions = {
  createAndStart: async ({ locals, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const result = await createAndStartSession(
      {
        sessionRepo: env.sessionRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      { classroomId: params.classroomId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  endSession: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    if (!sessionId) return fail(400, { error: 'Missing sessionId' });

    const env = getEnvironment();
    const result = await endSession(
      {
        sessionRepo: env.sessionRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      { sessionId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  cancelSession: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    if (!sessionId) return fail(400, { error: 'Missing sessionId' });

    const env = getEnvironment();
    const result = await cancelSession({ sessionRepo: env.sessionRepo }, { sessionId });

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  }
};
