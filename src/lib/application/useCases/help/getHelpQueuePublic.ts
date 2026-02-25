import type { HelpRepository, HelpQueueItem } from '$lib/application/ports/HelpRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type GetHelpQueuePublicError = { type: 'INTERNAL_ERROR'; message: string };

export async function getHelpQueuePublic(
  deps: { helpRepo: HelpRepository },
  input: { sessionId: string }
): Promise<Result<HelpQueueItem[], GetHelpQueuePublicError>> {
  try {
    const queue = await deps.helpRepo.listQueue(input.sessionId);
    return ok(queue);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
