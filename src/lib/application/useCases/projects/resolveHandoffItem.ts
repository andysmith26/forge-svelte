import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { HandoffEntity } from '$lib/domain/entities/handoff.entity';
import { ValidationError } from '$lib/domain/errors';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ResolveHandoffItemError =
  | { type: 'HANDOFF_NOT_FOUND' }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'ITEM_NOT_FOUND' }
  | { type: 'ALREADY_RESOLVED' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function resolveHandoffItem(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    handoffId: string;
    itemType: 'blocker' | 'question';
    resolvedById: string;
    note?: string | null;
  }
): Promise<Result<{ resolutionId: string }, ResolveHandoffItemError>> {
  try {
    const handoff = await deps.projectRepo.getHandoffById(input.handoffId);
    if (!handoff) return err({ type: 'HANDOFF_NOT_FOUND' });

    // Check the handoff has the specified item type
    if (input.itemType === 'blocker' && !handoff.blockers) {
      return err({ type: 'ITEM_NOT_FOUND' });
    }
    if (input.itemType === 'question' && !handoff.questions) {
      return err({ type: 'ITEM_NOT_FOUND' });
    }

    const project = await deps.projectRepo.getById(handoff.projectId);
    if (!project) return err({ type: 'HANDOFF_NOT_FOUND' });

    const isTeacher = await checkIsSchoolTeacher(deps, input.resolvedById, project.schoolId);
    const isMember = !!(await deps.projectRepo.getActiveMembership(
      handoff.projectId,
      input.resolvedById
    ));

    if (!isTeacher && !isMember) {
      return err({ type: 'NOT_AUTHORIZED' });
    }

    // Check not already resolved
    const existing = await deps.projectRepo.getResolution(input.handoffId, input.itemType);
    if (existing) {
      return err({ type: 'ALREADY_RESOLVED' });
    }

    // Validate note if provided
    const note = input.note?.trim() || null;
    if (note) {
      try {
        HandoffEntity.validateResolutionNote(note);
      } catch (e) {
        if (e instanceof ValidationError) {
          return err({ type: 'VALIDATION_ERROR', message: e.message });
        }
        throw e;
      }
    }

    const resolutionId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: project.schoolId,
      eventType: 'HANDOFF_ITEM_RESOLVED',
      entityType: 'HandoffItemResolution',
      entityId: resolutionId,
      actorId: input.resolvedById,
      payload: {
        resolutionId,
        handoffId: input.handoffId,
        projectId: handoff.projectId,
        schoolId: project.schoolId,
        itemType: input.itemType,
        resolvedById: input.resolvedById,
        note,
        byTeacher: isTeacher
      }
    });

    return ok({ resolutionId });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
