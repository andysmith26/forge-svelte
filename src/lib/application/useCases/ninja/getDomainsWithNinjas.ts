import type {
  NinjaRepository,
  NinjaDomainRecord,
  NinjaAssignmentWithPerson
} from '$lib/application/ports/NinjaRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type DomainWithNinjas = NinjaDomainRecord & {
  assignments: NinjaAssignmentWithPerson[];
};

export type GetDomainsWithNinjasError = { type: 'INTERNAL_ERROR'; message: string };

export async function getDomainsWithNinjas(
  deps: { ninjaRepo: NinjaRepository },
  input: { classroomId: string }
): Promise<Result<DomainWithNinjas[], GetDomainsWithNinjasError>> {
  try {
    const domains = await deps.ninjaRepo.listDomains(input.classroomId);
    const assignments = await deps.ninjaRepo.listAssignmentsByClassroom(input.classroomId);

    const assignmentsByDomain = new Map<string, NinjaAssignmentWithPerson[]>();

    for (const assignment of assignments) {
      const domainId = assignment.ninjaDomain.id;
      const list = assignmentsByDomain.get(domainId) ?? [];
      list.push({
        id: assignment.id,
        personId: assignment.personId,
        ninjaDomainId: assignment.ninjaDomainId,
        assignedById: assignment.assignedById,
        isActive: assignment.isActive,
        assignedAt: assignment.assignedAt,
        revokedAt: assignment.revokedAt,
        person: assignment.person
      });
      assignmentsByDomain.set(domainId, list);
    }

    const result: DomainWithNinjas[] = domains.map((domain) => ({
      ...domain,
      assignments: assignmentsByDomain.get(domain.id) ?? []
    }));

    return ok(result);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
