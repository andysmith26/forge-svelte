import type { NinjaRepository } from '$lib/application/ports/NinjaRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ArchiveDomainError =
  | { type: 'NOT_FOUND'; domainId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function archiveDomain(
  deps: { ninjaRepo: NinjaRepository },
  input: { domainId: string },
  now: Date = new Date()
): Promise<Result<void, ArchiveDomainError>> {
  try {
    const domain = await deps.ninjaRepo.getDomainById(input.domainId);

    if (!domain) {
      return err({ type: 'NOT_FOUND', domainId: input.domainId });
    }

    await deps.ninjaRepo.archiveDomain(input.domainId);
    await deps.ninjaRepo.deactivateAssignmentsForDomain(input.domainId, now);

    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
