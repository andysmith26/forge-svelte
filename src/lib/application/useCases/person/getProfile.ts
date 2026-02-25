import type { PersonRepository, PersonProfile } from '$lib/application/ports/PersonRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetProfileError =
  | { type: 'NOT_FOUND'; personId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function getProfile(
  deps: { personRepo: PersonRepository },
  input: { personId: string }
): Promise<Result<PersonProfile, GetProfileError>> {
  try {
    const profile = await deps.personRepo.getProfile(input.personId);

    if (!profile) {
      return err({ type: 'NOT_FOUND', personId: input.personId });
    }

    return ok(profile);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
