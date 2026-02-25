import type { PrismaClient } from '@prisma/client';
import type { StoredEvent } from '$lib/application/ports';
import type { EventType } from '$lib/domain/events';

export interface Projector {
  readonly name: string;
  readonly handledEvents: readonly EventType[];
  apply(event: StoredEvent, tx: PrismaClient): Promise<void>;
  clear(tx: PrismaClient): Promise<void>;
}

export class ProjectorRegistry {
  private projectors: Projector[] = [];

  register(projector: Projector): void {
    this.projectors.push(projector);
  }

  async apply(event: StoredEvent, tx: PrismaClient): Promise<void> {
    for (const projector of this.projectors) {
      if (projector.handledEvents.includes(event.eventType as EventType)) {
        await projector.apply(event, tx);
      }
    }
  }

  async clearAll(tx: PrismaClient): Promise<void> {
    for (const projector of [...this.projectors].reverse()) {
      await projector.clear(tx);
    }
  }

  getProjectors(): readonly Projector[] {
    return this.projectors;
  }
}
