import type { PersonRepository } from '$lib/application/ports/PersonRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import { Role } from '$lib/domain/types/roles';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export type StudentImportRow = {
  name: string;
  email: string;
  gradeLevel?: string | null;
};

export type ImportError = {
  row: number;
  name: string;
  email: string;
  reason: string;
};

export type ImportResult = {
  success: number;
  errors: ImportError[];
};

export type BulkImportStudentsError =
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function bulkImportStudents(
  deps: {
    personRepo: PersonRepository;
    classroomRepo: ClassroomRepository;
  },
  input: {
    classroomId: string;
    students: StudentImportRow[];
  }
): Promise<Result<ImportResult, BulkImportStudentsError>> {
  try {
    const classroom = await deps.classroomRepo.getById(input.classroomId);

    if (!classroom) {
      return err({ type: 'CLASSROOM_NOT_FOUND' });
    }

    const results: ImportResult = { success: 0, errors: [] };

    for (let index = 0; index < input.students.length; index += 1) {
      const student = input.students[index];
      const rowNum = index + 1;
      const name = student.name?.trim() ?? '';
      const emailInput = student.email?.trim() ?? '';

      if (!name) {
        results.errors.push({
          row: rowNum,
          name: student.name || '',
          email: student.email || '',
          reason: 'Name is required'
        });
        continue;
      }

      if (!emailInput) {
        results.errors.push({ row: rowNum, name, email: '', reason: 'Email is required' });
        continue;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput)) {
        results.errors.push({
          row: rowNum,
          name,
          email: emailInput,
          reason: 'Invalid email format'
        });
        continue;
      }

      const email = emailInput.toLowerCase();

      try {
        const existingPerson = await deps.personRepo.findByEmail(email);

        if (existingPerson) {
          const membership = await deps.personRepo.getMembership(
            existingPerson.id,
            input.classroomId,
            { includeInactive: true }
          );

          if (membership?.isActive) {
            results.errors.push({
              row: rowNum,
              name,
              email: emailInput,
              reason: 'Student already in classroom'
            });
            continue;
          }

          if (membership) {
            await deps.personRepo.updateMembership(membership.id, { isActive: true, leftAt: null });
          } else {
            await deps.personRepo.createMembership({
              classroomId: input.classroomId,
              personId: existingPerson.id,
              role: Role.Student
            });
          }

          results.success += 1;
          continue;
        }

        const person = await deps.personRepo.createPerson({
          schoolId: classroom.schoolId,
          email,
          legalName: name,
          displayName: name,
          gradeLevel: student.gradeLevel?.trim() || null
        });

        await deps.personRepo.createMembership({
          classroomId: input.classroomId,
          personId: person.id,
          role: Role.Student
        });

        results.success += 1;
      } catch {
        results.errors.push({ row: rowNum, name, email: emailInput, reason: 'Database error' });
      }
    }

    return ok(results);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
