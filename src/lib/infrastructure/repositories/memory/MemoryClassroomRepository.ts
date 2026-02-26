import type {
  ClassroomRepository,
  ClassroomRecord,
  ClassroomMembership,
  ClassroomMembershipWithClassroom,
  ClassroomMemberProfile
} from '$lib/application/ports';
import type { MemoryStore } from './MemoryStore';

export class MemoryClassroomRepository implements ClassroomRepository {
  constructor(private readonly store: MemoryStore) {}

  async getById(id: string): Promise<ClassroomRecord | null> {
    return this.store.classrooms.get(id) ?? null;
  }

  async getByDisplayCode(code: string): Promise<ClassroomRecord | null> {
    const upper = code.toUpperCase();
    for (const c of this.store.classrooms.values()) {
      if (c.displayCode.toUpperCase() === upper) return c;
    }
    return null;
  }

  async listMembershipsForPerson(personId: string): Promise<ClassroomMembershipWithClassroom[]> {
    const result: ClassroomMembershipWithClassroom[] = [];
    for (const m of this.store.memberships.values()) {
      if (m.personId === personId && m.isActive) {
        const classroom = this.store.classrooms.get(m.classroomId);
        if (classroom) {
          result.push({ ...m, classroom });
        }
      }
    }
    return result;
  }

  async listMembers(classroomId: string): Promise<ClassroomMemberProfile[]> {
    const result: ClassroomMemberProfile[] = [];
    for (const m of this.store.memberships.values()) {
      if (m.classroomId === classroomId && m.isActive) {
        const person = this.store.persons.get(m.personId);
        if (person) {
          result.push({
            id: person.id,
            displayName: person.displayName,
            pronouns: person.pronouns,
            gradeLevel: person.gradeLevel,
            role: m.role
          });
        }
      }
    }
    return result;
  }

  async getMembership(personId: string, classroomId: string): Promise<ClassroomMembership | null> {
    for (const m of this.store.memberships.values()) {
      if (m.personId === personId && m.classroomId === classroomId && m.isActive) {
        return m;
      }
    }
    return null;
  }

  async updateSettings(classroomId: string, settings: unknown): Promise<void> {
    const classroom = this.store.classrooms.get(classroomId);
    if (classroom) {
      this.store.classrooms.set(classroomId, { ...classroom, settings });
    }
  }
}
