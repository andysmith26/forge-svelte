import type { HelpRepository, HelpRequestRecord } from '$lib/application/ports/HelpRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import { HelpRequestEntity } from '$lib/domain/entities/help-request.entity';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import { claimHelpRequest } from './claimHelpRequest';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ResolveHelpRequestError =
  | { type: 'NOT_FOUND'; requestId: string }
  | { type: 'CANNOT_RESOLVE'; currentStatus: string }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'REQUEST_NOT_FOUND_AFTER_UPDATE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function resolveHelpRequest(
  deps: {
    helpRepo: HelpRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
  },
  input: {
    requestId: string;
    actorId: string;
    resolutionNotes?: string;
  }
): Promise<Result<HelpRequestRecord, ResolveHelpRequestError>> {
  try {
    const request = await deps.helpRepo.getRequestById(input.requestId);

    if (!request) {
      return err({ type: 'NOT_FOUND', requestId: input.requestId });
    }

    const entity = HelpRequestEntity.fromRecord(request);

    // Per story 3.7: "Resolve without claiming first → auto-claims then resolves"
    if (!entity.canResolve() && !entity.canClaim()) {
      return err({ type: 'CANNOT_RESOLVE', currentStatus: request.status });
    }

    const byTeacher = await checkIsTeacher(deps, input.actorId, request.classroomId);

    // If pending, auto-claim first
    if (request.status === 'pending') {
      const claimResult = await claimHelpRequest(deps, {
        requestId: input.requestId,
        actorId: input.actorId
      });

      if (claimResult.status === 'err') {
        return err({
          type: 'INTERNAL_ERROR',
          message: `Auto-claim failed: ${claimResult.error.type}`
        });
      }
    } else if (request.claimedById !== input.actorId && !byTeacher) {
      return err({ type: 'NOT_AUTHORIZED' });
    }

    const classroom = await deps.classroomRepo.getById(request.classroomId);
    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: request.classroomId,
      sessionId: request.sessionId,
      eventType: 'HELP_RESOLVED',
      entityType: 'HelpRequest',
      entityId: request.id,
      actorId: input.actorId,
      payload: {
        requestId: request.id,
        sessionId: request.sessionId,
        classroomId: request.classroomId,
        requesterId: request.requesterId,
        resolverId: input.actorId,
        resolutionNotes: input.resolutionNotes ?? null,
        byTeacher
      }
    });

    const updated = await deps.helpRepo.getRequestById(input.requestId);
    if (!updated) {
      return err({ type: 'REQUEST_NOT_FOUND_AFTER_UPDATE' });
    }

    return ok(updated);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
