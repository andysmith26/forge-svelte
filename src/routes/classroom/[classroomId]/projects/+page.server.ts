import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { listProjects } from '$lib/application/useCases/projects/listProjects';
import { createProject } from '$lib/application/useCases/projects/createProject';
import { archiveProject } from '$lib/application/useCases/projects/archiveProject';
import { unarchiveProject } from '$lib/application/useCases/projects/unarchiveProject';
import { joinProject } from '$lib/application/useCases/projects/joinProject';
import { getProjectFreshness } from '$lib/application/useCases/projects/getProjectFreshness';
import { listRecentHandoffs } from '$lib/application/useCases/projects/listRecentHandoffs';
import { getClassroomSettings } from '$lib/application/useCases/classroom/getClassroomSettings';
import type { ProjectVisibility } from '$lib/domain/entities/project.entity';
import type { FreshnessLevel } from '$lib/application/useCases/projects/getProjectFreshness';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const parentData = await parent();

  if (!parentData.settings?.modules.projects?.enabled) {
    redirect(302, `/classroom/${parentData.classroom.id}`);
  }

  const env = getEnvironment();
  const actor = locals.actor!;
  const isTeacher = parentData.membership.role === 'teacher';

  const result = await listProjects(
    { projectRepo: env.projectRepo, classroomRepo: env.classroomRepo },
    {
      classroomId: parentData.classroom.id,
      actorId: actor.personId,
      includeArchived: isTeacher
    }
  );

  if (result.status === 'err') {
    return { myProjects: [], browseableProjects: [] };
  }

  const allProjectIds = [
    ...result.value.myProjects.map((p) => p.id),
    ...result.value.browseableProjects.map((p) => p.id)
  ];

  // Fetch freshness and unread counts in parallel
  const [freshnessResult, unreadCounts] = await Promise.all([
    getProjectFreshness(
      { projectRepo: env.projectRepo, sessionRepo: env.sessionRepo },
      { classroomId: parentData.classroom.id, projectIds: allProjectIds }
    ),
    env.projectRepo.countUnreadBatch(allProjectIds, actor.personId)
  ]);

  const freshnessMap = freshnessResult.status === 'ok' ? freshnessResult.value : new Map();

  const toSerializable = (
    p: (typeof result.value.myProjects)[number]
  ): {
    id: string;
    name: string;
    description: string | null;
    isArchived: boolean;
    visibility: string;
    memberCount: number;
    lastHandoffAt: string | null;
    createdAt: string;
    freshness: FreshnessLevel;
    unreadCount: number;
  } => ({
    id: p.id,
    name: p.name,
    description: p.description,
    isArchived: p.isArchived,
    visibility: p.visibility,
    memberCount: p.memberCount,
    lastHandoffAt: p.lastHandoffAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    freshness: freshnessMap.get(p.id)?.level ?? 'no_handoffs',
    unreadCount: unreadCounts.get(p.id) ?? 0
  });

  // Teacher activity feed: recent handoffs across all projects
  let recentHandoffs: {
    id: string;
    projectName: string;
    author: { id: string; displayName: string };
    whatIDid: string;
    blockers: string | null;
    questions: string | null;
    subsystems: { id: string; name: string }[];
    createdAt: string;
  }[] = [];

  if (isTeacher) {
    const recentResult = await listRecentHandoffs(
      { projectRepo: env.projectRepo },
      { classroomId: parentData.classroom.id, limit: 10 }
    );
    if (recentResult.status === 'ok') {
      recentHandoffs = recentResult.value.map((h) => ({
        id: h.id,
        projectName: h.projectName,
        author: h.author,
        whatIDid: h.whatIDid,
        blockers: h.blockers,
        questions: h.questions,
        subsystems: h.subsystems,
        createdAt: h.createdAt.toISOString()
      }));
    }
  }

  return {
    myProjects: result.value.myProjects.map(toSerializable),
    browseableProjects: result.value.browseableProjects.map(toSerializable),
    recentHandoffs
  };
};

export const actions: Actions = {
  createProject: async ({ locals, params, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const settingsResult = await getClassroomSettings(
      { classroomRepo: env.classroomRepo },
      { classroomId: params.classroomId }
    );
    if (settingsResult.status !== 'ok' || !settingsResult.value.modules.projects?.enabled) {
      return fail(403, { error: 'Module disabled' });
    }

    const formData = await request.formData();
    const name = (formData.get('name') as string)?.trim();
    const description = (formData.get('description') as string)?.trim() || null;
    const visibility = (formData.get('visibility') as string) || 'browseable';

    if (!name) return fail(400, { error: 'Project name is required' });

    const result = await createProject(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      {
        classroomId: params.classroomId,
        name,
        description,
        visibility: visibility as ProjectVisibility,
        createdById: actor.personId
      }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        DUPLICATE_NAME: 'A project with this name already exists',
        VALIDATION_ERROR: result.error.type === 'VALIDATION_ERROR' ? result.error.message : '',
        NOT_CLASSROOM_MEMBER: 'You are not a member of this classroom'
      };
      return fail(400, {
        error: errorMessages[result.error.type] || result.error.type
      });
    }

    return { success: true, projectId: result.value.project.id };
  },

  archiveProject: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;
    if (!projectId) return fail(400, { error: 'Missing projectId' });

    const result = await archiveProject(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      { projectId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  unarchiveProject: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;
    if (!projectId) return fail(400, { error: 'Missing projectId' });

    const result = await unarchiveProject(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore
      },
      { projectId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      return fail(400, { error: result.error.type });
    }

    return { success: true };
  },

  joinProject: async ({ locals, request }) => {
    const actor = locals.actor;
    if (!actor) return fail(401, { error: 'Not authenticated' });

    const env = getEnvironment();
    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;
    if (!projectId) return fail(400, { error: 'Missing projectId' });

    const result = await joinProject(
      {
        projectRepo: env.projectRepo,
        classroomRepo: env.classroomRepo,
        eventStore: env.eventStore,
        idGenerator: env.idGenerator
      },
      { projectId, actorId: actor.personId }
    );

    if (result.status === 'err') {
      const errorMessages: Record<string, string> = {
        ALREADY_ACTIVE_MEMBER: 'You are already a member of this project',
        NOT_BROWSEABLE: 'This project is not open for joining',
        PROJECT_ARCHIVED: 'This project is archived'
      };
      return fail(400, { error: errorMessages[result.error.type] || result.error.type });
    }

    return { success: true };
  }
};
