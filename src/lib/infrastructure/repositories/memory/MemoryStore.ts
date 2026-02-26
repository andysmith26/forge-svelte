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
    this.plaintextPins.clear();
    this.personCreatedAt.clear();
  }
}
