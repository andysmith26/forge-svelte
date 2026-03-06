import type { ChoreRepository, ChoreRecord } from '$lib/application/ports/ChoreRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { PersonRepository } from '$lib/application/ports/PersonRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
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

export type DefineChoreResult = {
  chore: ChoreRecord;
};

export type DefineChoreError =
  | { type: 'NOT_SCHOOL_MEMBER' }
  | { type: 'NOT_TEACHER' }
  | { type: 'DUPLICATE_NAME' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'CHORE_NOT_FOUND_AFTER_CREATE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function defineChore(
  deps: {
    choreRepo: ChoreRepository;
    classroomRepo: ClassroomRepository;
    personRepo: PersonRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    schoolId: string;
    name: string;
    description: string;
    size?: ChoreSize;
    estimatedMinutes?: number | null;
    recurrence?: ChoreRecurrence;
    verificationType?: ChoreVerificationType;
    location?: string | null;
    createdById: string;
  }
): Promise<Result<DefineChoreResult, DefineChoreError>> {
  try {
    const person = await deps.personRepo.getById(input.createdById);
    if (!person || person.schoolId !== input.schoolId) {
      return err({ type: 'NOT_SCHOOL_MEMBER' });
    }

    const byTeacher = await checkIsSchoolTeacher(deps, input.createdById, input.schoolId);
    if (!byTeacher) {
      return err({ type: 'NOT_TEACHER' });
    }

    try {
      ChoreEntity.validateName(input.name);
      ChoreEntity.validateDescription(input.description);
    } catch (e) {
      if (e instanceof ValidationError) {
        return err({ type: 'VALIDATION_ERROR', message: e.message });
      }
      throw e;
    }

    const existing = await deps.choreRepo.findByName(input.schoolId, input.name.trim());
    if (existing) {
      return err({ type: 'DUPLICATE_NAME' });
    }

    const choreId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: input.schoolId,
      eventType: 'CHORE_DEFINED',
      entityType: 'Chore',
      entityId: choreId,
      actorId: input.createdById,
      payload: {
        choreId,
        schoolId: input.schoolId,
        name: input.name.trim(),
        description: input.description.trim(),
        size: input.size ?? 'medium',
        recurrence: input.recurrence ?? 'one_time',
        verificationType: input.verificationType ?? 'self',
        location: input.location ?? null,
        createdBy: input.createdById,
        byTeacher
      }
    });

    const chore = await deps.choreRepo.getById(choreId);
    if (!chore) {
      return err({ type: 'CHORE_NOT_FOUND_AFTER_CREATE' });
    }

    return ok({ chore });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
