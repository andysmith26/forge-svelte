import type {
  RealtimeNotificationRepository,
  CreateNotificationInput
} from '$lib/application/ports';

export class MemoryRealtimeNotificationRepository implements RealtimeNotificationRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create(data: CreateNotificationInput): Promise<void> {
    // No-op in demo mode
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteOlderThan(date: Date): Promise<number> {
    return 0;
  }
}
