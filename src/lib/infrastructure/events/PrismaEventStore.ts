import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  EventStore,
  StoredEvent,
  AppendEventInput,
  EventFilters
} from '$lib/application/ports';
import type { ProjectorRegistry } from './projectors';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export class PrismaEventStore implements EventStore {
  constructor(
    private readonly db: PrismaClient,
    private readonly projectorRegistry: ProjectorRegistry
  ) {}

  async append(input: AppendEventInput): Promise<StoredEvent> {
    return this.db.$transaction(async (tx) => {
      return this.appendWithTx(input, tx);
    });
  }

  private async appendWithTx(input: AppendEventInput, tx: TransactionClient): Promise<StoredEvent> {
    const event = await tx.domainEvent.create({
      data: {
        schoolId: input.schoolId,
        classroomId: input.classroomId ?? null,
        sessionId: input.sessionId ?? null,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? null,
        payload: input.payload as Prisma.InputJsonValue
      }
    });

    await this.projectorRegistry.apply(event as StoredEvent, tx as unknown as PrismaClient);

    return event as StoredEvent;
  }

  async appendAndEmit(input: AppendEventInput): Promise<StoredEvent> {
    // In SvelteKit, there's no EventBus — projectors run in the same
    // transaction and realtime notifications are written separately
    // by use cases that need them.
    return this.append(input);
  }

  async loadEvents(filters?: EventFilters): Promise<StoredEvent[]> {
    const where: Prisma.DomainEventWhereInput = {};

    if (filters) {
      if (filters.schoolId) where.schoolId = filters.schoolId;
      if (filters.classroomId) where.classroomId = filters.classroomId;
      if (filters.sessionId) where.sessionId = filters.sessionId;
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.entityId) where.entityId = filters.entityId;
      if (filters.eventType) where.eventType = filters.eventType;
    }

    const events = await this.db.domainEvent.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });

    return events as StoredEvent[];
  }

  async countEvents(filters?: EventFilters): Promise<number> {
    const where: Prisma.DomainEventWhereInput = {};

    if (filters) {
      if (filters.schoolId) where.schoolId = filters.schoolId;
      if (filters.eventType) where.eventType = filters.eventType;
    }

    return this.db.domainEvent.count({ where });
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.db.domainEvent.deleteMany({
      where: { createdAt: { lt: date } }
    });
    return result.count;
  }
}
