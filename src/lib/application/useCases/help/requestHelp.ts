import type { HelpRepository, HelpRequestRecord } from '$lib/application/ports/HelpRepository';
import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import type { HelpUrgency } from '$lib/domain/types/help-urgency';
import { SessionEntity } from '$lib/domain/entities/session.entity';
import { HelpRequestEntity } from '$lib/domain/entities/help-request.entity';
import { ValidationError } from '$lib/domain/errors';
import { checkIsTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type RequestHelpResult = {
  helpRequest: HelpRequestRecord;
  queuePosition: number;
};

export type RequestHelpError =
  | { type: 'SESSION_NOT_FOUND' }
  | { type: 'SESSION_NOT_ACTIVE' }
  | { type: 'WRONG_CLASSROOM' }
  | { type: 'ALREADY_HAS_OPEN_REQUEST' }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'REQUEST_NOT_FOUND_AFTER_CREATE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function requestHelp(
  deps: {
    helpRepo: HelpRepository;
    sessionRepo: SessionRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    sessionId: string;
    requesterId: string;
    categoryId?: string | null;
    description: string;
    whatITried: string;
    urgency: HelpUrgency;
    pinClassroomId?: string | null;
  }
): Promise<Result<RequestHelpResult, RequestHelpError>> {
  try {
    const session = await deps.sessionRepo.getById(input.sessionId);

    if (!session) {
      return err({ type: 'SESSION_NOT_FOUND' });
    }

    const sessionEntity = SessionEntity.fromRecord(session);
    if (!sessionEntity.isActive()) {
      return err({ type: 'SESSION_NOT_ACTIVE' });
    }

    if (input.pinClassroomId && input.pinClassroomId !== session.classroomId) {
      return err({ type: 'WRONG_CLASSROOM' });
    }

    const existingOpen = await deps.helpRepo.findOpenRequest(input.sessionId, input.requesterId);

    if (existingOpen) {
      return err({ type: 'ALREADY_HAS_OPEN_REQUEST' });
    }

    const classroom = await deps.classroomRepo.getById(session.classroomId);
    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    try {
      HelpRequestEntity.validateDescription(input.description);
      HelpRequestEntity.validateWhatITried(input.whatITried);
    } catch (e) {
      if (e instanceof ValidationError) {
        return err({ type: 'VALIDATION_ERROR', message: e.message });
      }
      throw e;
    }

    const byTeacher = await checkIsTeacher(deps, input.requesterId, session.classroomId);
    const requestId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: classroom.schoolId,
      classroomId: session.classroomId,
      sessionId: session.id,
      eventType: 'HELP_REQUESTED',
      entityType: 'HelpRequest',
      entityId: requestId,
      actorId: input.requesterId,
      payload: {
        requestId,
        sessionId: session.id,
        classroomId: session.classroomId,
        requesterId: input.requesterId,
        urgency: input.urgency,
        categoryId: input.categoryId ?? null,
        description: input.description,
        whatITried: input.whatITried,
        byTeacher
      }
    });

    const helpRequest = await deps.helpRepo.getRequestById(requestId);
    if (!helpRequest) {
      return err({ type: 'REQUEST_NOT_FOUND_AFTER_CREATE' });
    }

    const queuePosition = await deps.helpRepo.countPendingBefore(
      session.classroomId,
      helpRequest.createdAt
    );

    return ok({ helpRequest, queuePosition });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
