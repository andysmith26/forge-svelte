import type { HelpRepository, HelpCategoryRecord } from '$lib/application/ports/HelpRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListCategoriesError = { type: 'INTERNAL_ERROR'; message: string };

export async function listCategories(
  deps: { helpRepo: HelpRepository },
  input: { classroomId: string }
): Promise<Result<HelpCategoryRecord[], ListCategoriesError>> {
  try {
    const categories = await deps.helpRepo.listCategories(input.classroomId);
    return ok(categories);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
