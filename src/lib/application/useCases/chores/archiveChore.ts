import type { ChoreRepository } from '$lib/application/ports/ChoreRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ArchiveChoreError =
  | { type: 'NOT_TEACHER' }
  | { type: 'CHORE_NOT_FOUND' }
  | { type: 'ALREADY_ARCHIVED' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function archiveChore(
  deps: {
    choreRepo: ChoreRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
  },
  input: {
    choreId: string;
    actorId: string;
  }
): Promise<Result<void, ArchiveChoreError>> {
  try {
    const chore = await deps.choreRepo.getById(input.choreId);
    if (!chore) {
      return err({ type: 'CHORE_NOT_FOUND' });
    }

    if (!chore.isActive) {
      return err({ type: 'ALREADY_ARCHIVED' });
    }

    const byTeacher = await checkIsSchoolTeacher(deps, input.actorId, chore.schoolId);
    if (!byTeacher) {
      return err({ type: 'NOT_TEACHER' });
    }

    await deps.eventStore.appendAndEmit({
      schoolId: chore.schoolId,
      eventType: 'CHORE_ARCHIVED',
      entityType: 'Chore',
      entityId: input.choreId,
      actorId: input.actorId,
      payload: {
        choreId: input.choreId,
        schoolId: chore.schoolId,
        archivedBy: input.actorId,
        byTeacher
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
