import type { ProjectRepository, ProjectListItem } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListProjectsResult = {
  myProjects: ProjectListItem[];
  browseableProjects: ProjectListItem[];
};

export type ListProjectsError = { type: 'INTERNAL_ERROR'; message: string };

export async function listProjects(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
  },
  input: {
    schoolId: string;
    actorId: string;
    includeArchived?: boolean;
  }
): Promise<Result<ListProjectsResult, ListProjectsError>> {
  try {
    const isTeacher = await checkIsSchoolTeacher(deps, input.actorId, input.schoolId);

    if (isTeacher) {
      const allProjects = await deps.projectRepo.listBySchool(
        input.schoolId,
        input.includeArchived
      );
      return ok({
        myProjects: allProjects,
        browseableProjects: []
      });
    }

    const myProjects = await deps.projectRepo.listByMember(input.schoolId, input.actorId);

    const allBrowseable = await deps.projectRepo.listBySchool(input.schoolId);
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
