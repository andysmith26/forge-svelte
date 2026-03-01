import type {
  PersonRepository,
  PersonProfile,
  UpdateProfileInput
} from '$lib/application/ports/PersonRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type UpdateProfileError =
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'NOT_FOUND'; personId: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function updateProfile(
  deps: { personRepo: PersonRepository; eventStore: EventStore },
  input: { personId: string } & UpdateProfileInput
): Promise<Result<PersonProfile, UpdateProfileError>> {
  try {
    const updateData: UpdateProfileInput = {};
    const changedFields: string[] = [];

    if (input.displayName !== undefined) {
      const displayName = input.displayName.trim();
      if (!displayName) {
        return err({ type: 'VALIDATION_ERROR', message: 'Display name is required' });
      }
      updateData.displayName = displayName;
      changedFields.push('displayName');
    }

    if (input.pronouns !== undefined) {
      const pronouns = (input.pronouns ?? '').trim();
      updateData.pronouns = pronouns || null;
      changedFields.push('pronouns');
    }

    if (input.askMeAbout !== undefined) {
      const topics = input.askMeAbout.map((v) => v.trim()).filter((v) => v.length > 0);
      if (topics.length > 5) {
        return err({
          type: 'VALIDATION_ERROR',
          message: 'You can have at most 5 "ask me about" topics'
        });
      }
      updateData.askMeAbout = topics;
      changedFields.push('askMeAbout');
    }

    if (input.themeColor !== undefined) {
      if (input.themeColor !== null && !/^#[0-9a-fA-F]{6}$/.test(input.themeColor)) {
        return err({
          type: 'VALIDATION_ERROR',
          message: 'Theme color must be a valid hex color (e.g. #4A90D9)'
        });
      }
      updateData.themeColor = input.themeColor;
      changedFields.push('themeColor');
    }

    if (input.currentlyWorkingOn !== undefined) {
      const text = (input.currentlyWorkingOn ?? '').trim();
      if (text.length > 200) {
        return err({
          type: 'VALIDATION_ERROR',
          message: '"Currently working on" must be 200 characters or less'
        });
      }
      updateData.currentlyWorkingOn = text || null;
      changedFields.push('currentlyWorkingOn');
    }

    if (input.helpQueueVisible !== undefined) {
      updateData.helpQueueVisible = input.helpQueueVisible;
      changedFields.push('helpQueueVisible');
    }

    const profile = await deps.personRepo.updateProfile(input.personId, updateData);

    if (changedFields.length > 0) {
      const person = await deps.personRepo.getById(input.personId);
      if (person) {
        await deps.eventStore.appendAndEmit({
          schoolId: person.schoolId,
          eventType: 'PROFILE_UPDATED',
          entityType: 'Person',
          entityId: input.personId,
          actorId: input.personId,
          payload: {
            personId: input.personId,
            schoolId: person.schoolId,
            changedFields
          }
        });
      }
    }

    return ok(profile);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
