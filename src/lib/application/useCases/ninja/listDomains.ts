import type { NinjaRepository, NinjaDomainRecord } from '$lib/application/ports/NinjaRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type ListDomainsError = { type: 'INTERNAL_ERROR'; message: string };

export async function listDomains(
  deps: { ninjaRepo: NinjaRepository },
  input: { classroomId: string }
): Promise<Result<NinjaDomainRecord[], ListDomainsError>> {
  try {
    const domains = await deps.ninjaRepo.listDomains(input.classroomId);
    return ok(domains);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
