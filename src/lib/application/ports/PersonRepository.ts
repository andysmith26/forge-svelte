/**
 * Stub — will be fully defined when porting the application layer (Phase 3).
 */
export interface PersonRepository {
  getById(id: string): Promise<PersonRecord | null>;
  findByEmail(email: string): Promise<PersonRecord | null>;
  createPerson(data: unknown): Promise<PersonRecord>;
  updatePerson(id: string, data: unknown): Promise<PersonRecord>;
  listStudents(classroomId: string): Promise<PersonRecord[]>;
}

export interface PersonRecord {
  id: string;
  schoolId: string;
  email: string | null;
  legalName: string;
  displayName: string;
  pronouns: string | null;
  gradeLevel: string | null;
  askMeAbout: string[];
  isActive: boolean;
}
