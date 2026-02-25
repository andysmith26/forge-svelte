import type {
  NinjaRepository,
  NinjaAssignmentWithRelations
} from '$lib/application/ports/NinjaRepository';
import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import type { PresenceRepository } from '$lib/application/ports/PresenceRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetNinjaPresenceError = { type: 'INTERNAL_ERROR'; message: string };

export async function getNinjaPresence(
  deps: {
    ninjaRepo: NinjaRepository;
    sessionRepo: SessionRepository;
    presenceRepo: PresenceRepository;
  },
  input: { sessionId: string }
): Promise<Result<NinjaAssignmentWithRelations[], GetNinjaPresenceError>> {
  try {
    const presentPeople = await deps.presenceRepo.listPresentPeople(input.sessionId);

    if (presentPeople.length === 0) {
      return ok([]);
    }

    const session = await deps.sessionRepo.getById(input.sessionId);

    if (!session) {
      return ok([]);
    }

    const personIds = presentPeople.map((person) => person.id);

    const assignments = await deps.ninjaRepo.listAssignmentsForPeople(
      session.classroomId,
      personIds
    );

    return ok(assignments);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
