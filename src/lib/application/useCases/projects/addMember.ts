import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type AddMemberError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'TARGET_NOT_CLASSROOM_MEMBER' }
  | { type: 'ALREADY_ACTIVE_MEMBER' }
  | { type: 'PROJECT_ARCHIVED' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function addMember(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    projectId: string;
    personId: string;
    actorId: string;
  }
): Promise<Result<void, AddMemberError>> {
  try {
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });
    if (project.isArchived) return err({ type: 'PROJECT_ARCHIVED' });

    const classroom = await deps.classroomRepo.getById(project.classroomId);
    if (!classroom) return err({ type: 'CLASSROOM_NOT_FOUND' });

    const actorIsTeacher = await checkIsTeacher(deps, input.actorId, project.classroomId);
    const actorMembership = await deps.projectRepo.getActiveMembership(
      input.projectId,
      input.actorId
    );

    // Actor must be a project member or a teacher
    if (!actorIsTeacher && !actorMembership) {
      return err({ type: 'NOT_AUTHORIZED' });
    }

    // Target must be a classroom member
    const targetClassroomMembership = await deps.classroomRepo.getMembership(
      input.personId,
      project.classroomId
    );
    if (!targetClassroomMembership) {
      return err({ type: 'TARGET_NOT_CLASSROOM_MEMBER' });
    }

    // Check not already an active member
    const existing = await deps.projectRepo.getActiveMembership(input.projectId, input.personId);
    if (existing) {
      return err({ type: 'ALREADY_ACTIVE_MEMBER' });
    }

    const byTeacher = actorIsTeacher;
    const membershipId = deps.idGenerator.generate();

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
        personId: input.personId,
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
