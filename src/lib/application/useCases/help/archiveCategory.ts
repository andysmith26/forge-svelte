import type { HelpRepository, HelpCategoryRecord } from '$lib/application/ports/HelpRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ArchiveCategoryError =
  | { type: 'NOT_FOUND'; categoryId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function archiveCategory(
  deps: { helpRepo: HelpRepository },
  input: { categoryId: string }
): Promise<Result<HelpCategoryRecord, ArchiveCategoryError>> {
  try {
    const category = await deps.helpRepo.getCategoryById(input.categoryId);

    if (!category) {
      return err({ type: 'NOT_FOUND', categoryId: input.categoryId });
    }

    const archived = await deps.helpRepo.archiveCategory(input.categoryId);
    return ok(archived);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
