import type {
  PinRepository,
  PinCandidate,
  PinSessionRecord,
  CreatePinSessionInput,
  PersonPinRecord,
  PersonPinSummary,
  IdGenerator
} from '$lib/application/ports';
import type { MemoryStore } from './MemoryStore';

export class MemoryPinRepository implements PinRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly idGen: IdGenerator
  ) {}

  async findClassroomIdByDisplayCode(code: string): Promise<string | null> {
    const upper = code.toUpperCase();
    for (const c of this.store.classrooms.values()) {
      if (c.displayCode.toUpperCase() === upper) return c.id;
    }
    return null;
  }

  async findLoginCandidates(classroomId: string): Promise<PinCandidate[]> {
    const candidates: PinCandidate[] = [];
    for (const m of this.store.memberships.values()) {
      if (m.classroomId === classroomId && m.role === 'student' && m.isActive) {
        const person = this.store.persons.get(m.personId);
        if (person && person.isActive) {
          // In demo mode, pinHash is stored via updatePersonPinHash
          // We look for it in the persons map's "virtual" pinHash field
          // or in the plaintextPins map (we store hashes in a side map)
          const pinHash = this.getPinHash(m.personId);
          if (pinHash) {
            candidates.push({ personId: m.personId, pinHash });
          }
        }
      }
    }
    return candidates;
  }

  private pinHashes = new Map<string, string>();

  private getPinHash(personId: string): string | null {
    return this.pinHashes.get(personId) ?? null;
  }

  setPinHash(personId: string, hash: string) {
    this.pinHashes.set(personId, hash);
  }

  clearPinHashes() {
    this.pinHashes.clear();
  }

  async createPinSession(input: CreatePinSessionInput): Promise<PinSessionRecord> {
    const id = this.idGen.generate();
    const person = this.store.persons.get(input.personId);
    const record: PinSessionRecord = {
      id,
      token: input.token,
      personId: input.personId,
      classroomId: input.classroomId,
      displayName: person?.displayName ?? 'Unknown',
      expiresAt: input.expiresAt,
      lastActivityAt: new Date()
    };
    this.store.pinSessions.set(input.token, record);
    return record;
  }

  async getPinSessionByToken(token: string): Promise<PinSessionRecord | null> {
    return this.store.pinSessions.get(token) ?? null;
  }

  async touchPinSession(token: string, lastActivityAt: Date): Promise<void> {
    const session = this.store.pinSessions.get(token);
    if (session) {
      this.store.pinSessions.set(token, { ...session, lastActivityAt });
    }
  }

  async deletePinSession(token: string): Promise<void> {
    this.store.pinSessions.delete(token);
  }

  async deletePinSessionsForPerson(personId: string): Promise<number> {
    let count = 0;
    for (const [token, session] of this.store.pinSessions.entries()) {
      if (session.personId === personId) {
        this.store.pinSessions.delete(token);
        count++;
      }
    }
    return count;
  }

  async updatePersonPinHash(personId: string, pinHash: string | null): Promise<void> {
    if (pinHash) {
      this.pinHashes.set(personId, pinHash);
    } else {
      this.pinHashes.delete(personId);
      this.store.plaintextPins.delete(personId);
    }
  }

  async updatePersonLastLogin(personId: string, lastLoginAt: Date): Promise<void> {
    // No-op for demo — lastLoginAt is not tracked in PersonRecord
    void personId;
    void lastLoginAt;
  }

  async getPersonPinSummary(personId: string): Promise<PersonPinSummary | null> {
    const person = this.store.persons.get(personId);
    if (!person) return null;

    const classrooms: { id: string; name: string; displayCode: string }[] = [];
    for (const m of this.store.memberships.values()) {
      if (m.personId === personId && m.isActive) {
        const c = this.store.classrooms.get(m.classroomId);
        if (c) classrooms.push({ id: c.id, name: c.name, displayCode: c.displayCode });
      }
    }

    return {
      hasPin: this.pinHashes.has(personId),
      classrooms
    };
  }

  async listStudentsWithPins(classroomId: string): Promise<PersonPinRecord[]> {
    const result: PersonPinRecord[] = [];
    for (const m of this.store.memberships.values()) {
      if (m.classroomId === classroomId && m.role === 'student' && m.isActive) {
        const person = this.store.persons.get(m.personId);
        if (person) {
          result.push({
            id: person.id,
            displayName: person.displayName,
            email: person.email,
            hasPin: this.pinHashes.has(person.id)
          });
        }
      }
    }
    return result;
  }

  async listStudentIdsWithoutPins(classroomId: string): Promise<string[]> {
    const result: string[] = [];
    for (const m of this.store.memberships.values()) {
      if (m.classroomId === classroomId && m.role === 'student' && m.isActive) {
        if (!this.pinHashes.has(m.personId)) {
          result.push(m.personId);
        }
      }
    }
    return result;
  }

  async getMembership(personId: string, classroomId: string): Promise<{ id: string } | null> {
    for (const m of this.store.memberships.values()) {
      if (m.personId === personId && m.classroomId === classroomId && m.isActive) {
        return { id: m.id };
      }
    }
    return null;
  }

  async getPersonPinHash(personId: string): Promise<string | null> {
    return this.getPinHash(personId);
  }
}
