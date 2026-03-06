import type { ChoreRepository } from '$lib/application/ports/ChoreRepository';
import type { PersonRepository } from '$lib/application/ports/PersonRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ClaimChoreError =
  | { type: 'NOT_SCHOOL_MEMBER' }
  | { type: 'INSTANCE_NOT_FOUND' }
  | { type: 'NOT_AVAILABLE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function claimChore(
  deps: {
    choreRepo: ChoreRepository;
    personRepo: PersonRepository;
    eventStore: EventStore;
  },
  input: {
    instanceId: string;
    actorId: string;
    schoolId: string;
  }
): Promise<Result<void, ClaimChoreError>> {
  try {
    const person = await deps.personRepo.getById(input.actorId);
    if (!person || person.schoolId !== input.schoolId) {
      return err({ type: 'NOT_SCHOOL_MEMBER' });
    }

    const instance = await deps.choreRepo.getInstanceById(input.instanceId);
    if (!instance) {
      return err({ type: 'INSTANCE_NOT_FOUND' });
    }

    if (instance.status !== 'available') {
      return err({ type: 'NOT_AVAILABLE' });
    }

    await deps.eventStore.appendAndEmit({
      schoolId: input.schoolId,
      eventType: 'CHORE_CLAIMED',
      entityType: 'ChoreInstance',
      entityId: input.instanceId,
      actorId: input.actorId,
      payload: {
        instanceId: input.instanceId,
        choreId: instance.choreId,
        schoolId: input.schoolId,
        claimedBy: input.actorId
      }
    });

    return ok(undefined);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
