import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type FreshnessLevel = 'active' | 'quiet' | 'stale' | 'no_handoffs';

export type ProjectFreshness = {
  projectId: string;
  level: FreshnessLevel;
  lastHandoffAt: Date | null;
  sessionsSinceLastHandoff: number;
};

export type GetProjectFreshnessError = { type: 'INTERNAL_ERROR'; message: string };

/**
 * Freshness rules:
 * - "no_handoffs": no handoffs ever submitted
 * - "active": 0 sessions since last handoff (was updated in most recent session or after)
 * - "quiet": 1-2 sessions since last handoff
 * - "stale": 3+ sessions since last handoff
 */
export async function getProjectFreshness(
  deps: {
    projectRepo: ProjectRepository;
    sessionRepo: SessionRepository;
  },
  input: {
    schoolId: string;
    projectIds: string[];
  }
): Promise<Result<Map<string, ProjectFreshness>, GetProjectFreshnessError>> {
  try {
    const lastHandoffDates = await deps.projectRepo.getLastHandoffDates(input.projectIds);
    const result = new Map<string, ProjectFreshness>();

    for (const projectId of input.projectIds) {
      const lastHandoffAt = lastHandoffDates.get(projectId) ?? null;

      if (!lastHandoffAt) {
        result.set(projectId, {
          projectId,
          level: 'no_handoffs',
          lastHandoffAt: null,
          sessionsSinceLastHandoff: 0
        });
        continue;
      }

      const sessionsSince = await deps.sessionRepo.countSchoolSessionsSince(
        input.schoolId,
        lastHandoffAt
      );

      let level: FreshnessLevel;
      if (sessionsSince === 0) {
        level = 'active';
      } else if (sessionsSince <= 2) {
        level = 'quiet';
      } else {
        level = 'stale';
      }

      result.set(projectId, {
        projectId,
        level,
        lastHandoffAt,
        sessionsSinceLastHandoff: sessionsSince
      });
    }

    return ok(result);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
