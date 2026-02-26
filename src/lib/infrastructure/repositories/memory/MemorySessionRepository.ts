import type {
  SessionRepository,
  SessionRecord,
  SessionFilters,
  CreateSessionInput,
  SessionWithClassroom,
  SessionWithDetails,
  IdGenerator
} from '$lib/application/ports';
import type { MemoryStore } from './MemoryStore';

export class MemorySessionRepository implements SessionRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly idGen: IdGenerator
  ) {}

  async getById(id: string): Promise<SessionRecord | null> {
    return this.store.sessions.get(id) ?? null;
  }

  async getWithClassroom(id: string): Promise<SessionWithClassroom | null> {
    const session = this.store.sessions.get(id);
    if (!session) return null;
    const classroom = this.store.classrooms.get(session.classroomId);
    if (!classroom) return null;
    return {
      ...session,
      classroom: { id: classroom.id, name: classroom.name, displayCode: classroom.displayCode }
    };
  }

  async getWithDetails(id: string): Promise<SessionWithDetails | null> {
    const session = this.store.sessions.get(id);
    if (!session) return null;
    const classroom = this.store.classrooms.get(session.classroomId);
    if (!classroom) return null;

    const signIns = [...this.store.signIns.values()]
      .filter((s) => s.sessionId === id)
      .map((s) => {
        const person = this.store.persons.get(s.personId);
        return {
          id: s.id,
          personId: s.personId,
          signedInAt: s.signedInAt,
          signedOutAt: s.signedOutAt,
          person: {
            id: s.personId,
            displayName: person?.displayName ?? 'Unknown',
            pronouns: person?.pronouns ?? null
          }
        };
      });

    return {
      ...session,
      classroom: { id: classroom.id, name: classroom.name, displayCode: classroom.displayCode },
      signIns
    };
  }

  async getCurrentWithClassroom(classroomId: string): Promise<SessionWithClassroom | null> {
    const session = await this.findActive(classroomId);
    if (!session) return null;
    return this.getWithClassroom(session.id);
  }

  async findActive(classroomId: string): Promise<SessionRecord | null> {
    for (const s of this.store.sessions.values()) {
      if (s.classroomId === classroomId && s.status === 'active') return s;
    }
    return null;
  }

  async listByClassroom(classroomId: string, filters?: SessionFilters): Promise<SessionRecord[]> {
    const result: SessionRecord[] = [];
    for (const s of this.store.sessions.values()) {
      if (s.classroomId !== classroomId) continue;
      if (filters?.from && s.scheduledDate < filters.from) continue;
      if (filters?.to && s.scheduledDate > filters.to) continue;
      result.push(s);
    }
    return result.sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime());
  }

  async create(input: CreateSessionInput): Promise<SessionRecord> {
    const id = this.idGen.generate();
    const record: SessionRecord = {
      id,
      classroomId: input.classroomId,
      name: input.name ?? null,
      sessionType: input.sessionType,
      scheduledDate: input.scheduledDate,
      startTime: input.startTime,
      endTime: input.endTime,
      actualStartAt: null,
      actualEndAt: null,
      status: input.status ?? 'scheduled'
    };
    this.store.sessions.set(id, record);
    return record;
  }

  async update(id: string, data: Partial<SessionRecord>): Promise<SessionRecord> {
    const session = this.store.sessions.get(id);
    if (!session) throw new Error(`Session ${id} not found`);
    const updated = { ...session, ...data, id };
    this.store.sessions.set(id, updated);
    return updated;
  }
}
