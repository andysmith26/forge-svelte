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
import { getNinjaPresence } from '$lib/application/useCases/ninja/getNinjaPresence';
import { listPresent } from '$lib/application/useCases/presence/listPresent';
import { getProfile } from '$lib/application/useCases/person/getProfile';
import { updateProfile } from '$lib/application/useCases/person/updateProfile';
import { listDomains } from '$lib/application/useCases/ninja/listDomains';
import { createDomain } from '$lib/application/useCases/ninja/createDomain';
import { updateDomain } from '$lib/application/useCases/ninja/updateDomain';
import { archiveDomain } from '$lib/application/useCases/ninja/archiveDomain';
import { assignNinja } from '$lib/application/useCases/ninja/assignNinja';
import { revokeNinja } from '$lib/application/useCases/ninja/revokeNinja';
import { getDomainsWithNinjas } from '$lib/application/useCases/ninja/getDomainsWithNinjas';
import { listStudents } from '$lib/application/useCases/person/listStudents';
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
    const profileResult = await getProfile(
      { personRepo: env.personRepo },
      { personId: actor.personId }
    );
    return {
      queue: [],
      categories: [],
      myRequests: [],
      ninjaHelpers: [],
      askMeAboutHelpers: [],
      myAskMeAbout: profileResult.status === 'ok' ? profileResult.value.askMeAbout : []
    };
  }

  const [
    queueResult,
    categoriesResult,
    myRequestsResult,
    ninjaResult,
    presentResult,
    profileResult
  ] = await Promise.all([
    getHelpQueue({ helpRepo: env.helpRepo }, { sessionId: session.id }),
    listCategories({ helpRepo: env.helpRepo }, { classroomId: parentData.classroom.id }),
    getMyOpenRequests(
      { helpRepo: env.helpRepo },
      { sessionId: session.id, personId: actor.personId }
    ),
    getNinjaPresence(
      {
        ninjaRepo: env.ninjaRepo,
        sessionRepo: env.sessionRepo,
        presenceRepo: env.presenceRepo
      },
      { sessionId: session.id }
    ),
    listPresent({ presenceRepo: env.presenceRepo }, { sessionId: session.id }),
    getProfile({ personRepo: env.personRepo }, { personId: actor.personId })
  ]);

  // Build ninja helpers: group assignments by person
  const ninjasByPerson = new Map<string, { displayName: string; domains: string[] }>();
  if (ninjaResult.status === 'ok') {
    for (const a of ninjaResult.value) {
      if (!a.isActive) continue;
      const existing = ninjasByPerson.get(a.personId);
      if (existing) {
        existing.domains.push(a.ninjaDomain.name);
      } else {
        ninjasByPerson.set(a.personId, {
          displayName: a.person.displayName,
          domains: [a.ninjaDomain.name]
        });
      }
    }
  }

  const ninjaHelpers = [...ninjasByPerson.entries()].map(([personId, data]) => ({
    personId,
    displayName: data.displayName,
    domains: data.domains
  }));

  // Build askMeAbout helpers from present people
  const askMeAboutHelpers =
    presentResult.status === 'ok'
      ? presentResult.value
          .filter((p) => p.askMeAbout.length > 0)
          .map((p) => ({
            personId: p.id,
            displayName: p.displayName,
            askMeAbout: p.askMeAbout
          }))
      : [];

  // Compute per-item canClaim for ninjas
  const ninjaPersonIds = new Set(ninjasByPerson.keys());
  const isActorNinja = ninjaPersonIds.has(actor.personId);
  const isTeacher = parentData.membership.role === 'teacher';

  return {
    queue:
      queueResult.status === 'ok'
        ? queueResult.value.map((item) => ({
            id: item.id,
            description: item.description,
            whatITried: item.whatITried,
            hypothesis: item.hypothesis,
            topic: item.topic,
            urgency: item.urgency,
            status: item.status,
            createdAt: item.createdAt.toISOString(),
            claimedAt: item.claimedAt?.toISOString() ?? null,
            requester: item.requester,
            category: item.category,
            claimedBy: item.claimedBy,
            canClaim:
              item.status === 'pending' &&
              item.requester.id !== actor.personId &&
              (isTeacher || isActorNinja)
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
        : [],
    ninjaHelpers,
    askMeAboutHelpers,
    myAskMeAbout: profileResult.status === 'ok' ? profileResult.value.askMeAbout : [],
    ...(isTeacher ? await loadNinjaManagementData(env, parentData.classroom.id) : {})
  };
};

async function loadNinjaManagementData(
  env: ReturnType<typeof getEnvironment>,
  classroomId: string
) {
  const [domainsResult, domainsWithNinjasResult, studentsResult] = await Promise.all([
    listDomains({ ninjaRepo: env.ninjaRepo }, { classroomId }),
    getDomainsWithNinjas({ ninjaRepo: env.ninjaRepo }, { classroomId }),
    listStudents({ personRepo: env.personRepo }, { classroomId })
  ]);

  return {
    ninjaDomains:
      domainsResult.status === 'ok'
        ? domainsResult.value
            .filter((d) => d.isActive)
            .map((d) => ({
              id: d.id,
              name: d.name,
              description: d.description,
              displayOrder: d.displayOrder
            }))
        : [],
    domainsWithNinjas:
      domainsWithNinjasResult.status === 'ok'
        ? domainsWithNinjasResult.value.map((d) => ({
            id: d.id,
            name: d.name,
            assignments: d.assignments
              .filter((a) => a.isActive)
              .map((a) => ({
                id: a.id,
                personId: a.personId,
                person: a.person
              }))
          }))
        : [],
    ninjaStudents:
      studentsResult.status === 'ok'
        ? studentsResult.value.map((s) => ({
            id: s.id,
            displayName: s.displayName
          }))
        : []
  };
}

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
    const hypothesis = (formData.get('hypothesis') as string)?.trim() || null;
    const topic = (formData.get('topic') as string)?.trim() || null;
    const urgencyRaw = (formData.get('urgency') as string) || null;
    const urgency = urgencyRaw as HelpUrgency | null;
    const categoryId = (formData.get('categoryId') as string) || null;

    if (!description) return fail(400, { error: 'Description is required' });
    if (!whatITried) return fail(400, { error: 'What you tried is required' });

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
        hypothesis,
        topic,
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

  updateAskMeAbout: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const askMeAbout = formData.getAll('askMeAbout').map((v) => String(v));

    const result = await updateProfile(
      { personRepo: env.personRepo, eventStore: env.eventStore },
      { personId: actor.personId, askMeAbout }
    );

    if (result.status === 'err') {
      return fail(400, {
        error: 'message' in result.error ? result.error.message : result.error.type
      });
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
  },

  createDomain: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;

    if (!name) return fail(400, { error: 'Name is required' });

    const env = getEnvironment();
    const result = await createDomain(
      { ninjaRepo: env.ninjaRepo },
      { classroomId: params.classroomId, name, description }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  updateDomain: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const domainId = formData.get('domainId') as string;
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;

    if (!domainId) return fail(400, { error: 'Missing domainId' });
    if (!name) return fail(400, { error: 'Name is required' });

    const env = getEnvironment();
    const result = await updateDomain(
      { ninjaRepo: env.ninjaRepo },
      { domainId, name, description }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  archiveDomain: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const domainId = formData.get('domainId') as string;
    if (!domainId) return fail(400, { error: 'Missing domainId' });

    const env = getEnvironment();
    const result = await archiveDomain({ ninjaRepo: env.ninjaRepo }, { domainId });

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  assignNinja: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    const domainId = formData.get('domainId') as string;
    if (!personId || !domainId) return fail(400, { error: 'Missing personId or domainId' });

    const env = getEnvironment();
    const result = await assignNinja(
      { ninjaRepo: env.ninjaRepo, classroomRepo: env.classroomRepo },
      { personId, domainId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  revokeNinja: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    const domainId = formData.get('domainId') as string;
    if (!personId || !domainId) return fail(400, { error: 'Missing personId or domainId' });

    const env = getEnvironment();
    const result = await revokeNinja({ ninjaRepo: env.ninjaRepo }, { personId, domainId });

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  }
};
