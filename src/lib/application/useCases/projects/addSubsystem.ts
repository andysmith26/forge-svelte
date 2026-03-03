import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type AddSubsystemError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'PROJECT_ARCHIVED' }
  | { type: 'DUPLICATE_NAME' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'INTERNAL_ERROR'; message: string };

const MAX_SUBSYSTEM_NAME = 60;

export async function addSubsystem(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    projectId: string;
    name: string;
    actorId: string;
  }
): Promise<Result<{ subsystemId: string }, AddSubsystemError>> {
  try {
    const name = input.name.trim();
    if (!name || name.length > MAX_SUBSYSTEM_NAME) {
      return err({
        type: 'VALIDATION_ERROR',
        message: `Subsystem name must be between 1 and ${MAX_SUBSYSTEM_NAME} characters`
      });
    }

    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });
    if (project.isArchived) return err({ type: 'PROJECT_ARCHIVED' });

    const classroom = await deps.classroomRepo.getById(project.classroomId);
    if (!classroom) return err({ type: 'CLASSROOM_NOT_FOUND' });

    const isTeacher = await checkIsTeacher(deps, input.actorId, project.classroomId);
    const isMember = !!(await deps.projectRepo.getActiveMembership(input.projectId, input.actorId));

    if (!isTeacher && !isMember) {
      return err({ type: 'NOT_AUTHORIZED' });
    }

    const existing = await deps.projectRepo.findSubsystemByName(input.projectId, name);
    if (existing) {
      return err({ type: 'DUPLICATE_NAME' });
    }

    const subsystemId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: project.classroomId,
      eventType: 'PROJECT_SUBSYSTEM_ADDED',
      entityType: 'Subsystem',
      entityId: subsystemId,
      actorId: input.actorId,
      payload: {
        projectId: input.projectId,
        classroomId: project.classroomId,
        subsystemId,
        name,
        addedBy: input.actorId,
        byTeacher: isTeacher
      }
    });

    return ok({ subsystemId });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
