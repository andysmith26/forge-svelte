import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type LeaveProjectError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'NOT_ACTIVE_MEMBER' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function leaveProject(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
  },
  input: {
    projectId: string;
    actorId: string;
  }
): Promise<Result<void, LeaveProjectError>> {
  try {
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });

    const classroom = await deps.classroomRepo.getById(project.classroomId);
    if (!classroom) return err({ type: 'CLASSROOM_NOT_FOUND' });

    const membership = await deps.projectRepo.getActiveMembership(input.projectId, input.actorId);
    if (!membership) {
      return err({ type: 'NOT_ACTIVE_MEMBER' });
    }

    const byTeacher = await checkIsTeacher(deps, input.actorId, project.classroomId);

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: project.classroomId,
      eventType: 'PROJECT_MEMBER_REMOVED',
      entityType: 'ProjectMembership',
      entityId: membership.id,
      actorId: input.actorId,
      payload: {
        projectId: input.projectId,
        classroomId: project.classroomId,
        personId: input.actorId,
        removedBy: input.actorId,
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
