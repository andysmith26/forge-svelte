import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import type {
  PresenceRepository,
  SignInWithActors
} from '$lib/application/ports/PresenceRepository';
import type { HelpRepository, HelpQueueItem } from '$lib/application/ports/HelpRepository';
import type { EventStore, StoredEvent } from '$lib/application/ports/EventStore';
import type {
  SessionAnalytics,
  AttendanceSummary,
  AttendeeRecord,
  HelpSummary,
  CategoryBreakdown,
  UrgencyBreakdown,
  TimelineEvent
} from '$lib/domain/types/session-analytics';
import type { HelpUrgency } from '$lib/domain/types/help-urgency';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetSessionAnalyticsError =
  | { type: 'SESSION_NOT_FOUND' }
  | { type: 'INTERNAL_ERROR'; message: string };

type Deps = {
  sessionRepo: SessionRepository;
  presenceRepo: PresenceRepository;
  helpRepo: HelpRepository;
  eventStore: EventStore;
};

type Input = {
  sessionId: string;
};

export async function getSessionAnalytics(
  deps: Deps,
  input: Input
): Promise<Result<SessionAnalytics, GetSessionAnalyticsError>> {
  try {
    const session = await deps.sessionRepo.getById(input.sessionId);
    if (!session) {
      return err({ type: 'SESSION_NOT_FOUND' });
    }

    const [signIns, helpRequests, events] = await Promise.all([
      deps.presenceRepo.listSignInsForSession(input.sessionId),
      deps.helpRepo.listAllRequestsForSession(input.sessionId),
      deps.eventStore.loadEvents({ sessionId: input.sessionId })
    ]);

    // Build person name lookup from sign-ins and help request data
    const personNames = new Map<string, string>();
    for (const signIn of signIns) {
      personNames.set(signIn.person.id, signIn.person.displayName);
      personNames.set(signIn.signedInBy.id, signIn.signedInBy.displayName);
      if (signIn.signedOutBy) {
        personNames.set(signIn.signedOutBy.id, signIn.signedOutBy.displayName);
      }
    }
    for (const req of helpRequests) {
      personNames.set(req.requester.id, req.requester.displayName);
      if (req.claimedBy) {
        personNames.set(req.claimedBy.id, req.claimedBy.displayName);
      }
    }

    const attendance = buildAttendanceSummary(signIns);
    const help = buildHelpSummary(helpRequests);
    const timeline = buildTimeline(events, personNames);

    let durationMinutes: number | null = null;
    if (session.actualStartAt && session.actualEndAt) {
      durationMinutes = Math.round(
        (session.actualEndAt.getTime() - session.actualStartAt.getTime()) / 60_000
      );
    }

    return ok({
      sessionId: session.id,
      sessionName: session.name,
      status: session.status,
      startedAt: session.actualStartAt?.toISOString() ?? null,
      endedAt: session.actualEndAt?.toISOString() ?? null,
      durationMinutes,
      attendance,
      help,
      timeline
    });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}

function buildAttendanceSummary(signIns: SignInWithActors[]): AttendanceSummary {
  const uniqueStudents = new Set(signIns.map((s) => s.personId)).size;

  let selfSignIns = 0;
  let assistedSignIns = 0;

  const attendees: AttendeeRecord[] = signIns.map((s) => {
    let durationMinutes: number | null = null;
    if (s.signedOutAt) {
      durationMinutes = Math.round((s.signedOutAt.getTime() - s.signedInAt.getTime()) / 60_000);
    }
    const isSelf = s.signedInById === s.personId;
    if (isSelf) selfSignIns++;
    else assistedSignIns++;

    return {
      personId: s.personId,
      displayName: s.person.displayName,
      signedInAt: s.signedInAt.toISOString(),
      signedOutAt: s.signedOutAt?.toISOString() ?? null,
      durationMinutes,
      selfSignIn: isSelf
    };
  });

  const completedDurations = attendees
    .map((a) => a.durationMinutes)
    .filter((d): d is number => d !== null);

  const avgDurationMinutes =
    completedDurations.length > 0
      ? Math.round(completedDurations.reduce((sum, d) => sum + d, 0) / completedDurations.length)
      : null;

  return {
    totalSignIns: signIns.length,
    uniqueStudents,
    selfSignIns,
    assistedSignIns,
    avgDurationMinutes,
    attendees
  };
}

function buildHelpSummary(requests: HelpQueueItem[]): HelpSummary {
  let resolvedCount = 0;
  let cancelledCount = 0;
  let pendingCount = 0;
  let claimedCount = 0;

  const responseTimes: number[] = [];
  const resolutionTimes: number[] = [];
  const categoryMap = new Map<string, number>();
  const urgencyMap = new Map<HelpUrgency | null, number>();

  for (const req of requests) {
    switch (req.status) {
      case 'resolved':
        resolvedCount++;
        break;
      case 'cancelled':
        cancelledCount++;
        break;
      case 'pending':
        pendingCount++;
        break;
      case 'claimed':
        claimedCount++;
        break;
    }

    if (req.claimedAt) {
      responseTimes.push((req.claimedAt.getTime() - req.createdAt.getTime()) / 60_000);
    }

    if (req.resolvedAt) {
      resolutionTimes.push((req.resolvedAt.getTime() - req.createdAt.getTime()) / 60_000);
    }

    const catName = req.category?.name ?? 'Uncategorized';
    categoryMap.set(catName, (categoryMap.get(catName) ?? 0) + 1);

    urgencyMap.set(req.urgency, (urgencyMap.get(req.urgency) ?? 0) + 1);
  }

  const avgResponseTimeMinutes =
    responseTimes.length > 0
      ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length)
      : null;

  const avgResolutionTimeMinutes =
    resolutionTimes.length > 0
      ? Math.round(resolutionTimes.reduce((s, t) => s + t, 0) / resolutionTimes.length)
      : null;

  const byCategory: CategoryBreakdown[] = [...categoryMap.entries()]
    .map(([categoryName, count]) => ({ categoryName, count }))
    .sort((a, b) => b.count - a.count);

  const byUrgency: UrgencyBreakdown[] = [...urgencyMap.entries()]
    .map(([urgency, count]) => ({ urgency, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRequests: requests.length,
    resolvedCount,
    cancelledCount,
    pendingCount,
    claimedCount,
    avgResponseTimeMinutes,
    avgResolutionTimeMinutes,
    byCategory,
    byUrgency
  };
}

const EVENT_DESCRIPTIONS: Record<string, string> = {
  SESSION_STARTED: 'Session started',
  SESSION_ENDED: 'Session ended',
  PERSON_SIGNED_IN: 'Student signed in',
  PERSON_SIGNED_OUT: 'Student signed out',
  HELP_REQUESTED: 'Help requested',
  HELP_CLAIMED: 'Help request claimed',
  HELP_UNCLAIMED: 'Help request unclaimed',
  HELP_RESOLVED: 'Help request resolved',
  HELP_CANCELLED: 'Help request cancelled',
  PROFILE_UPDATED: 'Profile updated'
};

function buildTimeline(events: StoredEvent[], personNames: Map<string, string>): TimelineEvent[] {
  return events
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((event) => ({
      timestamp: event.createdAt.toISOString(),
      eventType: event.eventType,
      description: EVENT_DESCRIPTIONS[event.eventType] ?? event.eventType,
      actorName: event.actorId ? (personNames.get(event.actorId) ?? null) : null
    }));
}
