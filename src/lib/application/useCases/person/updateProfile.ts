import type {
  PersonRepository,
  PersonProfile,
  UpdateProfileInput
} from '$lib/application/ports/PersonRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type UpdateProfileError =
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function updateProfile(
  deps: { personRepo: PersonRepository },
  input: { personId: string } & UpdateProfileInput
): Promise<Result<PersonProfile, UpdateProfileError>> {
  try {
    const updateData: UpdateProfileInput = {};

    if (input.displayName !== undefined) {
      const displayName = input.displayName.trim();
      if (!displayName) {
        return err({ type: 'VALIDATION_ERROR', message: 'Display name is required' });
      }
      updateData.displayName = displayName;
    }

    if (input.pronouns !== undefined) {
      const pronouns = (input.pronouns ?? '').trim();
      updateData.pronouns = pronouns || null;
    }

    if (input.askMeAbout !== undefined) {
      updateData.askMeAbout = input.askMeAbout.map((v) => v.trim()).filter((v) => v.length > 0);
    }

    const profile = await deps.personRepo.updateProfile(input.personId, updateData);
    return ok(profile);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
