import type { PrismaClient } from '@prisma/client';
import type {
  RealtimeNotificationRepository,
  CreateNotificationInput
} from '$lib/application/ports';

export class PrismaRealtimeNotificationRepository implements RealtimeNotificationRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(input: CreateNotificationInput): Promise<void> {
    await this.db.realtimeNotification.create({
      data: {
        channel: input.channel,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        scopeId: input.scopeId
      }
    });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.db.realtimeNotification.deleteMany({
      where: { createdAt: { lt: date } }
    });
    return result.count;
  }
}
