import type { Role } from '$lib/domain/types/roles';
import type { ClassroomMembership } from './ClassroomRepository';

export type PersonRecord = {
  id: string;
  schoolId: string;
  email: string | null;
  legalName: string;
  displayName: string;
  pronouns: string | null;
  gradeLevel: string | null;
  askMeAbout: string[];
  isActive: boolean;
};

export type PersonProfile = {
  id: string;
  displayName: string;
  legalName: string;
  pronouns: string | null;
  askMeAbout: string[];
  email: string | null;
};

export type CreatePersonInput = {
  schoolId: string;
  email?: string | null;
  legalName: string;
  displayName: string;
  gradeLevel?: string | null;
};

export type UpdatePersonInput = {
  email?: string | null;
  legalName?: string;
  displayName?: string;
  pronouns?: string | null;
  gradeLevel?: string | null;
  askMeAbout?: string[];
};

export type UpdateProfileInput = {
  displayName?: string;
  pronouns?: string | null;
  askMeAbout?: string[];
};

export type StudentSummary = {
  id: string;
  displayName: string;
  email: string | null;
  gradeLevel: string | null;
  createdAt: Date;
};

export type CreateMembershipInput = {
  classroomId: string;
  personId: string;
  role: Role;
};

export type UpdateMembershipInput = {
  role?: Role;
  isActive?: boolean;
  leftAt?: Date | null;
};

export interface PersonRepository {
  getById(id: string): Promise<PersonRecord | null>;
  getProfile(id: string): Promise<PersonProfile | null>;
  updateProfile(id: string, input: UpdateProfileInput): Promise<PersonProfile>;
  findByEmail(email: string): Promise<PersonRecord | null>;
  createPerson(input: CreatePersonInput): Promise<PersonRecord>;
  updatePerson(id: string, input: UpdatePersonInput): Promise<PersonRecord>;
  listStudents(classroomId: string): Promise<StudentSummary[]>;
  getMembership(
    personId: string,
    classroomId: string,
    options?: { includeInactive?: boolean }
  ): Promise<ClassroomMembership | null>;
  createMembership(input: CreateMembershipInput): Promise<ClassroomMembership>;
  updateMembership(id: string, input: UpdateMembershipInput): Promise<ClassroomMembership>;
}
