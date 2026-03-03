import type {
  ProjectRepository,
  HandoffWithRelations
} from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetHandoffError =
  | { type: 'HANDOFF_NOT_FOUND' }
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function getHandoff(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
  },
  input: {
    handoffId: string;
    actorId: string;
  }
): Promise<Result<HandoffWithRelations, GetHandoffError>> {
  try {
    const handoff = await deps.projectRepo.getHandoffById(input.handoffId);
    if (!handoff) return err({ type: 'HANDOFF_NOT_FOUND' });

    const project = await deps.projectRepo.getById(handoff.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });

    const isTeacher = await checkIsSchoolTeacher(deps, input.actorId, project.schoolId);
    const isMember = !!(await deps.projectRepo.getActiveMembership(
      handoff.projectId,
      input.actorId
    ));

    if (!isTeacher && !isMember && project.visibility === 'members_only') {
      return err({ type: 'NOT_AUTHORIZED' });
    }

    // Get the full handoff with relations
    const handoffs = await deps.projectRepo.listHandoffs(handoff.projectId);
    const fullHandoff = handoffs.find((h) => h.id === input.handoffId);
    if (!fullHandoff) return err({ type: 'HANDOFF_NOT_FOUND' });

    return ok(fullHandoff);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
