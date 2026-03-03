import type {
  ClassroomRepository,
  ClassroomMembership
} from '$lib/application/ports/ClassroomRepository';
import type { PresenceRepository, SignInRecord } from '$lib/application/ports/PresenceRepository';
import type { Result } from '$lib/types/result';
import { ok, err } from '$lib/types/result';
import { Role } from '$lib/domain/types/roles';

export type AuthorizationError =
  | { type: 'NOT_AUTHENTICATED' }
  | { type: 'NOT_MEMBER'; classroomId: string }
  | { type: 'NOT_TEACHER'; classroomId: string }
  | { type: 'NOT_SCHOOL_TEACHER'; schoolId: string }
  | { type: 'NOT_SIGNED_IN'; sessionId: string };

export async function requireMember(
  deps: { classroomRepo: ClassroomRepository },
  personId: string,
  classroomId: string
): Promise<Result<ClassroomMembership, AuthorizationError>> {
  if (!personId) {
    return err({ type: 'NOT_AUTHENTICATED' });
  }

  const membership = await deps.classroomRepo.getMembership(personId, classroomId);

  if (!membership) {
    return err({ type: 'NOT_MEMBER', classroomId });
  }

  return ok(membership);
}

export async function requireTeacher(
  deps: { classroomRepo: ClassroomRepository },
  personId: string,
  classroomId: string
): Promise<Result<ClassroomMembership, AuthorizationError>> {
  if (!personId) {
    return err({ type: 'NOT_AUTHENTICATED' });
  }

  const membership = await deps.classroomRepo.getMembership(personId, classroomId);

  if (!membership) {
    return err({ type: 'NOT_MEMBER', classroomId });
  }

  if (membership.role !== Role.Teacher) {
    return err({ type: 'NOT_TEACHER', classroomId });
  }

  return ok(membership);
}

export async function requireSignedIn(
  deps: { presenceRepo: PresenceRepository },
  personId: string,
  sessionId: string
): Promise<Result<SignInRecord, AuthorizationError>> {
  if (!personId) {
    return err({ type: 'NOT_AUTHENTICATED' });
  }

  const signIn = await deps.presenceRepo.getActiveSignIn(sessionId, personId);

  if (!signIn) {
    return err({ type: 'NOT_SIGNED_IN', sessionId });
  }

  return ok(signIn);
}

export function isTeacher(membership: ClassroomMembership): boolean {
  return membership.role === Role.Teacher;
}

export async function checkIsTeacher(
  deps: { classroomRepo: ClassroomRepository },
  personId: string,
  classroomId: string
): Promise<boolean> {
  const result = await requireTeacher(deps, personId, classroomId);
  return result.status === 'ok';
}

export async function checkIsSchoolTeacher(
  deps: { classroomRepo: ClassroomRepository },
  personId: string,
  schoolId: string
): Promise<boolean> {
  const memberships = await deps.classroomRepo.listMembershipsForPerson(personId);
  return memberships.some(
    (m) => m.classroom.schoolId === schoolId && m.role === Role.Teacher && m.isActive
  );
}

export async function requireSchoolTeacher(
  deps: { classroomRepo: ClassroomRepository },
  personId: string,
  schoolId: string
): Promise<Result<ClassroomMembership, AuthorizationError>> {
  if (!personId) {
    return err({ type: 'NOT_AUTHENTICATED' });
  }

  const memberships = await deps.classroomRepo.listMembershipsForPerson(personId);
  const teacherMembership = memberships.find(
    (m) => m.classroom.schoolId === schoolId && m.role === Role.Teacher && m.isActive
  );

  if (!teacherMembership) {
    return err({ type: 'NOT_SCHOOL_TEACHER', schoolId });
  }

  return ok(teacherMembership);
}
