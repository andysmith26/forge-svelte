export type EventMetadata = {
  eventId: string;
  occurredAt: Date;
  correlationId?: string;
  version: 1;
};

export type DomainEvent<
  TType extends string = string,
  TPayload extends Record<string, unknown> = Record<string, unknown>
> = EventMetadata & {
  type: TType;
  payload: TPayload;
};

// Session Events

export type SessionStartedPayload = {
  sessionId: string;
  classroomId: string;
  startedBy: string;
  byTeacher: boolean;
};

export type SessionStartedEvent = DomainEvent<'SESSION_STARTED', SessionStartedPayload>;

export type SessionEndedPayload = {
  sessionId: string;
  classroomId: string;
  endedBy: string;
  byTeacher: boolean;
};

export type SessionEndedEvent = DomainEvent<'SESSION_ENDED', SessionEndedPayload>;

// Presence Events

export type PersonSignedInPayload = {
  signInId: string;
  sessionId: string;
  classroomId: string;
  personId: string;
  signedInBy: string;
  isSelfSignIn: boolean;
  byTeacher: boolean;
};

export type PersonSignedInEvent = DomainEvent<'PERSON_SIGNED_IN', PersonSignedInPayload>;

export type PersonSignedOutPayload = {
  signInId: string;
  sessionId: string;
  classroomId: string;
  personId: string;
  signedOutBy: string | null;
  signoutType: 'self' | 'manual' | 'auto' | 'session_end';
  byTeacher: boolean;
};

export type PersonSignedOutEvent = DomainEvent<'PERSON_SIGNED_OUT', PersonSignedOutPayload>;

// Help Events

export type HelpRequestedPayload = {
  requestId: string;
  sessionId: string;
  classroomId: string;
  requesterId: string;
  urgency: string | null;
  categoryId: string | null;
  description: string;
  whatITried: string;
  hypothesis: string | null;
  topic: string | null;
  byTeacher: boolean;
};

export type HelpRequestedEvent = DomainEvent<'HELP_REQUESTED', HelpRequestedPayload>;

export type HelpResolvedPayload = {
  requestId: string;
  sessionId: string;
  classroomId: string;
  requesterId: string;
  resolverId: string;
  resolutionNotes: string | null;
  byTeacher: boolean;
};

export type HelpResolvedEvent = DomainEvent<'HELP_RESOLVED', HelpResolvedPayload>;

export type HelpClaimedPayload = {
  requestId: string;
  sessionId: string;
  classroomId: string;
  requesterId: string;
  claimedById: string;
  byTeacher: boolean;
};

export type HelpClaimedEvent = DomainEvent<'HELP_CLAIMED', HelpClaimedPayload>;

export type HelpUnclaimedPayload = {
  requestId: string;
  sessionId: string;
  classroomId: string;
  requesterId: string;
  unclaimedById: string;
  byTeacher: boolean;
};

export type HelpUnclaimedEvent = DomainEvent<'HELP_UNCLAIMED', HelpUnclaimedPayload>;

export type HelpCancelledPayload = {
  requestId: string;
  sessionId: string;
  classroomId: string;
  requesterId: string;
  cancelledBy: string;
  reason: string | null;
  byTeacher: boolean;
};

export type HelpCancelledEvent = DomainEvent<'HELP_CANCELLED', HelpCancelledPayload>;

// Profile Events

export type ProfileUpdatedPayload = {
  personId: string;
  schoolId: string;
  changedFields: string[];
};

export type ProfileUpdatedEvent = DomainEvent<'PROFILE_UPDATED', ProfileUpdatedPayload>;

// Project Events

export type ProjectCreatedPayload = {
  projectId: string;
  classroomId: string;
  name: string;
  description: string | null;
  visibility: string;
  createdBy: string;
  byTeacher: boolean;
};

export type ProjectCreatedEvent = DomainEvent<'PROJECT_CREATED', ProjectCreatedPayload>;

export type ProjectUpdatedPayload = {
  projectId: string;
  classroomId: string;
  changedFields: string[];
  updatedBy: string;
  byTeacher: boolean;
};

export type ProjectUpdatedEvent = DomainEvent<'PROJECT_UPDATED', ProjectUpdatedPayload>;

export type ProjectArchivedPayload = {
  projectId: string;
  classroomId: string;
  archivedBy: string;
  byTeacher: boolean;
};

export type ProjectArchivedEvent = DomainEvent<'PROJECT_ARCHIVED', ProjectArchivedPayload>;

export type ProjectUnarchivedPayload = {
  projectId: string;
  classroomId: string;
  unarchivedBy: string;
  byTeacher: boolean;
};

export type ProjectUnarchivedEvent = DomainEvent<'PROJECT_UNARCHIVED', ProjectUnarchivedPayload>;

export type ProjectMemberAddedPayload = {
  projectId: string;
  classroomId: string;
  personId: string;
  addedBy: string;
  byTeacher: boolean;
};

export type ProjectMemberAddedEvent = DomainEvent<
  'PROJECT_MEMBER_ADDED',
  ProjectMemberAddedPayload
>;

export type ProjectMemberRemovedPayload = {
  projectId: string;
  classroomId: string;
  personId: string;
  removedBy: string;
  byTeacher: boolean;
};

export type ProjectMemberRemovedEvent = DomainEvent<
  'PROJECT_MEMBER_REMOVED',
  ProjectMemberRemovedPayload
>;

export type ProjectSubsystemAddedPayload = {
  projectId: string;
  classroomId: string;
  subsystemId: string;
  name: string;
  addedBy: string;
  byTeacher: boolean;
};

export type ProjectSubsystemAddedEvent = DomainEvent<
  'PROJECT_SUBSYSTEM_ADDED',
  ProjectSubsystemAddedPayload
>;

export type HandoffSubmittedPayload = {
  handoffId: string;
  projectId: string;
  classroomId: string;
  sessionId: string | null;
  authorId: string;
  whatIDid: string;
  whatsNext: string | null;
  blockers: string | null;
  questions: string | null;
  subsystemIds: string[];
  byTeacher: boolean;
};

export type HandoffSubmittedEvent = DomainEvent<'HANDOFF_SUBMITTED', HandoffSubmittedPayload>;

// Union type of all events

export type ForgeEvent =
  | SessionStartedEvent
  | SessionEndedEvent
  | PersonSignedInEvent
  | PersonSignedOutEvent
  | HelpRequestedEvent
  | HelpClaimedEvent
  | HelpUnclaimedEvent
  | HelpResolvedEvent
  | HelpCancelledEvent
  | ProfileUpdatedEvent
  | ProjectCreatedEvent
  | ProjectUpdatedEvent
  | ProjectArchivedEvent
  | ProjectUnarchivedEvent
  | ProjectMemberAddedEvent
  | ProjectMemberRemovedEvent
  | ProjectSubsystemAddedEvent
  | HandoffSubmittedEvent;

export type EventType = ForgeEvent['type'];

export type EventOfType<T extends EventType> = Extract<ForgeEvent, { type: T }>;
