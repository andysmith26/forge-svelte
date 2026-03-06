import type { ChoreRepository, ChoreRecord } from '$lib/application/ports/ChoreRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type {
  ChoreSize,
  ChoreRecurrence,
  ChoreVerificationType
} from '$lib/domain/entities/chore.entity';
import { ChoreEntity } from '$lib/domain/entities/chore.entity';
import { ValidationError } from '$lib/domain/errors';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type UpdateChoreResult = {
  chore: ChoreRecord;
};

export type UpdateChoreError =
  | { type: 'NOT_TEACHER' }
  | { type: 'CHORE_NOT_FOUND' }
  | { type: 'CHORE_ARCHIVED' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function updateChore(
  deps: {
    choreRepo: ChoreRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
  },
  input: {
    choreId: string;
    actorId: string;
    name?: string;
    description?: string;
    size?: ChoreSize;
    estimatedMinutes?: number | null;
    recurrence?: ChoreRecurrence;
    verificationType?: ChoreVerificationType;
    location?: string | null;
  }
): Promise<Result<UpdateChoreResult, UpdateChoreError>> {
  try {
    const chore = await deps.choreRepo.getById(input.choreId);
    if (!chore) {
      return err({ type: 'CHORE_NOT_FOUND' });
    }

    if (!chore.isActive) {
      return err({ type: 'CHORE_ARCHIVED' });
    }

    const byTeacher = await checkIsSchoolTeacher(deps, input.actorId, chore.schoolId);
    if (!byTeacher) {
      return err({ type: 'NOT_TEACHER' });
    }

    try {
      if (input.name !== undefined) ChoreEntity.validateName(input.name);
      if (input.description !== undefined) ChoreEntity.validateDescription(input.description);
    } catch (e) {
      if (e instanceof ValidationError) {
        return err({ type: 'VALIDATION_ERROR', message: e.message });
      }
      throw e;
    }

    const changedFields: string[] = [];
    if (input.name !== undefined) changedFields.push('name');
    if (input.description !== undefined) changedFields.push('description');
    if (input.size !== undefined) changedFields.push('size');
    if (input.estimatedMinutes !== undefined) changedFields.push('estimatedMinutes');
    if (input.recurrence !== undefined) changedFields.push('recurrence');
    if (input.verificationType !== undefined) changedFields.push('verificationType');
    if (input.location !== undefined) changedFields.push('location');

    await deps.eventStore.appendAndEmit({
      schoolId: chore.schoolId,
      eventType: 'CHORE_UPDATED',
      entityType: 'Chore',
      entityId: input.choreId,
      actorId: input.actorId,
      payload: {
        choreId: input.choreId,
        schoolId: chore.schoolId,
        changedFields,
        updatedBy: input.actorId,
        byTeacher,
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() }),
        ...(input.size !== undefined && { size: input.size }),
        ...(input.estimatedMinutes !== undefined && { estimatedMinutes: input.estimatedMinutes }),
        ...(input.recurrence !== undefined && { recurrence: input.recurrence }),
        ...(input.verificationType !== undefined && { verificationType: input.verificationType }),
        ...(input.location !== undefined && { location: input.location })
      }
    });

    const updated = await deps.choreRepo.getById(input.choreId);
    if (!updated) {
      return err({ type: 'CHORE_NOT_FOUND' });
    }

    return ok({ chore: updated });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
