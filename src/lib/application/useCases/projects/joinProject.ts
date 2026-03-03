import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type JoinProjectError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'NOT_CLASSROOM_MEMBER' }
  | { type: 'ALREADY_ACTIVE_MEMBER' }
  | { type: 'PROJECT_ARCHIVED' }
  | { type: 'NOT_BROWSEABLE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function joinProject(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    projectId: string;
    actorId: string;
  }
): Promise<Result<void, JoinProjectError>> {
  try {
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });
    if (project.isArchived) return err({ type: 'PROJECT_ARCHIVED' });

    const classroom = await deps.classroomRepo.getById(project.classroomId);
    if (!classroom) return err({ type: 'CLASSROOM_NOT_FOUND' });

    const classroomMembership = await deps.classroomRepo.getMembership(
      input.actorId,
      project.classroomId
    );
    if (!classroomMembership) {
      return err({ type: 'NOT_CLASSROOM_MEMBER' });
    }

    // Self-join is only allowed for browseable projects (teachers can always join)
    const isTeacher = await checkIsTeacher(deps, input.actorId, project.classroomId);
    if (!isTeacher && project.visibility !== 'browseable') {
      return err({ type: 'NOT_BROWSEABLE' });
    }

    const existing = await deps.projectRepo.getActiveMembership(input.projectId, input.actorId);
    if (existing) {
      return err({ type: 'ALREADY_ACTIVE_MEMBER' });
    }

    const membershipId = deps.idGenerator.generate();
    const byTeacher = isTeacher;

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: project.classroomId,
      eventType: 'PROJECT_MEMBER_ADDED',
      entityType: 'ProjectMembership',
      entityId: membershipId,
      actorId: input.actorId,
      payload: {
        projectId: input.projectId,
        classroomId: project.classroomId,
        personId: input.actorId,
        addedBy: input.actorId,
        byTeacher
      }
    });

    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
