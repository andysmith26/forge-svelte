import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getProfile } from '$lib/application/useCases/person/getProfile';
import { createAndStartSession } from '$lib/application/useCases/session/createAndStartSession';
import { endSession } from '$lib/application/useCases/session/endSession';
import { cancelSession } from '$lib/application/useCases/session/cancelSession';
import { getSignInStatus } from '$lib/application/useCases/presence/getSignInStatus';
import { signIn } from '$lib/application/useCases/presence/signIn';
import { signOut } from '$lib/application/useCases/presence/signOut';
import { getCurrentSession } from '$lib/application/useCases/session/getCurrentSession';
import { getClassroomSettings } from '$lib/application/useCases/classroom/getClassroomSettings';
import { requireTeacher } from '$lib/application/useCases/checkAuthorization';
import { getHandoffPromptStatus } from '$lib/application/useCases/projects/getHandoffPromptStatus';
import { listUnresolvedItemsForStudent } from '$lib/application/useCases/projects/listUnresolvedItemsForStudent';
import { listAvailableChores } from '$lib/application/useCases/chores/listAvailableChores';
import { getMyOpenRequests } from '$lib/application/useCases/help/getMyOpenRequests';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const parentData = await parent();
  const env = getEnvironment();
  const actor = locals.actor!;
  const isTeacher = parentData.membership.role === 'teacher';

  const presenceEnabled = parentData.settings?.modules.presence?.enabled ?? false;
  const profileEnabled = parentData.settings?.modules.profile?.enabled ?? false;
  const projectsEnabled = parentData.settings?.modules.projects?.enabled ?? false;
  const choresEnabled = parentData.settings?.modules.chores?.enabled ?? false;
  const helpEnabled = parentData.settings?.modules.help?.enabled ?? false;

  const currentSession = parentData.currentSession;
  const schoolId = parentData.classroom.schoolId;

  // Teacher: only needs profile (for display) — keep existing behavior
  if (isTeacher) {
    const profileResult = await getProfile(
      { personRepo: env.personRepo },
      { personId: actor.personId }
    );

    return {
      profile:
        profileResult.status === 'ok'
          ? {
              displayName: profileResult.value.displayName,
              pronouns: profileResult.value.pronouns,
              askMeAbout: profileResult.value.askMeAbout,
              themeColor: profileResult.value.themeColor,
              currentlyWorkingOn: profileResult.value.currentlyWorkingOn,
              helpQueueVisible: profileResult.value.helpQueueVisible
            }
          : null,
      signInStatus: { isSignedIn: false },
      projectsMissingHandoff: null,
      unresolvedItems: null,
      chores: null,
      openHelpRequests: null
    };
  }

  // Student: fetch all panel data in parallel
  const [profileResult, signInResult, handoffResult, unresolvedResult, choresResult, helpResult] =
    await Promise.all([
      getProfile({ personRepo: env.personRepo }, { personId: actor.personId }),
      presenceEnabled && currentSession
        ? getSignInStatus(
            { presenceRepo: env.presenceRepo },
            { sessionId: currentSession.id, personId: actor.personId }
          )
        : Promise.resolve(null),
      projectsEnabled && currentSession
        ? getHandoffPromptStatus(
            { projectRepo: env.projectRepo, sessionRepo: env.sessionRepo },
            { schoolId, personId: actor.personId, sessionId: currentSession.id }
          )
        : Promise.resolve(null),
      projectsEnabled
        ? listUnresolvedItemsForStudent(
            { projectRepo: env.projectRepo },
            { schoolId, personId: actor.personId }
          )
        : Promise.resolve(null),
      choresEnabled
        ? listAvailableChores(
            { choreRepo: env.choreRepo, personRepo: env.personRepo },
            { schoolId, actorId: actor.personId }
          )
        : Promise.resolve(null),
      helpEnabled && currentSession
        ? getMyOpenRequests(
            { helpRepo: env.helpRepo },
            { sessionId: currentSession.id, personId: actor.personId }
          )
        : Promise.resolve(null)
    ]);

  const signInStatus = { isSignedIn: false };
  if (
    signInResult &&
    signInResult.status === 'ok' &&
    signInResult.value &&
    !signInResult.value.signedOutAt
  ) {
    signInStatus.isSignedIn = true;
  }

  return {
    profile:
      profileResult.status === 'ok'
        ? {
            displayName: profileResult.value.displayName,
            pronouns: profileResult.value.pronouns,
            askMeAbout: profileResult.value.askMeAbout,
            themeColor: profileResult.value.themeColor,
            currentlyWorkingOn: profileResult.value.currentlyWorkingOn,
            helpQueueVisible: profileResult.value.helpQueueVisible
          }
        : null,
    signInStatus,
    projectsMissingHandoff:
      handoffResult && handoffResult.status === 'ok'
        ? handoffResult.value.projectsMissingHandoff
        : null,
    unresolvedItems:
      unresolvedResult && unresolvedResult.status === 'ok'
        ? unresolvedResult.value.map((item) => ({
            handoffId: item.handoffId,
            projectId: item.projectId,
            projectName: item.projectName,
            itemType: item.itemType,
            content: item.content,
            authorName: item.authorName,
            responseCount: item.responseCount
          }))
        : null,
    chores:
      choresResult && choresResult.status === 'ok'
        ? {
            available: choresResult.value.available.map((c) => ({
              id: c.id,
              choreId: c.chore.id,
              choreName: c.chore.name,
              verificationType: c.chore.verificationType
            })),
            myChores: choresResult.value.myChores.map((c) => ({
              id: c.id,
              choreId: c.chore.id,
              choreName: c.chore.name,
              status: c.status
            }))
          }
        : null,
    openHelpRequests:
      helpResult && helpResult.status === 'ok'
        ? helpResult.value.map((r) => ({
            id: r.id,
            description: r.description,
            status: r.status,
            urgency: r.urgency,
            categoryName: r.category?.name ?? null
          }))
        : null
  };
};

export const actions: Actions = {
  createAndStart: async ({ locals, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const authResult = await requireTeacher(
      { classroomRepo: env.classroomRepo },
      actor.personId,
      params.classroomId
    );
    if (authResult.status === 'err') return fail(403, { error: authResult.error.type });

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

  endSession: async ({ locals, request, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    if (!sessionId) return fail(400, { error: 'Missing sessionId' });

    const env = getEnvironment();
    const authResult = await requireTeacher(
      { classroomRepo: env.classroomRepo },
      actor.personId,
      params.classroomId
    );
    if (authResult.status === 'err') return fail(403, { error: authResult.error.type });

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

  cancelSession: async ({ locals, request, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string;
    if (!sessionId) return fail(400, { error: 'Missing sessionId' });

    const env = getEnvironment();
    const authResult = await requireTeacher(
      { classroomRepo: env.classroomRepo },
      actor.personId,
      params.classroomId
    );
    if (authResult.status === 'err') return fail(403, { error: authResult.error.type });

    const result = await cancelSession({ sessionRepo: env.sessionRepo }, { sessionId });

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  signIn: async ({ locals, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.presence?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

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
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.presence?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

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
  }
};
