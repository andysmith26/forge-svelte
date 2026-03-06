import type {
  ChoreRepository,
  ChoreInstanceWithRelations
} from '$lib/application/ports/ChoreRepository';
import type { PersonRepository } from '$lib/application/ports/PersonRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListAvailableChoresResult = {
  available: ChoreInstanceWithRelations[];
  myChores: ChoreInstanceWithRelations[];
};

export type ListAvailableChoresError =
  | { type: 'NOT_SCHOOL_MEMBER' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function listAvailableChores(
  deps: {
    choreRepo: ChoreRepository;
    personRepo: PersonRepository;
  },
  input: {
    schoolId: string;
    actorId: string;
  }
): Promise<Result<ListAvailableChoresResult, ListAvailableChoresError>> {
  try {
    const person = await deps.personRepo.getById(input.actorId);
    if (!person || person.schoolId !== input.schoolId) {
      return err({ type: 'NOT_SCHOOL_MEMBER' });
    }

    const [available, myChores] = await Promise.all([
      deps.choreRepo.listAvailableInstances(input.schoolId),
      deps.choreRepo.listClaimedByPerson(input.schoolId, input.actorId)
    ]);

    return ok({ available, myChores });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
