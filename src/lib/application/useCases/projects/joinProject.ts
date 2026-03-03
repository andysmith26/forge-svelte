import type { ProjectRepository } from '$lib/application/ports/ProjectRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { PersonRepository } from '$lib/application/ports/PersonRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';
import { checkIsSchoolTeacher } from '$lib/application/useCases/checkAuthorization';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type JoinProjectError =
  | { type: 'PROJECT_NOT_FOUND' }
  | { type: 'NOT_SCHOOL_MEMBER' }
  | { type: 'ALREADY_ACTIVE_MEMBER' }
  | { type: 'PROJECT_ARCHIVED' }
  | { type: 'NOT_BROWSEABLE' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function joinProject(
  deps: {
    projectRepo: ProjectRepository;
    classroomRepo: ClassroomRepository;
    personRepo: PersonRepository;
    eventStore: EventStore;
    idGenerator: IdGenerator;
  },
  input: {
    projectId: string;
    actorId: string;
  }
): Promise<Result<void, JoinProjectError>> {
  try {
    const project = await deps.projectRepo.getById(input.projectId);
    if (!project) return err({ type: 'PROJECT_NOT_FOUND' });
    if (project.isArchived) return err({ type: 'PROJECT_ARCHIVED' });

    const person = await deps.personRepo.getById(input.actorId);
    if (!person || person.schoolId !== project.schoolId) {
      return err({ type: 'NOT_SCHOOL_MEMBER' });
    }

    // Self-join is only allowed for browseable projects (teachers can always join)
    const isTeacher = await checkIsSchoolTeacher(deps, input.actorId, project.schoolId);
    if (!isTeacher && project.visibility !== 'browseable') {
      return err({ type: 'NOT_BROWSEABLE' });
    }

    const existing = await deps.projectRepo.getActiveMembership(input.projectId, input.actorId);
    if (existing) {
      return err({ type: 'ALREADY_ACTIVE_MEMBER' });
    }

    const membershipId = deps.idGenerator.generate();
    const byTeacher = isTeacher;

    await deps.eventStore.appendAndEmit({
      schoolId: project.schoolId,
      eventType: 'PROJECT_MEMBER_ADDED',
      entityType: 'ProjectMembership',
      entityId: membershipId,
      actorId: input.actorId,
      payload: {
        projectId: input.projectId,
        schoolId: project.schoolId,
        personId: input.actorId,
        addedBy: input.actorId,
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
