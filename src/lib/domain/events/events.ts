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
  schoolId: string;
  name: string;
  description: string | null;
  visibility: string;
  createdBy: string;
  byTeacher: boolean;
};

export type ProjectCreatedEvent = DomainEvent<'PROJECT_CREATED', ProjectCreatedPayload>;

export type ProjectUpdatedPayload = {
  projectId: string;
  schoolId: string;
  changedFields: string[];
  updatedBy: string;
  byTeacher: boolean;
};

export type ProjectUpdatedEvent = DomainEvent<'PROJECT_UPDATED', ProjectUpdatedPayload>;

export type ProjectArchivedPayload = {
  projectId: string;
  schoolId: string;
  archivedBy: string;
  byTeacher: boolean;
};

export type ProjectArchivedEvent = DomainEvent<'PROJECT_ARCHIVED', ProjectArchivedPayload>;

export type ProjectUnarchivedPayload = {
  projectId: string;
  schoolId: string;
  unarchivedBy: string;
  byTeacher: boolean;
};

export type ProjectUnarchivedEvent = DomainEvent<'PROJECT_UNARCHIVED', ProjectUnarchivedPayload>;

export type ProjectMemberAddedPayload = {
  projectId: string;
  schoolId: string;
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
  schoolId: string;
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
  schoolId: string;
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
  schoolId: string;
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

export type HandoffResponseAddedPayload = {
  responseId: string;
  handoffId: string;
  projectId: string;
  schoolId: string;
  itemType: 'blocker' | 'question';
  authorId: string;
  content: string;
  byTeacher: boolean;
};

export type HandoffResponseAddedEvent = DomainEvent<
  'HANDOFF_RESPONSE_ADDED',
  HandoffResponseAddedPayload
>;

export type HandoffItemResolvedPayload = {
  resolutionId: string;
  handoffId: string;
  projectId: string;
  schoolId: string;
  itemType: 'blocker' | 'question';
  resolvedById: string;
  note: string | null;
  byTeacher: boolean;
};

export type HandoffItemResolvedEvent = DomainEvent<
  'HANDOFF_ITEM_RESOLVED',
  HandoffItemResolvedPayload
>;

// Chore Events

export type ChoreDefinedPayload = {
  choreId: string;
  schoolId: string;
  name: string;
  description: string;
  size: string;
  recurrence: string;
  verificationType: string;
  location: string | null;
  createdBy: string;
  byTeacher: boolean;
};

export type ChoreDefinedEvent = DomainEvent<'CHORE_DEFINED', ChoreDefinedPayload>;

export type ChoreUpdatedPayload = {
  choreId: string;
  schoolId: string;
  changedFields: string[];
  updatedBy: string;
  byTeacher: boolean;
};

export type ChoreUpdatedEvent = DomainEvent<'CHORE_UPDATED', ChoreUpdatedPayload>;

export type ChoreArchivedPayload = {
  choreId: string;
  schoolId: string;
  archivedBy: string;
  byTeacher: boolean;
};

export type ChoreArchivedEvent = DomainEvent<'CHORE_ARCHIVED', ChoreArchivedPayload>;

export type ChoreInstanceCreatedPayload = {
  instanceId: string;
  choreId: string;
  schoolId: string;
  dueDate: string | null;
};

export type ChoreInstanceCreatedEvent = DomainEvent<
  'CHORE_INSTANCE_CREATED',
  ChoreInstanceCreatedPayload
>;

export type ChoreClaimedPayload = {
  instanceId: string;
  choreId: string;
  schoolId: string;
  claimedBy: string;
};

export type ChoreClaimedEvent = DomainEvent<'CHORE_CLAIMED', ChoreClaimedPayload>;

export type ChoreCompletedPayload = {
  instanceId: string;
  choreId: string;
  schoolId: string;
  completedBy: string;
  completionNotes: string | null;
};

export type ChoreCompletedEvent = DomainEvent<'CHORE_COMPLETED', ChoreCompletedPayload>;

export type ChoreVerifiedPayload = {
  verificationId: string;
  instanceId: string;
  choreId: string;
  schoolId: string;
  verifierId: string;
  decision: string;
  feedback: string | null;
  byTeacher: boolean;
};

export type ChoreVerifiedEvent = DomainEvent<'CHORE_VERIFIED', ChoreVerifiedPayload>;

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
  | HandoffSubmittedEvent
  | HandoffResponseAddedEvent
  | HandoffItemResolvedEvent
  | ChoreDefinedEvent
  | ChoreUpdatedEvent
  | ChoreArchivedEvent
  | ChoreInstanceCreatedEvent
  | ChoreClaimedEvent
  | ChoreCompletedEvent
  | ChoreVerifiedEvent;

export type EventType = ForgeEvent['type'];

export type EventOfType<T extends EventType> = Extract<ForgeEvent, { type: T }>;
