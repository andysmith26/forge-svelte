import type { PresenceRepository, PersonPresence } from '$lib/application/ports/PresenceRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListPresentError = { type: 'INTERNAL_ERROR'; message: string };

export async function listPresent(
  deps: { presenceRepo: PresenceRepository },
  input: { sessionId: string }
): Promise<Result<PersonPresence[], ListPresentError>> {
  try {
    const presentPeople = await deps.presenceRepo.listPresentPeople(input.sessionId);
    return ok(presentPeople);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
