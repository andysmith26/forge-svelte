import type { ChoreRepository } from '$lib/application/ports/ChoreRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type CompleteChoreError =
  | { type: 'INSTANCE_NOT_FOUND' }
  | { type: 'NOT_CLAIMED_BY_ACTOR' }
  | { type: 'INVALID_STATUS' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function completeChore(
  deps: {
    choreRepo: ChoreRepository;
    eventStore: EventStore;
  },
  input: {
    instanceId: string;
    actorId: string;
    schoolId: string;
    completionNotes?: string | null;
  }
): Promise<Result<void, CompleteChoreError>> {
  try {
    const instance = await deps.choreRepo.getInstanceWithRelations(input.instanceId);
    if (!instance) {
      return err({ type: 'INSTANCE_NOT_FOUND' });
    }

    if (instance.status !== 'claimed' && instance.status !== 'redo_requested') {
      return err({ type: 'INVALID_STATUS' });
    }

    if (instance.claimedById !== input.actorId) {
      return err({ type: 'NOT_CLAIMED_BY_ACTOR' });
    }

    await deps.eventStore.appendAndEmit({
      schoolId: input.schoolId,
      eventType: 'CHORE_COMPLETED',
      entityType: 'ChoreInstance',
      entityId: input.instanceId,
      actorId: input.actorId,
      payload: {
        instanceId: input.instanceId,
        choreId: instance.choreId,
        schoolId: input.schoolId,
        completedBy: input.actorId,
        completionNotes: input.completionNotes ?? null
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
