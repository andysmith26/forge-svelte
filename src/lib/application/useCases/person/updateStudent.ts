import type { PersonRepository, PersonRecord } from '$lib/application/ports/PersonRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type UpdateStudentError =
  | { type: 'NOT_FOUND' }
  | { type: 'EMAIL_IN_USE'; email: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function updateStudent(
  deps: { personRepo: PersonRepository },
  input: {
    classroomId: string;
    personId: string;
    name?: string;
    email?: string;
    gradeLevel?: string;
  }
): Promise<Result<PersonRecord, UpdateStudentError>> {
  try {
    const membership = await deps.personRepo.getMembership(input.personId, input.classroomId);

    if (!membership) {
      return err({ type: 'NOT_FOUND' });
    }

    if (input.email) {
      const existingPerson = await deps.personRepo.findByEmail(input.email.toLowerCase());

      if (existingPerson && existingPerson.id !== input.personId) {
        return err({ type: 'EMAIL_IN_USE', email: input.email });
      }
    }

    const updateData: {
      email?: string | null;
      legalName?: string;
      displayName?: string;
      gradeLevel?: string | null;
    } = {};

    if (input.email) {
      updateData.email = input.email.toLowerCase();
    }

    if (input.name) {
      updateData.legalName = input.name;
      updateData.displayName = input.name;
    }

    if (input.gradeLevel !== undefined) {
      updateData.gradeLevel = input.gradeLevel;
    }

    const person = await deps.personRepo.updatePerson(input.personId, updateData);
    return ok(person);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
