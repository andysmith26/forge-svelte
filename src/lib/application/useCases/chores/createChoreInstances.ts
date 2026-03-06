import type { ChoreRepository } from '$lib/application/ports/ChoreRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type CreateChoreInstancesResult = {
  instanceIds: string[];
};

export type CreateChoreInstancesError =
  | { type: 'NOT_TEACHER' }
  | { type: 'CHORE_NOT_FOUND' }
  | { type: 'CHORE_ARCHIVED' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function createChoreInstances(
  deps: {
    choreRepo: ChoreRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    choreId: string;
    actorId: string;
    count?: number;
    dueDate?: string | null;
  }
): Promise<Result<CreateChoreInstancesResult, CreateChoreInstancesError>> {
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

    const count = input.count ?? 1;
    const instanceIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const instanceId = deps.idGenerator.generate();
      instanceIds.push(instanceId);

      await deps.eventStore.appendAndEmit({
        schoolId: chore.schoolId,
        eventType: 'CHORE_INSTANCE_CREATED',
        entityType: 'ChoreInstance',
        entityId: instanceId,
        actorId: input.actorId,
        payload: {
          instanceId,
          choreId: input.choreId,
          schoolId: chore.schoolId,
          dueDate: input.dueDate ?? null
        }
      });
    }

    return ok({ instanceIds });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
