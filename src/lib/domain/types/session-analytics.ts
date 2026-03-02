import type { SessionStatus } from './session-status';
import type { HelpUrgency } from './help-urgency';

export type SessionListItem = {
  id: string;
  name: string | null;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number | null;
  studentCount: number;
  helpRequestCount: number;
};

export type AttendeeRecord = {
  personId: string;
  displayName: string;
  signedInAt: string;
  signedOutAt: string | null;
  durationMinutes: number | null;
  selfSignIn: boolean;
};

export type AttendanceSummary = {
  totalSignIns: number;
  uniqueStudents: number;
  selfSignIns: number;
  assistedSignIns: number;
  avgDurationMinutes: number | null;
  attendees: AttendeeRecord[];
};

export type CategoryBreakdown = {
  categoryName: string;
  count: number;
};

export type UrgencyBreakdown = {
  urgency: HelpUrgency | null;
  count: number;
};

export type HelpSummary = {
  totalRequests: number;
  resolvedCount: number;
  cancelledCount: number;
  pendingCount: number;
  claimedCount: number;
  avgResponseTimeMinutes: number | null;
  avgResolutionTimeMinutes: number | null;
  byCategory: CategoryBreakdown[];
  byUrgency: UrgencyBreakdown[];
};

export type TimelineEvent = {
  timestamp: string;
  eventType: string;
  description: string;
  actorName: string | null;
};

export type SessionAnalytics = {
  sessionId: string;
  sessionName: string | null;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  durationMinutes: number | null;
  attendance: AttendanceSummary;
  help: HelpSummary;
  timeline: TimelineEvent[];
};
