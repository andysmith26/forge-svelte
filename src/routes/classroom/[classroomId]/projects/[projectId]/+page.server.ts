import type { PageServerLoad, Actions } from './$types';
import { fail, error, redirect } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getProject } from '$lib/application/useCases/projects/getProject';
import { updateProject } from '$lib/application/useCases/projects/updateProject';
import { addMember } from '$lib/application/useCases/projects/addMember';
import { removeMember } from '$lib/application/useCases/projects/removeMember';
import { leaveProject } from '$lib/application/useCases/projects/leaveProject';
import { addSubsystem } from '$lib/application/useCases/projects/addSubsystem';
import { submitHandoff } from '$lib/application/useCases/projects/submitHandoff';
import { listHandoffs } from '$lib/application/useCases/projects/listHandoffs';
import { markAsRead } from '$lib/application/useCases/projects/markAsRead';
import { getCurrentSession } from '$lib/application/useCases/session/getCurrentSession';
import type { ProjectVisibility } from '$lib/domain/entities/project.entity';

export const load: PageServerLoad = async ({ locals, params, parent }) => {
  const parentData = await parent();

  if (!parentData.settings?.modules.projects?.enabled) {
    redirect(302, `/classroom/${params.classroomId}`);
  }

  const env = getEnvironment();
  const actor = locals.actor!;

  const result = await getProject(
    { projectRepo: env.projectRepo, classroomRepo: env.classroomRepo },
    { projectId: params.projectId, actorId: actor.personId }
  );

  if (result.status === 'err') {
    if (result.error.type === 'PROJECT_NOT_FOUND') {
      error(404, { message: 'Project not found' });
    }
    if (result.error.type === 'NOT_AUTHORIZED') {
      error(403, { message: 'You do not have access to this project' });
    }
    error(500, { message: 'Failed to load project' });
  }

  const project = result.value;
  const isMember = project.members.some((m) => m.personId === actor.personId && m.isActive);

  // Load subsystems
  const subsystems = await env.projectRepo.listSubsystems(params.projectId);

  // Load handoffs
  const handoffsResult = await listHandoffs(
    { projectRepo: env.projectRepo, classroomRepo: env.classroomRepo },
    { projectId: params.projectId, actorId: actor.personId }
  );
  const handoffs =
    handoffsResult.status === 'ok'
      ? handoffsResult.value.map((h) => ({
          id: h.id,
          authorId: h.authorId,
          author: h.author,
          sessionId: h.sessionId,
          whatIDid: h.whatIDid,
          whatsNext: h.whatsNext,
          blockers: h.blockers,
          questions: h.questions,
          subsystems: h.subsystems,
          createdAt: h.createdAt.toISOString()
        }))
      : [];

  // Unread count
  const unreadCount = await env.projectRepo.countUnread(params.projectId, actor.personId);

  // Get classroom students for the "add member" dropdown (teacher or member)
  let classroomStudents: { personId: string; displayName: string }[] = [];
  if (isMember || parentData.membership.role === 'teacher') {
    const allMembers = await env.classroomRepo.listMembers(params.classroomId);
    const activeMemberIds = new Set(
      project.members.filter((m) => m.isActive).map((m) => m.personId)
    );
    classroomStudents = allMembers
      .filter((m) => !activeMemberIds.has(m.id) && m.role === 'student')
      .map((m) => ({ personId: m.id, displayName: m.displayName }));
  }

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      isArchived: project.isArchived,
      visibility: project.visibility,
      createdById: project.createdById,
      memberCount: project.memberCount,
      members: project.members.map((m) => ({
        id: m.id,
        personId: m.personId,
        displayName: m.displayName,
        isActive: m.isActive
      }))
    },
    isMember,
    unreadCount,
    classroomStudents,
    subsystems: subsystems.map((s) => ({
      id: s.id,
      name: s.name,
      displayOrder: s.displayOrder
    })),
    handoffs
  };
};

export const actions: Actions = {
  updateProject: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const visibility = (formData.get('visibility') as string) || undefined;

    const result = await updateProject(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      {
        projectId: params.projectId,
        actorId: actor.personId,
        name: name || undefined,
        description,
        visibility: visibility as ProjectVisibility | undefined
      }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        PROJECT_NOT_FOUND: 'Project not found',
        NOT_AUTHORIZED: 'You are not authorized to update this project',
        DUPLICATE_NAME: 'A project with this name already exists',
        VALIDATION_ERROR:
          result.error.type === 'VALIDATION_ERROR' ? result.error.message : 'Validation error'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true };
  },

  addMember: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    if (!personId) return fail(400, { error: 'Missing personId' });

    const result = await addMember(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      {
        projectId: params.projectId,
        personId,
        actorId: actor.personId
      }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        ALREADY_ACTIVE_MEMBER: 'This person is already a member',
        TARGET_NOT_CLASSROOM_MEMBER: 'This person is not in the classroom',
        NOT_AUTHORIZED: 'You are not authorized to add members',
        PROJECT_ARCHIVED: 'Cannot add members to an archived project'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true };
  },

  removeMember: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    if (!personId) return fail(400, { error: 'Missing personId' });

    const result = await removeMember(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      {
        projectId: params.projectId,
        personId,
        actorId: actor.personId
      }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        NOT_ACTIVE_MEMBER: 'This person is not an active member',
        NOT_AUTHORIZED: 'You are not authorized to remove members'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true };
  },

  leaveProject: async ({ locals, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();

    const result = await leaveProject(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      {
        projectId: params.projectId,
        actorId: actor.personId
      }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    redirect(302, `/classroom/${params.classroomId}/projects`);
  },

  addSubsystem: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    if (!name) return fail(400, { error: 'Subsystem name is required' });

    const result = await addSubsystem(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      {
        projectId: params.projectId,
        name,
        actorId: actor.personId
      }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        DUPLICATE_NAME: 'A subsystem with this name already exists',
        VALIDATION_ERROR:
          result.error.type === 'VALIDATION_ERROR' ? result.error.message : 'Validation error',
        NOT_AUTHORIZED: 'You are not authorized to add subsystems',
        PROJECT_ARCHIVED: 'Cannot add subsystems to an archived project'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true };
  },

  submitHandoff: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const sessionResult = await getCurrentSession(
      { sessionRepo: env.sessionRepo },
      { classroomId: params.classroomId }
    );
    const sessionId = sessionResult.status === 'ok' ? (sessionResult.value?.id ?? null) : null;
    const formData = await request.formData();

    const whatIDid = (formData.get('whatIDid') as string)?.trim();
    const whatsNext = (formData.get('whatsNext') as string)?.trim() || null;
    const blockers = (formData.get('blockers') as string)?.trim() || null;
    const questions = (formData.get('questions') as string)?.trim() || null;
    const subsystemIds = formData.getAll('subsystemIds') as string[];

    if (!whatIDid) return fail(400, { error: '"What I did" is required' });

    const result = await submitHandoff(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      {
        projectId: params.projectId,
        authorId: actor.personId,
        sessionId,
        whatIDid,
        whatsNext,
        blockers,
        questions,
        subsystemIds
      }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        VALIDATION_ERROR:
          result.error.type === 'VALIDATION_ERROR' ? result.error.message : 'Validation error',
        NOT_AUTHORIZED: 'You are not authorized to submit handoffs',
        PROJECT_ARCHIVED: 'Cannot submit handoffs to an archived project'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true, handoffId: result.value.handoffId };
  },

  markAsRead: async ({ locals, params }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();

    await markAsRead(
      { projectRepo: env.projectRepo },
      { projectId: params.projectId, personId: actor.personId }
    );

    return { success: true };
  }
};
