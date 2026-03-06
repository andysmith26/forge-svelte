import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { listChores } from '$lib/application/useCases/chores/listChores';
import { listAvailableChores } from '$lib/application/useCases/chores/listAvailableChores';
import { defineChore } from '$lib/application/useCases/chores/defineChore';
import { archiveChore } from '$lib/application/useCases/chores/archiveChore';
import { claimChore } from '$lib/application/useCases/chores/claimChore';
import { createChoreInstances } from '$lib/application/useCases/chores/createChoreInstances';
import { getClassroomSettings } from '$lib/application/useCases/classroom/getClassroomSettings';
import type {
  ChoreSize,
  ChoreRecurrence,
  ChoreVerificationType
} from '$lib/domain/entities/chore.entity';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const parentData = await parent();

  if (!parentData.settings?.modules.chores?.enabled) {
    redirect(302, `/classroom/${parentData.classroom.id}`);
  }

  const env = getEnvironment();
  const actor = locals.actor!;
  const isTeacher = parentData.membership.role === 'teacher';

  if (isTeacher) {
    const result = await listChores(
      { choreRepo: env.choreRepo, personRepo: env.personRepo },
      { schoolId: parentData.classroom.schoolId, actorId: actor.personId, includeArchived: true }
    );

    const chores =
      result.status === 'ok'
        ? result.value.chores.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            size: c.size,
            recurrence: c.recurrence,
            verificationType: c.verificationType,
            location: c.location,
            isActive: c.isActive,
            activeInstanceCount: c.activeInstanceCount,
            createdAt: c.createdAt.toISOString()
          }))
        : [];

    const needingVerification = await env.choreRepo.listNeedingVerification(
      parentData.classroom.schoolId
    );

    return {
      chores,
      needingVerification: needingVerification.map((i) => ({
        id: i.id,
        choreId: i.choreId,
        choreName: i.chore.name,
        status: i.status,
        claimedBy: i.claimedBy,
        completedAt: i.completedAt?.toISOString() ?? null,
        completionNotes: i.completionNotes
      })),
      available: [],
      myChores: []
    };
  }

  // Student view
  const result = await listAvailableChores(
    { choreRepo: env.choreRepo, personRepo: env.personRepo },
    { schoolId: parentData.classroom.schoolId, actorId: actor.personId }
  );

  if (result.status === 'err') {
    return { chores: [], available: [], myChores: [], needingVerification: [] };
  }

  const mapInstance = (i: (typeof result.value.available)[number]) => ({
    id: i.id,
    choreId: i.choreId,
    choreName: i.chore.name,
    verificationType: i.chore.verificationType,
    status: i.status,
    claimedBy: i.claimedBy,
    claimedAt: i.claimedAt?.toISOString() ?? null,
    completedAt: i.completedAt?.toISOString() ?? null,
    completionNotes: i.completionNotes,
    verifications: i.verifications.map((v) => ({
      decision: v.decision,
      feedback: v.feedback,
      verifier: v.verifier,
      verifiedAt: v.verifiedAt.toISOString()
    }))
  });

  return {
    chores: [],
    available: result.value.available.map(mapInstance),
    myChores: result.value.myChores.map(mapInstance),
    needingVerification: []
  };
};

export const actions: Actions = {
  defineChore: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.chores?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim();
    const size = (formData.get('size') as string) || 'medium';
    const recurrence = (formData.get('recurrence') as string) || 'one_time';
    const verificationType = (formData.get('verificationType') as string) || 'self';
    const location = (formData.get('location') as string)?.trim() || null;

    if (!name) return fail(400, { error: 'Chore name is required' });
    if (!description) return fail(400, { error: 'Chore description is required' });

    const classroom = await env.classroomRepo.getById(params.classroomId);
    if (!classroom) return fail(404, { error: 'Classroom not found' });

    const result = await defineChore(
      {
        choreRepo: env.choreRepo,
        classroomRepo: env.classroomRepo,
        personRepo: env.personRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      {
        schoolId: classroom.schoolId,
        name,
        description,
        size: size as ChoreSize,
        recurrence: recurrence as ChoreRecurrence,
        verificationType: verificationType as ChoreVerificationType,
        location,
        createdById: actor.personId
      }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        DUPLICATE_NAME: 'A chore with this name already exists',
        VALIDATION_ERROR: result.error.type === 'VALIDATION_ERROR' ? result.error.message : '',
        NOT_TEACHER: 'Only teachers can create chores',
        NOT_SCHOOL_MEMBER: 'You are not a member of this school'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true, choreId: result.value.chore.id };
  },

  createInstances: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const choreId = formData.get('choreId') as string;
    const count = parseInt(formData.get('count') as string) || 1;

    if (!choreId) return fail(400, { error: 'Missing choreId' });

    const result = await createChoreInstances(
      {
        choreRepo: env.choreRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      { choreId, actorId: actor.personId, count }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  archiveChore: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const choreId = formData.get('choreId') as string;
    if (!choreId) return fail(400, { error: 'Missing choreId' });

    const result = await archiveChore(
      {
        choreRepo: env.choreRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      { choreId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  claimChore: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const instanceId = formData.get('instanceId') as string;
    if (!instanceId) return fail(400, { error: 'Missing instanceId' });

    const classroom = await env.classroomRepo.getById(params.classroomId);
    if (!classroom) return fail(404, { error: 'Classroom not found' });

    const result = await claimChore(
      {
        choreRepo: env.choreRepo,
        personRepo: env.personRepo,
        eventStore: env.eventStore
      },
      { instanceId, actorId: actor.personId, schoolId: classroom.schoolId }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        NOT_AVAILABLE: 'This chore has already been claimed',
        INSTANCE_NOT_FOUND: 'Chore instance not found'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true };
  }
};
