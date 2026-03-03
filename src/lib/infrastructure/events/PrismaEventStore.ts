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

interface NotificationTarget {
  channel: string;
  entityType: string;
  scopeId: string;
}

function getNotificationTargets(event: StoredEvent): NotificationTarget[] {
  const targets: NotificationTarget[] = [];
  const { classroomId, sessionId } = event;

  switch (event.eventType) {
    case 'PERSON_SIGNED_IN':
    case 'PERSON_SIGNED_OUT':
      if (sessionId) {
        targets.push({
          channel: `presence:session:${sessionId}`,
          entityType: 'sign_in',
          scopeId: sessionId
        });
      }
      break;

    case 'SESSION_STARTED':
    case 'SESSION_ENDED':
      if (classroomId) {
        targets.push({
          channel: `session:classroom:${classroomId}`,
          entityType: 'session',
          scopeId: classroomId
        });
      }
      break;

    case 'HELP_REQUESTED':
    case 'HELP_CLAIMED':
    case 'HELP_UNCLAIMED':
    case 'HELP_RESOLVED':
    case 'HELP_CANCELLED':
      if (sessionId) {
        targets.push({
          channel: `help:session:${sessionId}`,
          entityType: 'help_request',
          scopeId: sessionId
        });
      }
      break;

    case 'PROJECT_CREATED':
    case 'PROJECT_UPDATED':
    case 'PROJECT_ARCHIVED':
    case 'PROJECT_UNARCHIVED':
    case 'PROJECT_MEMBER_ADDED':
    case 'PROJECT_MEMBER_REMOVED':
    case 'PROJECT_SUBSYSTEM_ADDED':
    case 'HANDOFF_SUBMITTED':
      if (classroomId) {
        targets.push({
          channel: `projects:classroom:${classroomId}`,
          entityType: 'project',
          scopeId: classroomId
        });
      }
      break;
  }

  return targets;
}

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
    const event = await this.append(input);

    const targets = getNotificationTargets(event);
    if (targets.length > 0) {
      await Promise.all(
        targets.map((t) =>
          this.db.realtimeNotification.create({
            data: {
              channel: t.channel,
              eventType: event.eventType,
              entityType: t.entityType,
              entityId: event.entityId,
              scopeId: t.scopeId
            }
          })
        )
      );
    }

    return event;
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
