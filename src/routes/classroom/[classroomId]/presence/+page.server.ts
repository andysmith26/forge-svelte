import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { signIn } from '$lib/application/useCases/presence/signIn';
import { signOut } from '$lib/application/useCases/presence/signOut';
import { getSignInStatus } from '$lib/application/useCases/presence/getSignInStatus';
import { listPresent } from '$lib/application/useCases/presence/listPresent';
import { listSignInsForSession } from '$lib/application/useCases/presence/listSignInsForSession';
import { getCurrentSession } from '$lib/application/useCases/session/getCurrentSession';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const parentData = await parent();
  const env = getEnvironment();
  const actor = locals.actor!;
  const session = parentData.currentSession;

  if (!session) {
    return { present: [], signInStatus: null, signIns: [] };
  }

  const [presentResult, statusResult, signInsResult] = await Promise.all([
    listPresent({ presenceRepo: env.presenceRepo }, { sessionId: session.id }),
    getSignInStatus(
      { presenceRepo: env.presenceRepo },
      { sessionId: session.id, personId: actor.personId }
    ),
    parentData.membership.role === 'teacher'
      ? listSignInsForSession({ presenceRepo: env.presenceRepo }, { sessionId: session.id })
      : Promise.resolve({ status: 'ok' as const, value: [] })
  ]);

  return {
    present:
      presentResult.status === 'ok'
        ? presentResult.value.map((p) => ({
            id: p.id,
            displayName: p.displayName,
            pronouns: p.pronouns,
            askMeAbout: p.askMeAbout
          }))
        : [],
    signInStatus:
      statusResult.status === 'ok' && statusResult.value
        ? {
            isSignedIn: !statusResult.value.signedOutAt,
            signedInAt: statusResult.value.signedInAt.toISOString()
          }
        : { isSignedIn: false, signedInAt: null },
    signIns:
      signInsResult.status === 'ok'
        ? signInsResult.value.map((s) => ({
            id: s.id,
            personId: s.personId,
            displayName: s.person.displayName,
            signedInAt: s.signedInAt.toISOString(),
            signedOutAt: s.signedOutAt?.toISOString() ?? null
          }))
        : []
  };
};

export const actions: Actions = {
  signIn: async ({ locals, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const sessionResult = await getCurrentSession(
      { sessionRepo: env.sessionRepo },
      { classroomId: params.classroomId }
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

  signOut: async ({ locals, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const sessionResult = await getCurrentSession(
      { sessionRepo: env.sessionRepo },
      { classroomId: params.classroomId }
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
  },

  signInOther: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const sessionResult = await getCurrentSession(
      { sessionRepo: env.sessionRepo },
      { classroomId: params.classroomId }
    );
    if (sessionResult.status !== 'ok' || !sessionResult.value) {
      return fail(400, { error: 'No active session' });
    }

    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    if (!personId) return fail(400, { error: 'Missing personId' });

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
        personId,
        actorId: actor.personId,
        pinClassroomId: null
      }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  signOutOther: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const sessionResult = await getCurrentSession(
      { sessionRepo: env.sessionRepo },
      { classroomId: params.classroomId }
    );
    if (sessionResult.status !== 'ok' || !sessionResult.value) {
      return fail(400, { error: 'No active session' });
    }

    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    if (!personId) return fail(400, { error: 'Missing personId' });

    const result = await signOut(
      {
        sessionRepo: env.sessionRepo,
        presenceRepo: env.presenceRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      {
        sessionId: sessionResult.value.id,
        personId,
        actorId: actor.personId,
        pinClassroomId: null
      }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  }
};
