import type { PersonRepository, PersonRecord } from '$lib/application/ports/PersonRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import { Role } from '$lib/domain/types/roles';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type AddStudentError =
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'VALIDATION_ERROR'; message: string }
  | { type: 'ALREADY_IN_CLASSROOM'; email: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function addStudent(
  deps: {
    personRepo: PersonRepository;
    classroomRepo: ClassroomRepository;
  },
  input: {
    classroomId: string;
    name: string;
    email: string;
    gradeLevel?: string | null;
  }
): Promise<Result<PersonRecord, AddStudentError>> {
  try {
    const classroom = await deps.classroomRepo.getById(input.classroomId);

    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name) {
      return err({ type: 'VALIDATION_ERROR', message: 'Name is required' });
    }

    if (!email) {
      return err({ type: 'VALIDATION_ERROR', message: 'Email is required' });
    }

    const existingPerson = await deps.personRepo.findByEmail(email);

    if (existingPerson) {
      const membership = await deps.personRepo.getMembership(existingPerson.id, input.classroomId, {
        includeInactive: true
      });

      if (membership) {
        if (membership.isActive) {
          return err({ type: 'ALREADY_IN_CLASSROOM', email });
        }

        await deps.personRepo.updateMembership(membership.id, {
          isActive: true,
          leftAt: null
        });
        return ok(existingPerson);
      }

      await deps.personRepo.createMembership({
        classroomId: input.classroomId,
        personId: existingPerson.id,
        role: Role.Student
      });

      return ok(existingPerson);
    }

    const person = await deps.personRepo.createPerson({
      schoolId: classroom.schoolId,
      email,
      legalName: name,
      displayName: name,
      gradeLevel: input.gradeLevel?.trim() || null
    });

    await deps.personRepo.createMembership({
      classroomId: input.classroomId,
      personId: person.id,
      role: Role.Student
    });

    return ok(person);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
