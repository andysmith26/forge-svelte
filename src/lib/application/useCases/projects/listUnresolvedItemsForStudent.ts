import type { ProjectRepository, UnresolvedItem } from '$lib/application/ports/ProjectRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListUnresolvedItemsForStudentError = { type: 'INTERNAL_ERROR'; message: string };

export async function listUnresolvedItemsForStudent(
  deps: { projectRepo: ProjectRepository },
  input: { schoolId: string; personId: string }
): Promise<Result<UnresolvedItem[], ListUnresolvedItemsForStudentError>> {
  try {
    const items = await deps.projectRepo.listUnresolvedItemsByPerson(
      input.schoolId,
      input.personId
    );
    return ok(items);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
