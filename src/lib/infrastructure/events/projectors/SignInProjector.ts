import type { PrismaClient } from '@prisma/client';
import type { Projector } from './base';
import type { StoredEvent } from '$lib/application/ports';
import type {
  EventType,
  PersonSignedInPayload,
  PersonSignedOutPayload,
  SessionEndedPayload
} from '$lib/domain/events';

export class SignInProjector implements Projector {
  readonly name = 'SignInProjector';
  readonly handledEvents: readonly EventType[] = [
    'PERSON_SIGNED_IN',
    'PERSON_SIGNED_OUT',
    'SESSION_ENDED'
  ];

  async apply(event: StoredEvent, tx: PrismaClient): Promise<void> {
    switch (event.eventType) {
      case 'PERSON_SIGNED_IN': {
        const payload = event.payload as PersonSignedInPayload;

        await tx.signIn.create({
          data: {
            id: payload.signInId,
            sessionId: payload.sessionId,
            personId: payload.personId,
            signedInAt: event.createdAt,
            signedInById: payload.signedInBy
          }
        });
        break;
      }
      case 'PERSON_SIGNED_OUT': {
        const payload = event.payload as PersonSignedOutPayload;
        await tx.signIn.update({
          where: { id: payload.signInId },
          data: {
            signedOutAt: event.createdAt,
            signedOutById: payload.signedOutBy,
            signoutType: payload.signoutType
          }
        });
        break;
      }
      case 'SESSION_ENDED': {
        const payload = event.payload as SessionEndedPayload;
        await tx.signIn.updateMany({
          where: { sessionId: payload.sessionId, signedOutAt: null },
          data: { signedOutAt: event.createdAt, signoutType: 'session_end' }
        });
        break;
      }
    }
  }

  async clear(tx: PrismaClient): Promise<void> {
    await tx.signIn.deleteMany({});
  }
}
