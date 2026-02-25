import type { SessionStatus } from '$lib/domain/types/session-status';

export type SessionType = 'structured' | 'drop_in';

export type SessionRecord = {
  id: string;
  classroomId: string;
  name: string | null;
  sessionType: SessionType;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  status: SessionStatus;
};

export type SessionFilters = {
  from?: Date;
  to?: Date;
};

export type CreateSessionInput = {
  classroomId: string;
  name?: string | null;
  sessionType: SessionType;
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  status?: SessionStatus;
};

export type SessionWithClassroom = SessionRecord & {
  classroom: { id: string; name: string; displayCode: string };
};

export type SessionWithDetails = SessionRecord & {
  classroom: { id: string; name: string; displayCode: string };
  signIns: {
    id: string;
    personId: string;
    signedInAt: Date;
    signedOutAt: Date | null;
    person: { id: string; displayName: string; pronouns: string | null };
  }[];
};

export interface SessionRepository {
  getById(id: string): Promise<SessionRecord | null>;
  getWithClassroom(id: string): Promise<SessionWithClassroom | null>;
  getWithDetails(id: string): Promise<SessionWithDetails | null>;
  getCurrentWithClassroom(classroomId: string): Promise<SessionWithClassroom | null>;
  findActive(classroomId: string): Promise<SessionRecord | null>;
  listByClassroom(classroomId: string, filters?: SessionFilters): Promise<SessionRecord[]>;
  create(input: CreateSessionInput): Promise<SessionRecord>;
  update(id: string, data: Partial<SessionRecord>): Promise<SessionRecord>;
}
