import type { ProjectRepository, ProjectRecord } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import type { ProjectVisibility } from '$lib/domain/entities/project.entity';
import { ProjectEntity } from '$lib/domain/entities/project.entity';
import { ValidationError } from '$lib/domain/errors';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type CreateProjectResult = {
  project: ProjectRecord;
};

export type CreateProjectError =
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'NOT_CLASSROOM_MEMBER' }
  | { type: 'DUPLICATE_NAME' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'PROJECT_NOT_FOUND_AFTER_CREATE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function createProject(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    classroomId: string;
    name: string;
    description?: string | null;
    visibility?: ProjectVisibility;
    createdById: string;
  }
): Promise<Result<CreateProjectResult, CreateProjectError>> {
  try {
    const classroom = await deps.classroomRepo.getById(input.classroomId);
    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    const membership = await deps.classroomRepo.getMembership(input.createdById, input.classroomId);
    if (!membership) {
      return err({ type: 'NOT_CLASSROOM_MEMBER' });
    }

    try {
      ProjectEntity.validateName(input.name);
      if (input.description) {
        ProjectEntity.validateDescription(input.description);
      }
    } catch (e) {
      if (e instanceof ValidationError) {
        return err({ type: 'VALIDATION_ERROR', message: e.message });
      }
      throw e;
    }

    const existing = await deps.projectRepo.findByName(input.classroomId, input.name.trim());
    if (existing) {
      return err({ type: 'DUPLICATE_NAME' });
    }

    const byTeacher = await checkIsTeacher(deps, input.createdById, input.classroomId);
    const projectId = deps.idGenerator.generate();
    const membershipId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: input.classroomId,
      eventType: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: projectId,
      actorId: input.createdById,
      payload: {
        projectId,
        classroomId: input.classroomId,
        name: input.name.trim(),
        description: input.description?.trim() ?? null,
        visibility: input.visibility ?? 'browseable',
        createdBy: input.createdById,
        byTeacher
      }
    });

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: input.classroomId,
      eventType: 'PROJECT_MEMBER_ADDED',
      entityType: 'ProjectMembership',
      entityId: membershipId,
      actorId: input.createdById,
      payload: {
        projectId,
        classroomId: input.classroomId,
        personId: input.createdById,
        addedBy: input.createdById,
        byTeacher
      }
    });

    const project = await deps.projectRepo.getById(projectId);
    if (!project) {
      return err({ type: 'PROJECT_NOT_FOUND_AFTER_CREATE' });
    }

    return ok({ project });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
