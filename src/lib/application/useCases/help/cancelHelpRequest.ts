import type { HelpRepository, HelpRequestRecord } from '$lib/application/ports/HelpRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import { HelpRequestEntity } from '$lib/domain/entities/help-request.entity';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type CancelHelpRequestError =
  | { type: 'NOT_FOUND'; requestId: string }
  | { type: 'CANNOT_CANCEL'; currentStatus: string }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'REQUEST_NOT_FOUND_AFTER_UPDATE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function cancelHelpRequest(
  deps: {
    helpRepo: HelpRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
  },
  input: {
    requestId: string;
    actorId: string;
    reason?: string;
  }
): Promise<Result<HelpRequestRecord, CancelHelpRequestError>> {
  try {
    const request = await deps.helpRepo.getRequestById(input.requestId);

    if (!request) {
      return err({ type: 'NOT_FOUND', requestId: input.requestId });
    }

    const entity = HelpRequestEntity.fromRecord(request);
    if (!entity.canCancel()) {
      return err({ type: 'CANNOT_CANCEL', currentStatus: request.status });
    }

    const classroom = await deps.classroomRepo.getById(request.classroomId);
    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    const byTeacher = await checkIsTeacher(deps, input.actorId, request.classroomId);

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: request.classroomId,
      sessionId: request.sessionId,
      eventType: 'HELP_CANCELLED',
      entityType: 'HelpRequest',
      entityId: request.id,
      actorId: input.actorId,
      payload: {
        requestId: request.id,
        sessionId: request.sessionId,
        classroomId: request.classroomId,
        requesterId: request.requesterId,
        cancelledBy: input.actorId,
        reason: input.reason ?? null,
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
