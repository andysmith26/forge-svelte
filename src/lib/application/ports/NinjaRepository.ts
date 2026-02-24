/**
 * Stub — will be fully defined when porting the application layer (Phase 3).
 */
export interface NinjaRepository {
  listDomains(classroomId: string): Promise<NinjaDomainRecord[]>;
  getDomainById(id: string): Promise<NinjaDomainRecord | null>;
  createDomain(data: unknown): Promise<NinjaDomainRecord>;
  updateDomain(id: string, data: unknown): Promise<NinjaDomainRecord>;
  archiveDomain(id: string): Promise<void>;
  listAssignmentsByClassroom(classroomId: string): Promise<NinjaAssignmentRecord[]>;
  createAssignment(data: unknown): Promise<NinjaAssignmentRecord>;
  updateAssignment(id: string, data: unknown): Promise<NinjaAssignmentRecord>;
}

export interface NinjaDomainRecord {
  id: string;
  classroomId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface NinjaAssignmentRecord {
  id: string;
  personId: string;
  ninjaDomainId: string;
  assignedById: string;
  isActive: boolean;
  assignedAt: Date;
  revokedAt: Date | null;
}
