import type { NinjaRepository, NinjaDomainRecord } from '$lib/application/ports/NinjaRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type CreateDomainError =
  | { type: 'DUPLICATE_NAME'; name: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function createDomain(
  deps: { ninjaRepo: NinjaRepository },
  input: {
    classroomId: string;
    name: string;
    description?: string | null;
  }
): Promise<Result<NinjaDomainRecord, CreateDomainError>> {
  try {
    const existing = await deps.ninjaRepo.findDomainByName(input.classroomId, input.name);

    if (existing) {
      return err({ type: 'DUPLICATE_NAME', name: input.name });
    }

    const displayOrder = await deps.ninjaRepo.getNextDomainOrder(input.classroomId);

    const domain = await deps.ninjaRepo.createDomain({
      classroomId: input.classroomId,
      name: input.name,
      description: input.description ?? null,
      displayOrder
    });

    return ok(domain);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
