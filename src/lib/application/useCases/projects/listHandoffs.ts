import type {
  ProjectRepository,
  HandoffWithRelations
} from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListHandoffsError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function listHandoffs(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
  },
  input: {
    projectId: string;
    actorId: string;
    limit?: number;
    afterDate?: Date;
  }
): Promise<Result<HandoffWithRelations[], ListHandoffsError>> {
  try {
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });

    const isTeacher = await checkIsSchoolTeacher(deps, input.actorId, project.schoolId);
    const isMember = !!(await deps.projectRepo.getActiveMembership(input.projectId, input.actorId));

    if (!isTeacher && !isMember) {
      if (project.visibility === 'members_only') {
        return err({ type: 'NOT_AUTHORIZED' });
      }
    }

    const handoffs = await deps.projectRepo.listHandoffs(input.projectId, {
      limit: input.limit,
      afterDate: input.afterDate
    });

    return ok(handoffs);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
