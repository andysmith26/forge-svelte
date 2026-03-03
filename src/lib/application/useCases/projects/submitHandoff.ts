import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { HandoffEntity } from '$lib/domain/entities/handoff.entity';
import { ValidationError } from '$lib/domain/errors';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type SubmitHandoffError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'NOT_AUTHORIZED' }
  | { type: 'PROJECT_ARCHIVED' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'INVALID_SUBSYSTEM'; subsystemId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function submitHandoff(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    projectId: string;
    authorId: string;
    sessionId?: string | null;
    whatIDid: string;
    whatsNext?: string | null;
    blockers?: string | null;
    questions?: string | null;
    subsystemIds?: string[];
  }
): Promise<Result<{ handoffId: string }, SubmitHandoffError>> {
  try {
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });
    if (project.isArchived) return err({ type: 'PROJECT_ARCHIVED' });

    const isTeacher = await checkIsSchoolTeacher(deps, input.authorId, project.schoolId);
    const isMember = !!(await deps.projectRepo.getActiveMembership(
      input.projectId,
      input.authorId
    ));

    if (!isTeacher && !isMember) {
      return err({ type: 'NOT_AUTHORIZED' });
    }

    // Validate handoff fields via domain entity
    try {
      HandoffEntity.validateWhatIDid(input.whatIDid);
      if (input.whatsNext) HandoffEntity.validateWhatsNext(input.whatsNext);
      if (input.blockers) HandoffEntity.validateBlockers(input.blockers);
      if (input.questions) HandoffEntity.validateQuestions(input.questions);
    } catch (e) {
      if (e instanceof ValidationError) {
        return err({ type: 'VALIDATION_ERROR', message: e.message });
      }
      throw e;
    }

    // Validate subsystem IDs belong to this project
    const subsystemIds = input.subsystemIds ?? [];
    for (const sid of subsystemIds) {
      const sub = await deps.projectRepo.getSubsystemById(sid);
      if (!sub || sub.projectId !== input.projectId) {
        return err({ type: 'INVALID_SUBSYSTEM', subsystemId: sid });
      }
    }

    const handoffId = deps.idGenerator.generate();

    await deps.eventStore.appendAndEmit({
      schoolId: project.schoolId,
      sessionId: input.sessionId ?? undefined,
      eventType: 'HANDOFF_SUBMITTED',
      entityType: 'Handoff',
      entityId: handoffId,
      actorId: input.authorId,
      payload: {
        handoffId,
        projectId: input.projectId,
        schoolId: project.schoolId,
        sessionId: input.sessionId ?? null,
        authorId: input.authorId,
        whatIDid: input.whatIDid.trim(),
        whatsNext: input.whatsNext?.trim() || null,
        blockers: input.blockers?.trim() || null,
        questions: input.questions?.trim() || null,
        subsystemIds,
        byTeacher: isTeacher
      }
    });

    // Auto-update read status for author
    await deps.projectRepo.upsertReadStatus(input.projectId, input.authorId, new Date());

    return ok({ handoffId });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
