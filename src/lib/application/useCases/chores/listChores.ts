import type { ChoreRepository, ChoreListItem } from '$lib/application/ports/ChoreRepository';
import type { PersonRepository } from '$lib/application/ports/PersonRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListChoresResult = {
  chores: ChoreListItem[];
};

export type ListChoresError =
  | { type: 'NOT_SCHOOL_MEMBER' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function listChores(
  deps: {
    choreRepo: ChoreRepository;
    personRepo: PersonRepository;
  },
  input: {
    schoolId: string;
    actorId: string;
    includeArchived?: boolean;
  }
): Promise<Result<ListChoresResult, ListChoresError>> {
  try {
    const person = await deps.personRepo.getById(input.actorId);
    if (!person || person.schoolId !== input.schoolId) {
      return err({ type: 'NOT_SCHOOL_MEMBER' });
    }

    const chores = await deps.choreRepo.listBySchool(input.schoolId, input.includeArchived);
    return ok({ chores });
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
