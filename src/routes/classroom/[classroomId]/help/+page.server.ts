import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getHelpQueue } from '$lib/application/useCases/help/getHelpQueue';
import { listCategories } from '$lib/application/useCases/help/listCategories';
import { getMyOpenRequests } from '$lib/application/useCases/help/getMyOpenRequests';
import { requestHelp } from '$lib/application/useCases/help/requestHelp';
import { cancelHelpRequest } from '$lib/application/useCases/help/cancelHelpRequest';
import { claimHelpRequest } from '$lib/application/useCases/help/claimHelpRequest';
import { unclaimHelpRequest } from '$lib/application/useCases/help/unclaimHelpRequest';
import { resolveHelpRequest } from '$lib/application/useCases/help/resolveHelpRequest';
import { getCurrentSession } from '$lib/application/useCases/session/getCurrentSession';
import { getClassroomSettings } from '$lib/application/useCases/classroom/getClassroomSettings';
import type { HelpUrgency } from '$lib/domain/types/help-urgency';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const parentData = await parent();

  if (!parentData.settings?.modules.help?.enabled) {
    redirect(302, `/classroom/${parentData.classroom.id}`);
  }

  const env = getEnvironment();
  const actor = locals.actor!;
  const session = parentData.currentSession;

  if (!session) {
    return { queue: [], categories: [], myRequests: [] };
  }

  const [queueResult, categoriesResult, myRequestsResult] = await Promise.all([
    getHelpQueue({ helpRepo: env.helpRepo }, { sessionId: session.id }),
    listCategories({ helpRepo: env.helpRepo }, { classroomId: parentData.classroom.id }),
    getMyOpenRequests(
      { helpRepo: env.helpRepo },
      { sessionId: session.id, personId: actor.personId }
    )
  ]);

  return {
    queue:
      queueResult.status === 'ok'
        ? queueResult.value.map((item) => ({
            id: item.id,
            description: item.description,
            whatITried: item.whatITried,
            urgency: item.urgency,
            status: item.status,
            createdAt: item.createdAt.toISOString(),
            claimedAt: item.claimedAt?.toISOString() ?? null,
            requester: item.requester,
            category: item.category,
            claimedBy: item.claimedBy
          }))
        : [],
    categories:
      categoriesResult.status === 'ok'
        ? categoriesResult.value.filter((c) => c.isActive).map((c) => ({ id: c.id, name: c.name }))
        : [],
    myRequests:
      myRequestsResult.status === 'ok'
        ? myRequestsResult.value.map((r) => ({
            id: r.id,
            description: r.description,
            urgency: r.urgency,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            category: r.category,
            claimedBy: r.claimedBy
          }))
        : []
  };
};

export const actions: Actions = {
  requestHelp: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.help?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

    const sessionResult = await getCurrentSession(
      { sessionRepo: env.sessionRepo },
      { classroomId: params.classroomId }
    );
    if (sessionResult.status !== 'ok' || !sessionResult.value) {
      return fail(400, { error: 'No active session' });
    }

    const formData = await request.formData();
    const description = (formData.get('description') as string)?.trim();
    const whatITried = (formData.get('whatITried') as string)?.trim();
    const urgency = formData.get('urgency') as HelpUrgency;
    const categoryId = (formData.get('categoryId') as string) || null;

    if (!description) return fail(400, { error: 'Description is required' });
    if (!whatITried) return fail(400, { error: 'What you tried is required' });
    if (!urgency) return fail(400, { error: 'Urgency is required' });

    const result = await requestHelp(
      {
        helpRepo: env.helpRepo,
        sessionRepo: env.sessionRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      {
        sessionId: sessionResult.value.id,
        requesterId: actor.personId,
        categoryId,
        description,
        whatITried,
        urgency,
        pinClassroomId: actor.pinClassroomId
      }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true, queuePosition: result.value.queuePosition };
  },

  cancelRequest: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.help?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

    const formData = await request.formData();
    const requestId = formData.get('requestId') as string;
    if (!requestId) return fail(400, { error: 'Missing requestId' });

    const result = await cancelHelpRequest(
      {
        helpRepo: env.helpRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      { requestId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  claim: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.help?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

    const formData = await request.formData();
    const requestId = formData.get('requestId') as string;
    if (!requestId) return fail(400, { error: 'Missing requestId' });

    const result = await claimHelpRequest(
      {
        helpRepo: env.helpRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      { requestId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  unclaim: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.help?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

    const formData = await request.formData();
    const requestId = formData.get('requestId') as string;
    if (!requestId) return fail(400, { error: 'Missing requestId' });

    const result = await unclaimHelpRequest(
      {
        helpRepo: env.helpRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      { requestId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  resolve: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.help?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

    const formData = await request.formData();
    const requestId = formData.get('requestId') as string;
    const resolutionNotes = (formData.get('resolutionNotes') as string) || undefined;
    if (!requestId) return fail(400, { error: 'Missing requestId' });

    const result = await resolveHelpRequest(
      {
        helpRepo: env.helpRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      { requestId, actorId: actor.personId, resolutionNotes }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  }
};
