import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import { requireSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ArchiveProjectError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'NOT_TEACHER' }
  | { type: 'ALREADY_ARCHIVED' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function archiveProject(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
  },
  input: {
    projectId: string;
    actorId: string;
  }
): Promise<Result<void, ArchiveProjectError>> {
  try {
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) {
      return err({ type: 'PROJECT_NOT_FOUND' });
    }

    const teacherResult = await requireSchoolTeacher(deps, input.actorId, project.schoolId);
    if (teacherResult.status === 'err') {
      return err({ type: 'NOT_TEACHER' });
    }

    if (project.isArchived) {
      return err({ type: 'ALREADY_ARCHIVED' });
    }

    await deps.eventStore.appendAndEmit({
      schoolId: project.schoolId,
      eventType: 'PROJECT_ARCHIVED',
      entityType: 'Project',
      entityId: project.id,
      actorId: input.actorId,
      payload: {
        projectId: project.id,
        schoolId: project.schoolId,
        archivedBy: input.actorId,
        byTeacher: true
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
