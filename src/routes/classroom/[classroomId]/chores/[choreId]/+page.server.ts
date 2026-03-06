import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { updateChore } from '$lib/application/useCases/chores/updateChore';
import { completeChore } from '$lib/application/useCases/chores/completeChore';
import { verifyChore } from '$lib/application/useCases/chores/verifyChore';
import type {
  ChoreSize,
  ChoreRecurrence,
  ChoreVerificationType
} from '$lib/domain/entities/chore.entity';

export const load: PageServerLoad = async ({ parent, params }) => {
  const parentData = await parent();

  if (!parentData.settings?.modules.chores?.enabled) {
    redirect(302, `/classroom/${parentData.classroom.id}`);
  }

  const env = getEnvironment();

  const chore = await env.choreRepo.getById(params.choreId);
  if (!chore) {
    redirect(302, `/classroom/${params.classroomId}/chores`);
  }

  const instances = await env.choreRepo.listInstances(params.choreId);
  const instancesWithRelations = await Promise.all(
    instances.map((i) => env.choreRepo.getInstanceWithRelations(i.id))
  );

  return {
    chore: {
      id: chore.id,
      name: chore.name,
      description: chore.description,
      size: chore.size,
      recurrence: chore.recurrence,
      verificationType: chore.verificationType,
      location: chore.location,
      isActive: chore.isActive,
      createdAt: chore.createdAt.toISOString()
    },
    instances: instancesWithRelations
      .filter((i) => i !== null)
      .map((i) => ({
        id: i.id,
        choreId: i.choreId,
        status: i.status,
        claimedBy: i.claimedBy,
        claimedAt: i.claimedAt?.toISOString() ?? null,
        completedAt: i.completedAt?.toISOString() ?? null,
        completionNotes: i.completionNotes,
        createdAt: i.createdAt.toISOString(),
        verifications: i.verifications.map((v) => ({
          decision: v.decision,
          feedback: v.feedback,
          verifier: v.verifier,
          verifiedAt: v.verifiedAt.toISOString()
        }))
      }))
  };
};

export const actions: Actions = {
  updateChore: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();

    const input: Record<string, unknown> = {
      choreId: params.choreId,
      actorId: actor.personId
    };

    const name = formData.get('name') as string | null;
    const description = formData.get('description') as string | null;
    const size = formData.get('size') as string | null;
    const recurrence = formData.get('recurrence') as string | null;
    const verificationType = formData.get('verificationType') as string | null;
    const location = formData.get('location') as string | null;

    if (name) input.name = name.trim();
    if (description) input.description = description.trim();
    if (size) input.size = size as ChoreSize;
    if (recurrence) input.recurrence = recurrence as ChoreRecurrence;
    if (verificationType) input.verificationType = verificationType as ChoreVerificationType;
    if (location !== null) input.location = location.trim() || null;

    const result = await updateChore(
      {
        choreRepo: env.choreRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      input as Parameters<typeof updateChore>[1]
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  completeChore: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const instanceId = formData.get('instanceId') as string;
    const completionNotes = (formData.get('completionNotes') as string)?.trim() || null;

    if (!instanceId) return fail(400, { error: 'Missing instanceId' });

    const classroom = await env.classroomRepo.getById(params.classroomId);
    if (!classroom) return fail(404, { error: 'Classroom not found' });

    const result = await completeChore(
      { choreRepo: env.choreRepo, eventStore: env.eventStore },
      {
        instanceId,
        actorId: actor.personId,
        schoolId: classroom.schoolId,
        completionNotes
      }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        NOT_CLAIMED_BY_ACTOR: 'You can only complete chores you claimed',
        INVALID_STATUS: 'This chore cannot be completed in its current state'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true };
  },

  verifyChore: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const instanceId = formData.get('instanceId') as string;
    const decision = formData.get('decision') as 'approved' | 'redo_requested';
    const feedback = (formData.get('feedback') as string)?.trim() || null;

    if (!instanceId) return fail(400, { error: 'Missing instanceId' });
    if (!decision) return fail(400, { error: 'Missing decision' });

    const classroom = await env.classroomRepo.getById(params.classroomId);
    if (!classroom) return fail(404, { error: 'Classroom not found' });

    const result = await verifyChore(
      {
        choreRepo: env.choreRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      {
        instanceId,
        verifierId: actor.personId,
        schoolId: classroom.schoolId,
        decision,
        feedback
      }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        CANNOT_VERIFY_OWN: 'You cannot verify your own chore',
        INVALID_STATUS: 'This chore is not ready for verification'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true };
  }
};
