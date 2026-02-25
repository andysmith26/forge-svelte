import type { HelpRepository, HelpCategoryRecord } from '$lib/application/ports/HelpRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type CreateCategoryError =
  | { type: 'DUPLICATE_NAME'; name: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function createCategory(
  deps: { helpRepo: HelpRepository },
  input: {
    classroomId: string;
    name: string;
    description?: string | null;
    ninjaDomainId?: string | null;
  }
): Promise<Result<HelpCategoryRecord, CreateCategoryError>> {
  try {
    const existing = await deps.helpRepo.findCategoryByName(input.classroomId, input.name);

    if (existing) {
      return err({ type: 'DUPLICATE_NAME', name: input.name });
    }

    const displayOrder = await deps.helpRepo.getNextCategoryOrder(input.classroomId);

    const category = await deps.helpRepo.createCategory({
      classroomId: input.classroomId,
      name: input.name,
      description: input.description ?? null,
      ninjaDomainId: input.ninjaDomainId ?? null,
      displayOrder
    });

    return ok(category);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
