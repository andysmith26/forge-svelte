import type {
  NinjaRepository,
  NinjaAssignmentWithRelations
} from '$lib/application/ports/NinjaRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type AssignNinjaError =
  | { type: 'DOMAIN_NOT_FOUND'; domainId: string }
  | { type: 'NOT_A_MEMBER' }
  | { type: 'ALREADY_ASSIGNED' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function assignNinja(
  deps: {
    ninjaRepo: NinjaRepository;
    classroomRepo: ClassroomRepository;
  },
  input: {
    personId: string;
    domainId: string;
    actorId: string;
  },
  now: Date = new Date()
): Promise<Result<NinjaAssignmentWithRelations, AssignNinjaError>> {
  try {
    const domain = await deps.ninjaRepo.getDomainById(input.domainId);

    if (!domain || !domain.isActive) {
      return err({ type: 'DOMAIN_NOT_FOUND', domainId: input.domainId });
    }

    const membership = await deps.classroomRepo.getMembership(input.personId, domain.classroomId);

    if (!membership) {
      return err({ type: 'NOT_A_MEMBER' });
    }

    const existing = await deps.ninjaRepo.getAssignment(input.personId, input.domainId);

    if (existing) {
      if (existing.isActive) {
        return err({ type: 'ALREADY_ASSIGNED' });
      }

      const reactivated = await deps.ninjaRepo.updateAssignment(existing.id, {
        isActive: true,
        assignedById: input.actorId,
        assignedAt: now,
        revokedAt: null
      });

      return ok(reactivated);
    }

    const assignment = await deps.ninjaRepo.createAssignment({
      personId: input.personId,
      ninjaDomainId: input.domainId,
      assignedById: input.actorId
    });

    return ok(assignment);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
