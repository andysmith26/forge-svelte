import type {
  ClassroomRecord,
  ClassroomMembership,
  PersonRecord,
  SessionRecord,
  SignInRecord,
  HelpCategoryRecord,
  HelpRequestRecord,
  NinjaDomainRecord,
  NinjaAssignmentRecord,
  PinSessionRecord,
  StoredEvent
} from '$lib/application/ports';
import type {
  ProjectRecord,
  ProjectMembershipRecord,
  SubsystemRecord,
  HandoffRecord,
  HandoffReadStatusRecord,
  HandoffResponseRecord,
  HandoffItemResolutionRecord
} from '$lib/application/ports/ProjectRepository';
import type {
  ChoreRecord,
  ChoreInstanceRecord,
  ChoreVerificationRecord
} from '$lib/application/ports/ChoreRepository';

export type HandoffSubsystemLink = {
  handoffId: string;
  subsystemId: string;
};

export class MemoryStore {
  classrooms = new Map<string, ClassroomRecord>();
  memberships = new Map<string, ClassroomMembership>();
  persons = new Map<string, PersonRecord>();
  sessions = new Map<string, SessionRecord>();
  signIns = new Map<string, SignInRecord>();
  helpCategories = new Map<string, HelpCategoryRecord>();
  helpRequests = new Map<string, HelpRequestRecord>();
  ninjaDomains = new Map<string, NinjaDomainRecord>();
  ninjaAssignments = new Map<string, NinjaAssignmentRecord>();
  pinSessions = new Map<string, PinSessionRecord>();
  domainEvents: StoredEvent[] = [];

  // Projects
  projects = new Map<string, ProjectRecord>();
  projectMemberships = new Map<string, ProjectMembershipRecord>();
  subsystems = new Map<string, SubsystemRecord>();
  handoffs = new Map<string, HandoffRecord>();
  handoffSubsystems: HandoffSubsystemLink[] = [];
  handoffReadStatuses = new Map<string, HandoffReadStatusRecord>();
  handoffResponses = new Map<string, HandoffResponseRecord>();
  handoffItemResolutions = new Map<string, HandoffItemResolutionRecord>();

  // Chores
  chores = new Map<string, ChoreRecord>();
  choreInstances = new Map<string, ChoreInstanceRecord>();
  choreVerifications = new Map<string, ChoreVerificationRecord>();

  /** Plaintext PINs for demo display (personId -> pin) */
  plaintextPins = new Map<string, string>();

  /** Person createdAt timestamps (personId -> Date) */
  personCreatedAt = new Map<string, Date>();

  clear() {
    this.classrooms.clear();
    this.memberships.clear();
    this.persons.clear();
    this.sessions.clear();
    this.signIns.clear();
    this.helpCategories.clear();
    this.helpRequests.clear();
    this.ninjaDomains.clear();
    this.ninjaAssignments.clear();
    this.pinSessions.clear();
    this.domainEvents = [];
    this.projects.clear();
    this.projectMemberships.clear();
    this.subsystems.clear();
    this.handoffs.clear();
    this.handoffSubsystems = [];
    this.handoffReadStatuses.clear();
    this.handoffResponses.clear();
    this.handoffItemResolutions.clear();
    this.chores.clear();
    this.choreInstances.clear();
    this.choreVerifications.clear();
    this.plaintextPins.clear();
    this.personCreatedAt.clear();
  }
}
