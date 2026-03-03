import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type MarkAsReadError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function markAsRead(
  deps: {
    projectRepo: ProjectRepository;
  },
  input: {
    projectId: string;
    personId: string;
  }
): Promise<Result<void, MarkAsReadError>> {
  try {
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });

    await deps.projectRepo.upsertReadStatus(input.projectId, input.personId, new Date());

    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
