import type {
  PersonRepository,
  PersonRecord,
  PersonProfile,
  CreatePersonInput,
  UpdatePersonInput,
  UpdateProfileInput,
  StudentSummary,
  CreateMembershipInput,
  UpdateMembershipInput,
  ClassroomMembership
} from '$lib/application/ports';
import type { IdGenerator } from '$lib/application/ports';
import type { MemoryStore } from './MemoryStore';

export class MemoryPersonRepository implements PersonRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly idGen: IdGenerator
  ) {}

  async getById(id: string): Promise<PersonRecord | null> {
    return this.store.persons.get(id) ?? null;
  }

  async getProfile(id: string): Promise<PersonProfile | null> {
    const p = this.store.persons.get(id);
    if (!p) return null;
    return {
      id: p.id,
      displayName: p.displayName,
      legalName: p.legalName,
      pronouns: p.pronouns,
      askMeAbout: p.askMeAbout,
      email: p.email
    };
  }

  async updateProfile(id: string, input: UpdateProfileInput): Promise<PersonProfile> {
    const p = this.store.persons.get(id);
    if (!p) throw new Error(`Person ${id} not found`);
    const updated = {
      ...p,
      ...(input.displayName !== undefined && { displayName: input.displayName }),
      ...(input.pronouns !== undefined && { pronouns: input.pronouns }),
      ...(input.askMeAbout !== undefined && { askMeAbout: input.askMeAbout })
    };
    this.store.persons.set(id, updated);
    return {
      id: updated.id,
      displayName: updated.displayName,
      legalName: updated.legalName,
      pronouns: updated.pronouns,
      askMeAbout: updated.askMeAbout,
      email: updated.email
    };
  }

  async findByEmail(email: string): Promise<PersonRecord | null> {
    for (const p of this.store.persons.values()) {
      if (p.email === email) return p;
    }
    return null;
  }

  async createPerson(input: CreatePersonInput): Promise<PersonRecord> {
    const id = this.idGen.generate();
    const person: PersonRecord = {
      id,
      schoolId: input.schoolId,
      email: input.email ?? null,
      legalName: input.legalName,
      displayName: input.displayName,
      pronouns: null,
      gradeLevel: input.gradeLevel ?? null,
      askMeAbout: [],
      isActive: true
    };
    this.store.persons.set(id, person);
    this.store.personCreatedAt.set(id, new Date());
    return person;
  }

  async updatePerson(id: string, input: UpdatePersonInput): Promise<PersonRecord> {
    const p = this.store.persons.get(id);
    if (!p) throw new Error(`Person ${id} not found`);
    const updated = { ...p, ...input };
    this.store.persons.set(id, updated);
    return updated;
  }

  async listStudents(classroomId: string): Promise<StudentSummary[]> {
    const result: StudentSummary[] = [];
    for (const m of this.store.memberships.values()) {
      if (m.classroomId === classroomId && m.role === 'student' && m.isActive) {
        const p = this.store.persons.get(m.personId);
        if (p) {
          result.push({
            id: p.id,
            displayName: p.displayName,
            email: p.email,
            gradeLevel: p.gradeLevel,
            createdAt: this.store.personCreatedAt.get(p.id) ?? new Date()
          });
        }
      }
    }
    return result;
  }

  async getMembership(
    personId: string,
    classroomId: string,
    options?: { includeInactive?: boolean }
  ): Promise<ClassroomMembership | null> {
    for (const m of this.store.memberships.values()) {
      if (m.personId === personId && m.classroomId === classroomId) {
        if (options?.includeInactive || m.isActive) return m;
      }
    }
    return null;
  }

  async createMembership(input: CreateMembershipInput): Promise<ClassroomMembership> {
    const id = this.idGen.generate();
    const membership: ClassroomMembership = {
      id,
      classroomId: input.classroomId,
      personId: input.personId,
      role: input.role,
      isActive: true,
      joinedAt: new Date(),
      leftAt: null
    };
    this.store.memberships.set(id, membership);
    return membership;
  }

  async updateMembership(id: string, input: UpdateMembershipInput): Promise<ClassroomMembership> {
    const m = this.store.memberships.get(id);
    if (!m) throw new Error(`Membership ${id} not found`);
    const updated = { ...m, ...input };
    this.store.memberships.set(id, updated);
    return updated;
  }
}
