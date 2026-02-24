/**
 * Stub — will be fully defined when porting the application layer (Phase 3).
 */
export interface EventStore {
  append(input: AppendEventInput): Promise<StoredEvent>;
  appendAndEmit(input: AppendEventInput): Promise<StoredEvent>;
  loadEvents(filters?: EventFilters): Promise<StoredEvent[]>;
  countEvents(filters?: EventFilters): Promise<number>;
  deleteOlderThan(date: Date): Promise<number>;
}

export interface AppendEventInput {
  schoolId: string;
  classroomId?: string;
  sessionId?: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  payload: Record<string, unknown>;
}

export interface StoredEvent {
  id: string;
  schoolId: string;
  classroomId: string | null;
  sessionId: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  payload: unknown;
  createdAt: Date;
}

export interface EventFilters {
  schoolId?: string;
  classroomId?: string;
  sessionId?: string;
  eventType?: string;
  entityType?: string;
  entityId?: string;
}
