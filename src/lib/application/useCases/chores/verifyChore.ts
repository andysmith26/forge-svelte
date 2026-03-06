import type { ChoreRepository } from '$lib/application/ports/ChoreRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type VerifyChoreError =
  | { type: 'INSTANCE_NOT_FOUND' }
  | { type: 'INVALID_STATUS' }
  | { type: 'CANNOT_VERIFY_OWN' }
  | { type: 'INVALID_DECISION' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function verifyChore(
  deps: {
    choreRepo: ChoreRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    instanceId: string;
    verifierId: string;
    schoolId: string;
    decision: 'approved' | 'redo_requested';
    feedback?: string | null;
  }
): Promise<Result<void, VerifyChoreError>> {
  try {
    const instance = await deps.choreRepo.getInstanceWithRelations(input.instanceId);
    if (!instance) {
      return err({ type: 'INSTANCE_NOT_FOUND' });
    }

    if (instance.status !== 'completed') {
      return err({ type: 'INVALID_STATUS' });
    }

    if (instance.claimedById === input.verifierId) {
      return err({ type: 'CANNOT_VERIFY_OWN' });
    }

    if (input.decision !== 'approved' && input.decision !== 'redo_requested') {
      return err({ type: 'INVALID_DECISION' });
    }

    const byTeacher = await checkIsSchoolTeacher(deps, input.verifierId, input.schoolId);
    const verificationId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: input.schoolId,
      eventType: 'CHORE_VERIFIED',
      entityType: 'ChoreVerification',
      entityId: verificationId,
      actorId: input.verifierId,
      payload: {
        verificationId,
        instanceId: input.instanceId,
        choreId: instance.choreId,
        schoolId: input.schoolId,
        verifierId: input.verifierId,
        decision: input.decision,
        feedback: input.feedback ?? null,
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
