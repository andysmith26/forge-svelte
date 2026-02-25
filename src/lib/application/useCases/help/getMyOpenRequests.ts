import type {
  HelpRepository,
  HelpRequestWithRelations
} from '$lib/application/ports/HelpRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetMyOpenRequestsError = { type: 'INTERNAL_ERROR'; message: string };

export async function getMyOpenRequests(
  deps: { helpRepo: HelpRepository },
  input: { sessionId: string; personId: string }
): Promise<Result<HelpRequestWithRelations[], GetMyOpenRequestsError>> {
  try {
    const requests = await deps.helpRepo.listOpenRequests(input.sessionId, input.personId);
    return ok(requests);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
