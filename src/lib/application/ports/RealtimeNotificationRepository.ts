/**
 * Stub — will be fully defined when porting the application layer (Phase 3).
 */
export interface RealtimeNotificationRepository {
  create(data: CreateNotificationInput): Promise<void>;
  deleteOlderThan(date: Date): Promise<number>;
}

export interface CreateNotificationInput {
  channel: string;
  eventType: string;
  entityType: string;
  entityId: string;
  scopeId: string;
}
