import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getCurrentSession } from '$lib/application/useCases/session/getCurrentSession';
import { getSignInStatus } from '$lib/application/useCases/presence/getSignInStatus';
import { signIn } from '$lib/application/useCases/presence/signIn';
import { signOut } from '$lib/application/useCases/presence/signOut';
import { getClassroom } from '$lib/application/useCases/classroom/getClassroom';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.actor || locals.actor.authType !== 'pin') {
    redirect(302, '/auth/signin');
  }

  const env = getEnvironment();
  const classroomId = locals.actor.pinClassroomId!;

  const classroomResult = await getClassroom(
    { classroomRepo: env.classroomRepo },
    { classroomId }
  );

  const sessionResult = await getCurrentSession(
    { sessionRepo: env.sessionRepo },
    { classroomId }
  );

  const session =
    sessionResult.status === 'ok' && sessionResult.value
      ? {
          id: sessionResult.value.id,
          name: sessionResult.value.name,
          status: sessionResult.value.status
        }
      : null;

  let signInStatus = { isSignedIn: false };
  if (session && session.status === 'active') {
    const statusResult = await getSignInStatus(
      { presenceRepo: env.presenceRepo },
      { sessionId: session.id, personId: locals.actor.personId }
    );
    if (statusResult.status === 'ok' && statusResult.value && !statusResult.value.signedOutAt) {
      signInStatus = { isSignedIn: true };
    }
  }

  return {
    classroomName: classroomResult.status === 'ok' ? classroomResult.value.name : 'Classroom',
    displayName: locals.pinSession?.displayName ?? 'Student',
    currentSession: session,
    signInStatus,
    actor: locals.actor
  };
};

export const actions: Actions = {
  signIn: async ({ locals }) => {
    const actor = locals.actor;
    if (!actor || actor.authType !== 'pin') return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const sessionResult = await getCurrentSession(
      { sessionRepo: env.sessionRepo },
      { classroomId: actor.pinClassroomId! }
    );

    if (sessionResult.status !== 'ok' || !sessionResult.value) {
      return fail(400, { error: 'No active session' });
    }

    const result = await signIn(
      {
        sessionRepo: env.sessionRepo,
        presenceRepo: env.presenceRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      {
        sessionId: sessionResult.value.id,
        personId: actor.personId,
        actorId: actor.personId,
        pinClassroomId: actor.pinClassroomId
      }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  signOut: async ({ locals }) => {
    const actor = locals.actor;
    if (!actor || actor.authType !== 'pin') return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const sessionResult = await getCurrentSession(
      { sessionRepo: env.sessionRepo },
      { classroomId: actor.pinClassroomId! }
    );

    if (sessionResult.status !== 'ok' || !sessionResult.value) {
      return fail(400, { error: 'No active session' });
    }

    const result = await signOut(
      {
        sessionRepo: env.sessionRepo,
        presenceRepo: env.presenceRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      {
        sessionId: sessionResult.value.id,
        personId: actor.personId,
        actorId: actor.personId,
        pinClassroomId: actor.pinClassroomId
      }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  }
};
