import type { PrismaClient } from '@prisma/client';
import type { Projector } from './base';
import type { StoredEvent } from '$lib/application/ports';
import type { EventType, SessionStartedPayload, SessionEndedPayload } from '$lib/domain/events';

export class SessionProjector implements Projector {
  readonly name = 'SessionProjector';
  readonly handledEvents: readonly EventType[] = ['SESSION_STARTED', 'SESSION_ENDED'];

  async apply(event: StoredEvent, tx: PrismaClient): Promise<void> {
    switch (event.eventType) {
      case 'SESSION_STARTED': {
        const payload = event.payload as SessionStartedPayload;
        await tx.classSession.update({
          where: { id: payload.sessionId },
          data: { status: 'active', actualStartAt: event.createdAt }
        });
        break;
      }
      case 'SESSION_ENDED': {
        const payload = event.payload as SessionEndedPayload;
        await tx.classSession.update({
          where: { id: payload.sessionId },
          data: { status: 'ended', actualEndAt: event.createdAt }
        });
        break;
      }
    }
  }

  async clear(tx: PrismaClient): Promise<void> {
    await tx.classSession.updateMany({
      data: { status: 'scheduled', actualStartAt: null, actualEndAt: null }
    });
  }
}
