export type NinjaDomainRecord = {
  id: string;
  classroomId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type NinjaAssignmentRecord = {
  id: string;
  personId: string;
  ninjaDomainId: string;
  assignedById: string;
  isActive: boolean;
  assignedAt: Date;
  revokedAt: Date | null;
};

export type NinjaDomainSummary = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
};

export type NinjaPersonSummary = {
  id: string;
  displayName: string;
};

export type NinjaAssignmentWithPerson = NinjaAssignmentRecord & {
  person: NinjaPersonSummary;
};

export type NinjaAssignmentWithDomain = NinjaAssignmentRecord & {
  ninjaDomain: NinjaDomainSummary;
};

export type NinjaAssignmentWithRelations = NinjaAssignmentRecord & {
  person: NinjaPersonSummary;
  ninjaDomain: NinjaDomainSummary;
  assignedBy?: NinjaPersonSummary;
};

export type CreateNinjaDomainInput = {
  classroomId: string;
  name: string;
  description: string | null;
  displayOrder: number;
};

export type UpdateNinjaDomainInput = {
  name?: string;
  description?: string | null;
};

export type CreateNinjaAssignmentInput = {
  personId: string;
  ninjaDomainId: string;
  assignedById: string;
};

export type UpdateNinjaAssignmentInput = {
  assignedById?: string;
  assignedAt?: Date;
  isActive?: boolean;
  revokedAt?: Date | null;
};

export interface NinjaRepository {
  listDomains(classroomId: string): Promise<NinjaDomainRecord[]>;
  getDomainById(id: string): Promise<NinjaDomainRecord | null>;
  findDomainByName(classroomId: string, name: string): Promise<NinjaDomainRecord | null>;
  getNextDomainOrder(classroomId: string): Promise<number>;
  createDomain(input: CreateNinjaDomainInput): Promise<NinjaDomainRecord>;
  updateDomain(id: string, input: UpdateNinjaDomainInput): Promise<NinjaDomainRecord>;
  archiveDomain(id: string): Promise<NinjaDomainRecord>;
  deactivateAssignmentsForDomain(domainId: string, revokedAt: Date): Promise<number>;

  listAssignmentsByClassroom(classroomId: string): Promise<NinjaAssignmentWithRelations[]>;
  listAssignmentsByDomain(domainId: string): Promise<NinjaAssignmentWithPerson[]>;
  listAssignmentsForPerson(
    classroomId: string,
    personId: string
  ): Promise<NinjaAssignmentWithDomain[]>;
  getAssignment(personId: string, domainId: string): Promise<NinjaAssignmentRecord | null>;
  createAssignment(input: CreateNinjaAssignmentInput): Promise<NinjaAssignmentWithRelations>;
  updateAssignment(
    id: string,
    input: UpdateNinjaAssignmentInput
  ): Promise<NinjaAssignmentWithRelations>;
  listAssignmentsForPeople(
    classroomId: string,
    personIds: string[]
  ): Promise<NinjaAssignmentWithRelations[]>;
}
