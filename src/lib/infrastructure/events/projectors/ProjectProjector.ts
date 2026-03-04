import type { PrismaClient, ProjectVisibility } from '@prisma/client';
import type { Projector } from './base';
import type { StoredEvent } from '$lib/application/ports';
import type {
  EventType,
  ProjectCreatedPayload,
  ProjectUpdatedPayload,
  ProjectArchivedPayload,
  ProjectUnarchivedPayload,
  ProjectMemberAddedPayload,
  ProjectMemberRemovedPayload,
  ProjectSubsystemAddedPayload,
  HandoffSubmittedPayload,
  HandoffResponseAddedPayload,
  HandoffItemResolvedPayload
} from '$lib/domain/events';

export class ProjectProjector implements Projector {
  readonly name = 'ProjectProjector';
  readonly handledEvents: readonly EventType[] = [
    'PROJECT_CREATED',
    'PROJECT_UPDATED',
    'PROJECT_ARCHIVED',
    'PROJECT_UNARCHIVED',
    'PROJECT_MEMBER_ADDED',
    'PROJECT_MEMBER_REMOVED',
    'PROJECT_SUBSYSTEM_ADDED',
    'HANDOFF_SUBMITTED',
    'HANDOFF_RESPONSE_ADDED',
    'HANDOFF_ITEM_RESOLVED'
  ];

  async apply(event: StoredEvent, tx: PrismaClient): Promise<void> {
    switch (event.eventType) {
      case 'PROJECT_CREATED': {
        const payload = event.payload as ProjectCreatedPayload;
        await tx.project.create({
          data: {
            id: payload.projectId,
            schoolId: payload.schoolId,
            name: payload.name,
            description: payload.description ?? null,
            visibility: (payload.visibility as ProjectVisibility) ?? 'browseable',
            createdById: payload.createdBy,
            createdAt: event.createdAt
          }
        });
        break;
      }
      case 'PROJECT_UPDATED': {
        const payload = event.payload as ProjectUpdatedPayload & Record<string, unknown>;
        const data: Record<string, unknown> = {};
        if (payload.changedFields.includes('name') && 'name' in payload) {
          data.name = payload.name;
        }
        if (payload.changedFields.includes('description') && 'description' in payload) {
          data.description = payload.description;
        }
        if (payload.changedFields.includes('visibility') && 'visibility' in payload) {
          data.visibility = payload.visibility as ProjectVisibility;
        }
        if (Object.keys(data).length > 0) {
          await tx.project.update({
            where: { id: payload.projectId },
            data
          });
        }
        break;
      }
      case 'PROJECT_ARCHIVED': {
        const payload = event.payload as ProjectArchivedPayload;
        await tx.project.update({
          where: { id: payload.projectId },
          data: { isArchived: true }
        });
        break;
      }
      case 'PROJECT_UNARCHIVED': {
        const payload = event.payload as ProjectUnarchivedPayload;
        await tx.project.update({
          where: { id: payload.projectId },
          data: { isArchived: false }
        });
        break;
      }
      case 'PROJECT_MEMBER_ADDED': {
        const payload = event.payload as ProjectMemberAddedPayload;
        const existing = await tx.projectMembership.findUnique({
          where: {
            projectId_personId: {
              projectId: payload.projectId,
              personId: payload.personId
            }
          }
        });
        if (existing) {
          await tx.projectMembership.update({
            where: { id: existing.id },
            data: { isActive: true, leftAt: null, joinedAt: event.createdAt }
          });
        } else {
          await tx.projectMembership.create({
            data: {
              id: event.entityId,
              projectId: payload.projectId,
              personId: payload.personId,
              isActive: true,
              joinedAt: event.createdAt
            }
          });
        }
        break;
      }
      case 'PROJECT_MEMBER_REMOVED': {
        const payload = event.payload as ProjectMemberRemovedPayload;
        const membership = await tx.projectMembership.findUnique({
          where: {
            projectId_personId: {
              projectId: payload.projectId,
              personId: payload.personId
            }
          }
        });
        if (membership) {
          await tx.projectMembership.update({
            where: { id: membership.id },
            data: { isActive: false, leftAt: event.createdAt }
          });
        }
        break;
      }
      case 'PROJECT_SUBSYSTEM_ADDED': {
        const payload = event.payload as ProjectSubsystemAddedPayload;
        const nextOrder = await tx.subsystem.count({
          where: { projectId: payload.projectId }
        });
        await tx.subsystem.create({
          data: {
            id: payload.subsystemId,
            projectId: payload.projectId,
            name: payload.name,
            displayOrder: nextOrder,
            isActive: true,
            createdAt: event.createdAt
          }
        });
        break;
      }
      case 'HANDOFF_SUBMITTED': {
        const payload = event.payload as HandoffSubmittedPayload;
        await tx.handoff.create({
          data: {
            id: payload.handoffId,
            projectId: payload.projectId,
            authorId: payload.authorId,
            sessionId: payload.sessionId ?? null,
            whatIDid: payload.whatIDid,
            whatsNext: payload.whatsNext ?? null,
            blockers: payload.blockers ?? null,
            questions: payload.questions ?? null,
            createdAt: event.createdAt
          }
        });
        if (payload.subsystemIds.length > 0) {
          await tx.handoffSubsystem.createMany({
            data: payload.subsystemIds.map((subsystemId) => ({
              handoffId: payload.handoffId,
              subsystemId
            }))
          });
        }
        break;
      }
      case 'HANDOFF_RESPONSE_ADDED': {
        const payload = event.payload as HandoffResponseAddedPayload;
        await tx.handoffResponse.create({
          data: {
            id: payload.responseId,
            handoffId: payload.handoffId,
            itemType: payload.itemType,
            authorId: payload.authorId,
            content: payload.content,
            createdAt: event.createdAt
          }
        });
        break;
      }
      case 'HANDOFF_ITEM_RESOLVED': {
        const payload = event.payload as HandoffItemResolvedPayload;
        await tx.handoffItemResolution.create({
          data: {
            id: payload.resolutionId,
            handoffId: payload.handoffId,
            itemType: payload.itemType,
            resolvedById: payload.resolvedById,
            note: payload.note ?? null,
            createdAt: event.createdAt
          }
        });
        break;
      }
    }
  }

  async clear(tx: PrismaClient): Promise<void> {
    await tx.handoffResponse.deleteMany({});
    await tx.handoffItemResolution.deleteMany({});
    await tx.handoffSubsystem.deleteMany({});
    await tx.handoff.deleteMany({});
    await tx.handoffReadStatus.deleteMany({});
    await tx.subsystem.deleteMany({});
    await tx.projectMembership.deleteMany({});
    await tx.project.deleteMany({});
  }
}
