import type { HelpRepository, HelpCategoryRecord } from '$lib/application/ports/HelpRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type UpdateCategoryError =
  | { type: 'NOT_FOUND'; categoryId: string }
  | { type: 'DUPLICATE_NAME'; name: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function updateCategory(
  deps: { helpRepo: HelpRepository },
  input: {
    categoryId: string;
    name?: string;
    description?: string | null;
    ninjaDomainId?: string | null;
  }
): Promise<Result<HelpCategoryRecord, UpdateCategoryError>> {
  try {
    const category = await deps.helpRepo.getCategoryById(input.categoryId);

    if (!category) {
      return err({ type: 'NOT_FOUND', categoryId: input.categoryId });
    }

    if (input.name && input.name !== category.name) {
      const existing = await deps.helpRepo.findCategoryByName(category.classroomId, input.name);

      if (existing && existing.id !== input.categoryId) {
        return err({ type: 'DUPLICATE_NAME', name: input.name });
      }
    }

    const updated = await deps.helpRepo.updateCategory(input.categoryId, {
      name: input.name,
      description: input.description,
      ninjaDomainId: input.ninjaDomainId
    });

    return ok(updated);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
