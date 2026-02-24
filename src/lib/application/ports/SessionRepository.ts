/**
 * Stub — will be fully defined when porting the application layer (Phase 3).
 */
export interface SessionRepository {
  getById(id: string): Promise<SessionRecord | null>;
  findActive(classroomId: string): Promise<SessionRecord | null>;
  listByClassroom(classroomId: string): Promise<SessionRecord[]>;
  create(data: CreateSessionInput): Promise<SessionRecord>;
  update(id: string, data: Partial<SessionRecord>): Promise<SessionRecord>;
}

export interface SessionRecord {
  id: string;
  classroomId: string;
  name: string | null;
  sessionType: 'structured' | 'drop_in';
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
}

export interface CreateSessionInput {
  classroomId: string;
  name?: string;
  sessionType: 'structured' | 'drop_in';
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
}
