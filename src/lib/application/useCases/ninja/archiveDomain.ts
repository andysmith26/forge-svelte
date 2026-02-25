import type { NinjaRepository } from '$lib/application/ports/NinjaRepository';
import type { Clock } from '$lib/application/ports/Clock';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ArchiveDomainError =
  | { type: 'NOT_FOUND'; domainId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function archiveDomain(
  deps: { ninjaRepo: NinjaRepository; clock: Clock },
  input: { domainId: string }
): Promise<Result<void, ArchiveDomainError>> {
  try {
    const domain = await deps.ninjaRepo.getDomainById(input.domainId);

    if (!domain) {
      return err({ type: 'NOT_FOUND', domainId: input.domainId });
    }

    await deps.ninjaRepo.archiveDomain(input.domainId);
    await deps.ninjaRepo.deactivateAssignmentsForDomain(input.domainId, deps.clock.now());

    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
