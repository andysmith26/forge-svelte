import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { listDomains } from '$lib/application/useCases/ninja/listDomains';
import { createDomain } from '$lib/application/useCases/ninja/createDomain';
import { updateDomain } from '$lib/application/useCases/ninja/updateDomain';
import { archiveDomain } from '$lib/application/useCases/ninja/archiveDomain';
import { assignNinja } from '$lib/application/useCases/ninja/assignNinja';
import { revokeNinja } from '$lib/application/useCases/ninja/revokeNinja';
import { getDomainsWithNinjas } from '$lib/application/useCases/ninja/getDomainsWithNinjas';
import { listStudents } from '$lib/application/useCases/person/listStudents';

export const load: PageServerLoad = async ({ parent }) => {
  const parentData = await parent();
  const env = getEnvironment();

  const [domainsResult, domainsWithNinjasResult, studentsResult] = await Promise.all([
    listDomains({ ninjaRepo: env.ninjaRepo }, { classroomId: parentData.classroom.id }),
    getDomainsWithNinjas({ ninjaRepo: env.ninjaRepo }, { classroomId: parentData.classroom.id }),
    listStudents({ personRepo: env.personRepo }, { classroomId: parentData.classroom.id })
  ]);

  return {
    domains:
      domainsResult.status === 'ok'
        ? domainsResult.value.filter((d) => d.isActive).map((d) => ({
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
    students:
      studentsResult.status === 'ok'
        ? studentsResult.value.map((s) => ({
            id: s.id,
            displayName: s.displayName
          }))
        : []
  };
};

export const actions: Actions = {
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
    const result = await archiveDomain(
      { ninjaRepo: env.ninjaRepo, clock: env.clock },
      { domainId }
    );

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
      { ninjaRepo: env.ninjaRepo, classroomRepo: env.classroomRepo, clock: env.clock },
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
    const result = await revokeNinja(
      { ninjaRepo: env.ninjaRepo, clock: env.clock },
      { personId, domainId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  }
};
