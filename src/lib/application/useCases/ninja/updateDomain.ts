import type { NinjaRepository, NinjaDomainRecord } from '$lib/application/ports/NinjaRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type UpdateDomainError =
  | { type: 'NOT_FOUND'; domainId: string }
  | { type: 'DUPLICATE_NAME'; name: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function updateDomain(
  deps: { ninjaRepo: NinjaRepository },
  input: {
    domainId: string;
    name?: string;
    description?: string | null;
  }
): Promise<Result<NinjaDomainRecord, UpdateDomainError>> {
  try {
    const domain = await deps.ninjaRepo.getDomainById(input.domainId);

    if (!domain) {
      return err({ type: 'NOT_FOUND', domainId: input.domainId });
    }

    if (input.name && input.name !== domain.name) {
      const existing = await deps.ninjaRepo.findDomainByName(domain.classroomId, input.name);

      if (existing && existing.id !== input.domainId) {
        return err({ type: 'DUPLICATE_NAME', name: input.name });
      }
    }

    const updated = await deps.ninjaRepo.updateDomain(input.domainId, {
      name: input.name,
      description: input.description
    });

    return ok(updated);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
