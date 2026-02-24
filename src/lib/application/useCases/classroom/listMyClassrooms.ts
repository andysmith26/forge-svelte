import type { ClassroomRepository, ClassroomMembershipWithClassroom } from '$lib/application/ports/ClassroomRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';

export interface ListMyClassroomsInput {
  personId: string;
}

export type ListMyClassroomsError = { type: 'INTERNAL_ERROR'; message: string };

export async function listMyClassrooms(
  deps: {
    classroomRepo: ClassroomRepository;
  },
  input: ListMyClassroomsInput
): Promise<Result<ClassroomMembershipWithClassroom[], ListMyClassroomsError>> {
  try {
    const memberships = await deps.classroomRepo.listMembershipsForPerson(input.personId);
    return ok(memberships);
  } catch (e) {
    return err({
      type: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}
