import type {
  PrismaClient,
  ChoreSize,
  ChoreRecurrence,
  ChoreVerificationType,
  ChoreInstanceStatus,
  ChoreVerificationDecision
} from '@prisma/client';
import type { Projector } from './base';
import type { StoredEvent } from '$lib/application/ports';
import type {
  EventType,
  ChoreDefinedPayload,
  ChoreUpdatedPayload,
  ChoreArchivedPayload,
  ChoreInstanceCreatedPayload,
  ChoreClaimedPayload,
  ChoreCompletedPayload,
  ChoreVerifiedPayload
} from '$lib/domain/events';

export class ChoreProjector implements Projector {
  readonly name = 'ChoreProjector';
  readonly handledEvents: readonly EventType[] = [
    'CHORE_DEFINED',
    'CHORE_UPDATED',
    'CHORE_ARCHIVED',
    'CHORE_INSTANCE_CREATED',
    'CHORE_CLAIMED',
    'CHORE_COMPLETED',
    'CHORE_VERIFIED'
  ];

  async apply(event: StoredEvent, tx: PrismaClient): Promise<void> {
    switch (event.eventType) {
      case 'CHORE_DEFINED': {
        const payload = event.payload as ChoreDefinedPayload;
        await tx.chore.create({
          data: {
            id: payload.choreId,
            schoolId: payload.schoolId,
            name: payload.name,
            description: payload.description,
            size: payload.size as ChoreSize,
            recurrence: payload.recurrence as ChoreRecurrence,
            verificationType: payload.verificationType as ChoreVerificationType,
            location: payload.location ?? null,
            createdById: payload.createdBy,
            createdAt: event.createdAt
          }
        });
        break;
      }
      case 'CHORE_UPDATED': {
        const payload = event.payload as ChoreUpdatedPayload & Record<string, unknown>;
        const data: Record<string, unknown> = {};
        if (payload.changedFields.includes('name') && 'name' in payload) {
          data.name = payload.name;
        }
        if (payload.changedFields.includes('description') && 'description' in payload) {
          data.description = payload.description;
        }
        if (payload.changedFields.includes('size') && 'size' in payload) {
          data.size = payload.size as ChoreSize;
        }
        if (payload.changedFields.includes('estimatedMinutes') && 'estimatedMinutes' in payload) {
          data.estimatedMinutes = payload.estimatedMinutes;
        }
        if (payload.changedFields.includes('recurrence') && 'recurrence' in payload) {
          data.recurrence = payload.recurrence as ChoreRecurrence;
        }
        if (payload.changedFields.includes('verificationType') && 'verificationType' in payload) {
          data.verificationType = payload.verificationType as ChoreVerificationType;
        }
        if (payload.changedFields.includes('location') && 'location' in payload) {
          data.location = payload.location;
        }
        if (Object.keys(data).length > 0) {
          await tx.chore.update({
            where: { id: payload.choreId },
            data
          });
        }
        break;
      }
      case 'CHORE_ARCHIVED': {
        const payload = event.payload as ChoreArchivedPayload;
        await tx.chore.update({
          where: { id: payload.choreId },
          data: { isActive: false }
        });
        break;
      }
      case 'CHORE_INSTANCE_CREATED': {
        const payload = event.payload as ChoreInstanceCreatedPayload;
        await tx.choreInstance.create({
          data: {
            id: payload.instanceId,
            choreId: payload.choreId,
            status: 'available' as ChoreInstanceStatus,
            dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
            createdAt: event.createdAt
          }
        });
        break;
      }
      case 'CHORE_CLAIMED': {
        const payload = event.payload as ChoreClaimedPayload;
        await tx.choreInstance.update({
          where: { id: payload.instanceId },
          data: {
            status: 'claimed' as ChoreInstanceStatus,
            claimedById: payload.claimedBy,
            claimedAt: event.createdAt
          }
        });
        break;
      }
      case 'CHORE_COMPLETED': {
        const payload = event.payload as ChoreCompletedPayload;
        // Look up the chore to check verification type
        const instance = await tx.choreInstance.findUnique({
          where: { id: payload.instanceId },
          include: { chore: true }
        });
        const newStatus: ChoreInstanceStatus =
          instance?.chore.verificationType === 'self' ? 'verified' : 'completed';
        await tx.choreInstance.update({
          where: { id: payload.instanceId },
          data: {
            status: newStatus,
            completedAt: event.createdAt,
            completionNotes: payload.completionNotes ?? null
          }
        });
        break;
      }
      case 'CHORE_VERIFIED': {
        const payload = event.payload as ChoreVerifiedPayload;
        await tx.choreVerification.create({
          data: {
            id: payload.verificationId,
            choreInstanceId: payload.instanceId,
            verifierId: payload.verifierId,
            decision: payload.decision as ChoreVerificationDecision,
            feedback: payload.feedback ?? null,
            verifiedAt: event.createdAt
          }
        });
        const newStatus: ChoreInstanceStatus =
          payload.decision === 'approved' ? 'verified' : 'redo_requested';
        await tx.choreInstance.update({
          where: { id: payload.instanceId },
          data: { status: newStatus }
        });
        break;
      }
    }
  }

  async clear(tx: PrismaClient): Promise<void> {
    await tx.choreVerification.deleteMany({});
    await tx.choreInstance.deleteMany({});
    await tx.chore.deleteMany({});
  }
}
