import type { NinjaRepository } from '$lib/application/ports/NinjaRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type RevokeNinjaError =
  | { type: 'DOMAIN_NOT_FOUND'; domainId: string }
  | { type: 'NOT_ASSIGNED' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function revokeNinja(
  deps: { ninjaRepo: NinjaRepository },
  input: {
    personId: string;
    domainId: string;
  },
  now: Date = new Date()
): Promise<Result<void, RevokeNinjaError>> {
  try {
    const domain = await deps.ninjaRepo.getDomainById(input.domainId);

    if (!domain) {
      return err({ type: 'DOMAIN_NOT_FOUND', domainId: input.domainId });
    }

    const existing = await deps.ninjaRepo.getAssignment(input.personId, input.domainId);

    if (!existing || !existing.isActive) {
      return err({ type: 'NOT_ASSIGNED' });
    }

    await deps.ninjaRepo.updateAssignment(existing.id, {
      isActive: false,
      revokedAt: now
    });

    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
