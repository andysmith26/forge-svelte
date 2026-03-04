import type { ProjectRepository, UnresolvedItem } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListUnresolvedItemsError =
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function listUnresolvedItems(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
  },
  input:
    | { scope: 'project'; projectId: string; actorId: string }
    | { scope: 'school'; schoolId: string; actorId: string }
): Promise<Result<UnresolvedItem[], ListUnresolvedItemsError>> {
  try {
    if (input.scope === 'school') {
      const isTeacher = await checkIsSchoolTeacher(deps, input.actorId, input.schoolId);
      if (!isTeacher) return err({ type: 'NOT_AUTHORIZED' });
      const items = await deps.projectRepo.listUnresolvedItemsBySchool(input.schoolId);
      return ok(items);
    }

    // Project scope
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });

    const isTeacher = await checkIsSchoolTeacher(deps, input.actorId, project.schoolId);
    const isMember = !!(await deps.projectRepo.getActiveMembership(input.projectId, input.actorId));

    if (!isTeacher && !isMember) {
      return err({ type: 'NOT_AUTHORIZED' });
    }

    const items = await deps.projectRepo.listUnresolvedItems(input.projectId);
    return ok(items);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
