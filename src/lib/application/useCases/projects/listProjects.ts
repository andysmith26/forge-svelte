import type { ProjectRepository, ProjectListItem } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListProjectsResult = {
  myProjects: ProjectListItem[];
  browseableProjects: ProjectListItem[];
};

export type ListProjectsError =
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function listProjects(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
  },
  input: {
    classroomId: string;
    actorId: string;
    includeArchived?: boolean;
  }
): Promise<Result<ListProjectsResult, ListProjectsError>> {
  try {
    const classroom = await deps.classroomRepo.getById(input.classroomId);
    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    const isTeacher = await checkIsTeacher(deps, input.actorId, input.classroomId);

    if (isTeacher) {
      const allProjects = await deps.projectRepo.listByClassroom(
        input.classroomId,
        input.includeArchived
      );
      return ok({
        myProjects: allProjects,
        browseableProjects: []
      });
    }

    const myProjects = await deps.projectRepo.listByMember(input.classroomId, input.actorId);

    const allBrowseable = await deps.projectRepo.listByClassroom(input.classroomId);
    const myProjectIds = new Set(myProjects.map((p) => p.id));
    const browseableProjects = allBrowseable.filter(
      (p) => !myProjectIds.has(p.id) && p.visibility === 'browseable'
    );

    return ok({ myProjects, browseableProjects });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
