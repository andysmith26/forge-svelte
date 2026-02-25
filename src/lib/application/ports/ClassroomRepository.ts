import type { Role } from '$lib/domain/types/roles';

export type ClassroomRecord = {
  id: string;
  schoolId: string;
  name: string;
  slug: string;
  description: string | null;
  displayCode: string;
  settings: unknown;
  isActive: boolean;
};

export type ClassroomMembership = {
  id: string;
  classroomId: string;
  personId: string;
  role: Role;
  isActive: boolean;
  joinedAt: Date;
  leftAt: Date | null;
};

export type ClassroomMembershipWithClassroom = ClassroomMembership & {
  classroom: ClassroomRecord;
};

export type ClassroomMemberProfile = {
  id: string;
  displayName: string;
  pronouns: string | null;
  gradeLevel: string | null;
  role: Role;
};

export interface ClassroomRepository {
  getById(id: string): Promise<ClassroomRecord | null>;
  getByDisplayCode(code: string): Promise<ClassroomRecord | null>;
  listMembershipsForPerson(personId: string): Promise<ClassroomMembershipWithClassroom[]>;
  listMembers(classroomId: string): Promise<ClassroomMemberProfile[]>;
  getMembership(personId: string, classroomId: string): Promise<ClassroomMembership | null>;
  updateSettings(classroomId: string, settings: unknown): Promise<void>;
}
