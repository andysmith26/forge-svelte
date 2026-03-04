import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { HandoffEntity } from '$lib/domain/entities/handoff.entity';
import { ValidationError } from '$lib/domain/errors';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type AddHandoffResponseError =
  | { type: 'HANDOFF_NOT_FOUND' }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'ITEM_NOT_FOUND' }
  | { type: 'ITEM_ALREADY_RESOLVED' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function addHandoffResponse(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    handoffId: string;
    itemType: 'blocker' | 'question';
    authorId: string;
    content: string;
  }
): Promise<Result<{ responseId: string }, AddHandoffResponseError>> {
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

    const isTeacher = await checkIsSchoolTeacher(deps, input.authorId, project.schoolId);
    const isMember = !!(await deps.projectRepo.getActiveMembership(
      handoff.projectId,
      input.authorId
    ));

    if (!isTeacher && !isMember) {
      return err({ type: 'NOT_AUTHORIZED' });
    }

    // Check not already resolved
    const resolution = await deps.projectRepo.getResolution(input.handoffId, input.itemType);
    if (resolution) {
      return err({ type: 'ITEM_ALREADY_RESOLVED' });
    }

    // Validate content
    try {
      HandoffEntity.validateResponseContent(input.content);
    } catch (e) {
      if (e instanceof ValidationError) {
        return err({ type: 'VALIDATION_ERROR', message: e.message });
      }
      throw e;
    }

    const responseId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: project.schoolId,
      eventType: 'HANDOFF_RESPONSE_ADDED',
      entityType: 'HandoffResponse',
      entityId: responseId,
      actorId: input.authorId,
      payload: {
        responseId,
        handoffId: input.handoffId,
        projectId: handoff.projectId,
        schoolId: project.schoolId,
        itemType: input.itemType,
        authorId: input.authorId,
        content: input.content.trim(),
        byTeacher: isTeacher
      }
    });

    return ok({ responseId });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
