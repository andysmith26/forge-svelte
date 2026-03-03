import type { ProjectRepository, ProjectRecord } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { PersonRepository } from '$lib/application/ports/PersonRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import type { ProjectVisibility } from '$lib/domain/entities/project.entity';
import { ProjectEntity } from '$lib/domain/entities/project.entity';
import { ValidationError } from '$lib/domain/errors';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type CreateProjectResult = {
  project: ProjectRecord;
};

export type CreateProjectError =
  | { type: 'NOT_SCHOOL_MEMBER' }
  | { type: 'DUPLICATE_NAME' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'PROJECT_NOT_FOUND_AFTER_CREATE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function createProject(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    personRepo: PersonRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    schoolId: string;
    name: string;
    description?: string | null;
    visibility?: ProjectVisibility;
    createdById: string;
  }
): Promise<Result<CreateProjectResult, CreateProjectError>> {
  try {
    const person = await deps.personRepo.getById(input.createdById);
    if (!person || person.schoolId !== input.schoolId) {
      return err({ type: 'NOT_SCHOOL_MEMBER' });
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

    const existing = await deps.projectRepo.findByName(input.schoolId, input.name.trim());
    if (existing) {
      return err({ type: 'DUPLICATE_NAME' });
    }

    const byTeacher = await checkIsSchoolTeacher(deps, input.createdById, input.schoolId);
    const projectId = deps.idGenerator.generate();
    const membershipId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: input.schoolId,
      eventType: 'PROJECT_CREATED',
      entityType: 'Project',
      entityId: projectId,
      actorId: input.createdById,
      payload: {
        projectId,
        schoolId: input.schoolId,
        name: input.name.trim(),
        description: input.description?.trim() ?? null,
        visibility: input.visibility ?? 'browseable',
        createdBy: input.createdById,
        byTeacher
      }
    });

    await deps.eventStore.appendAndEmit({
      schoolId: input.schoolId,
      eventType: 'PROJECT_MEMBER_ADDED',
      entityType: 'ProjectMembership',
      entityId: membershipId,
      actorId: input.createdById,
      payload: {
        projectId,
        schoolId: input.schoolId,
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
