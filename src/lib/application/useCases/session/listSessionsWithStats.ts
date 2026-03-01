import type { SessionRepository, SessionFilters } from '$lib/application/ports/SessionRepository';
import type { PresenceRepository } from '$lib/application/ports/PresenceRepository';
import type { HelpRepository } from '$lib/application/ports/HelpRepository';
import type { SessionListItem } from '$lib/domain/types/session-analytics';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListSessionsWithStatsError = { type: 'INTERNAL_ERROR'; message: string };

type Deps = {
  sessionRepo: SessionRepository;
  presenceRepo: PresenceRepository;
  helpRepo: HelpRepository;
};

type Input = {
  classroomId: string;
  filters?: SessionFilters;
};

export async function listSessionsWithStats(
  deps: Deps,
  input: Input
): Promise<Result<SessionListItem[], ListSessionsWithStatsError>> {
  try {
    const sessions = await deps.sessionRepo.listByClassroom(input.classroomId, input.filters);

    const pastSessions = sessions.filter((s) => s.status === 'ended' || s.status === 'cancelled');

    const enriched = await Promise.all(
      pastSessions.map(async (session) => {
        const [signIns, helpRequests] = await Promise.all([
          deps.presenceRepo.listSignInsForSession(session.id),
          deps.helpRepo.listAllRequestsForSession(session.id)
        ]);

        const uniqueStudents = new Set(signIns.map((s) => s.personId)).size;

        let durationMinutes: number | null = null;
        if (session.actualStartAt && session.actualEndAt) {
          durationMinutes = Math.round(
            (session.actualEndAt.getTime() - session.actualStartAt.getTime()) / 60_000
          );
        }

        const item: SessionListItem = {
          id: session.id,
          name: session.name,
          status: session.status,
          startedAt: session.actualStartAt?.toISOString() ?? null,
          endedAt: session.actualEndAt?.toISOString() ?? null,
          durationMinutes,
          studentCount: uniqueStudents,
          helpRequestCount: helpRequests.length
        };
        return item;
      })
    );

    return ok(enriched);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
