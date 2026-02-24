/**
 * Stub — will be fully defined when porting the application layer (Phase 3).
 */
export interface ClassroomRepository {
  getById(id: string): Promise<ClassroomRecord | null>;
  getByDisplayCode(displayCode: string): Promise<ClassroomRecord | null>;
  listMembershipsForPerson(personId: string): Promise<ClassroomMembershipWithClassroom[]>;
  listMembers(classroomId: string): Promise<MemberWithPerson[]>;
  getMembership(classroomId: string, personId: string): Promise<MembershipRecord | null>;
  updateSettings(classroomId: string, settings: unknown): Promise<void>;
}

export interface ClassroomRecord {
  id: string;
  schoolId: string;
  name: string;
  slug: string;
  description: string | null;
  displayCode: string;
  settings: unknown;
  isActive: boolean;
}

export interface MembershipRecord {
  id: string;
  classroomId: string;
  personId: string;
  role: 'student' | 'teacher' | 'volunteer';
  isActive: boolean;
  joinedAt: Date;
  leftAt: Date | null;
}

export interface ClassroomMembershipWithClassroom extends MembershipRecord {
  classroom: ClassroomRecord;
}

export interface MemberWithPerson extends MembershipRecord {
  person: {
    id: string;
    legalName: string;
    displayName: string;
    email: string | null;
    gradeLevel: string | null;
  };
}
