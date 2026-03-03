import type {
  ProjectRepository,
  HandoffWithRelations
} from '$lib/application/ports/ProjectRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type RecentHandoff = HandoffWithRelations & {
  projectName: string;
};

export type ListRecentHandoffsError = { type: 'INTERNAL_ERROR'; message: string };

/**
 * Cross-project handoff feed for teachers.
 * Returns recent handoffs across all projects in a classroom.
 */
export async function listRecentHandoffs(
  deps: {
    projectRepo: ProjectRepository;
  },
  input: {
    classroomId: string;
    limit?: number;
  }
): Promise<Result<RecentHandoff[], ListRecentHandoffsError>> {
  try {
    const projects = await deps.projectRepo.listByClassroom(input.classroomId, true);
    const limit = input.limit ?? 20;

    const allHandoffs: RecentHandoff[] = [];
    for (const project of projects) {
      const handoffs = await deps.projectRepo.listHandoffs(project.id);
      for (const h of handoffs) {
        allHandoffs.push({ ...h, projectName: project.name });
      }
    }

    // Sort by most recent first, then limit
    allHandoffs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return ok(allHandoffs.slice(0, limit));
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
