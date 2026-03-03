import type {
  ProjectRepository,
  ProjectWithMembers
} from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetProjectError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function getProject(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
  },
  input: {
    projectId: string;
    actorId: string;
  }
): Promise<Result<ProjectWithMembers, GetProjectError>> {
  try {
    const project = await deps.projectRepo.getWithMembers(input.projectId);
    if (!project) {
      return err({ type: 'PROJECT_NOT_FOUND' });
    }

    const byTeacher = await checkIsTeacher(deps, input.actorId, project.classroomId);
    const isMember = project.members.some((m) => m.personId === input.actorId && m.isActive);

    if (!byTeacher && !isMember) {
      if (project.visibility === 'members_only') {
        return err({ type: 'NOT_AUTHORIZED' });
      }
    }

    return ok(project);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
