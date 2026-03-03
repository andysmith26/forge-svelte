import type { ProjectRepository, ProjectRecord } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { ProjectVisibility } from '$lib/domain/entities/project.entity';
import { ProjectEntity } from '$lib/domain/entities/project.entity';
import { ValidationError } from '$lib/domain/errors';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type UpdateProjectError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'DUPLICATE_NAME' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function updateProject(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
  },
  input: {
    projectId: string;
    actorId: string;
    name?: string;
    description?: string | null;
    visibility?: ProjectVisibility;
  }
): Promise<Result<ProjectRecord, UpdateProjectError>> {
  try {
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) {
      return err({ type: 'PROJECT_NOT_FOUND' });
    }

    const byTeacher = await checkIsTeacher(deps, input.actorId, project.classroomId);
    const isMember = await deps.projectRepo.getActiveMembership(input.projectId, input.actorId);

    if (!byTeacher && !isMember) {
      return err({ type: 'NOT_AUTHORIZED' });
    }

    try {
      const entity = ProjectEntity.fromRecord(project);
      entity.updateDetails({
        name: input.name,
        description: input.description,
        visibility: input.visibility
      });
    } catch (e) {
      if (e instanceof ValidationError) {
        return err({ type: 'VALIDATION_ERROR', message: e.message });
      }
      throw e;
    }

    if (input.name && input.name.trim() !== project.name) {
      const existing = await deps.projectRepo.findByName(project.classroomId, input.name.trim());
      if (existing && existing.id !== project.id) {
        return err({ type: 'DUPLICATE_NAME' });
      }
    }

    const changedFields: string[] = [];
    if (input.name !== undefined) changedFields.push('name');
    if (input.description !== undefined) changedFields.push('description');
    if (input.visibility !== undefined) changedFields.push('visibility');

    const classroom = await deps.classroomRepo.getById(project.classroomId);

    await deps.eventStore.appendAndEmit({
      schoolId: classroom!.schoolId,
      classroomId: project.classroomId,
      eventType: 'PROJECT_UPDATED',
      entityType: 'Project',
      entityId: project.id,
      actorId: input.actorId,
      payload: {
        projectId: project.id,
        classroomId: project.classroomId,
        changedFields,
        updatedBy: input.actorId,
        byTeacher,
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description?.trim() ?? null }),
        ...(input.visibility !== undefined && { visibility: input.visibility })
      }
    });

    const updated = await deps.projectRepo.getById(project.id);
    return ok(updated!);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
