import type { PrismaClient, HelpUrgency } from '@prisma/client';
import type { Projector } from './base';
import type { StoredEvent } from '$lib/application/ports';
import type {
  EventType,
  HelpRequestedPayload,
  HelpClaimedPayload,
  HelpUnclaimedPayload,
  HelpResolvedPayload,
  HelpCancelledPayload
} from '$lib/domain/events';

export class HelpRequestProjector implements Projector {
  readonly name = 'HelpRequestProjector';
  readonly handledEvents: readonly EventType[] = [
    'HELP_REQUESTED',
    'HELP_CLAIMED',
    'HELP_UNCLAIMED',
    'HELP_RESOLVED',
    'HELP_CANCELLED'
  ];

  async apply(event: StoredEvent, tx: PrismaClient): Promise<void> {
    switch (event.eventType) {
      case 'HELP_REQUESTED': {
        const payload = event.payload as HelpRequestedPayload;
        await tx.helpRequest.create({
          data: {
            id: payload.requestId,
            classroomId: payload.classroomId,
            sessionId: payload.sessionId,
            requesterId: payload.requesterId,
            categoryId: payload.categoryId ?? null,
            description: payload.description,
            whatITried: payload.whatITried,
            urgency: payload.urgency as HelpUrgency,
            status: 'pending',
            createdAt: event.createdAt
          }
        });
        break;
      }
      case 'HELP_CLAIMED': {
        const payload = event.payload as HelpClaimedPayload;
        await tx.helpRequest.update({
          where: { id: payload.requestId },
          data: {
            status: 'claimed',
            claimedById: payload.claimedById,
            claimedAt: event.createdAt
          }
        });
        break;
      }
      case 'HELP_UNCLAIMED': {
        const payload = event.payload as HelpUnclaimedPayload;
        await tx.helpRequest.update({
          where: { id: payload.requestId },
          data: { status: 'pending', claimedById: null, claimedAt: null }
        });
        break;
      }
      case 'HELP_RESOLVED': {
        const payload = event.payload as HelpResolvedPayload;
        await tx.helpRequest.update({
          where: { id: payload.requestId },
          data: {
            status: 'resolved',
            resolvedAt: event.createdAt,
            resolutionNotes: payload.resolutionNotes ?? null
          }
        });
        break;
      }
      case 'HELP_CANCELLED': {
        const payload = event.payload as HelpCancelledPayload;
        await tx.helpRequest.update({
          where: { id: payload.requestId },
          data: {
            status: 'cancelled',
            cancelledAt: event.createdAt,
            cancellationReason: payload.reason ?? null
          }
        });
        break;
      }
    }
  }

  async clear(tx: PrismaClient): Promise<void> {
    await tx.helpRequest.deleteMany({});
  }
}
