import type { PrismaClient } from '@prisma/client';
import type {
  NinjaRepository,
  NinjaDomainRecord,
  NinjaAssignmentRecord,
  NinjaAssignmentWithPerson,
  NinjaAssignmentWithDomain,
  NinjaAssignmentWithRelations,
  CreateNinjaDomainInput,
  UpdateNinjaDomainInput,
  CreateNinjaAssignmentInput,
  UpdateNinjaAssignmentInput
} from '$lib/application/ports';

const PERSON_SELECT = { id: true, displayName: true } as const;
const DOMAIN_SELECT = { id: true, name: true, description: true, displayOrder: true } as const;

export class PrismaNinjaRepository implements NinjaRepository {
  constructor(private readonly db: PrismaClient) {}

  async listDomains(classroomId: string): Promise<NinjaDomainRecord[]> {
    return this.db.ninjaDomain.findMany({
      where: { classroomId, isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async getDomainById(id: string): Promise<NinjaDomainRecord | null> {
    return this.db.ninjaDomain.findUnique({ where: { id } });
  }

  async findDomainByName(
    classroomId: string,
    name: string
  ): Promise<NinjaDomainRecord | null> {
    return this.db.ninjaDomain.findFirst({
      where: { classroomId, name, isActive: true }
    });
  }

  async getNextDomainOrder(classroomId: string): Promise<number> {
    const maxOrder = await this.db.ninjaDomain.aggregate({
      where: { classroomId },
      _max: { displayOrder: true }
    });
    return (maxOrder._max.displayOrder ?? -1) + 1;
  }

  async createDomain(input: CreateNinjaDomainInput): Promise<NinjaDomainRecord> {
    return this.db.ninjaDomain.create({
      data: {
        classroomId: input.classroomId,
        name: input.name,
        description: input.description ?? null,
        displayOrder: input.displayOrder
      }
    });
  }

  async updateDomain(id: string, input: UpdateNinjaDomainInput): Promise<NinjaDomainRecord> {
    return this.db.ninjaDomain.update({
      where: { id },
      data: { name: input.name, description: input.description }
    });
  }

  async archiveDomain(id: string): Promise<NinjaDomainRecord> {
    return this.db.ninjaDomain.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async deactivateAssignmentsForDomain(domainId: string, revokedAt: Date): Promise<number> {
    const result = await this.db.ninjaAssignment.updateMany({
      where: { ninjaDomainId: domainId, isActive: true },
      data: { isActive: false, revokedAt }
    });
    return result.count;
  }

  async listAssignmentsByClassroom(
    classroomId: string
  ): Promise<NinjaAssignmentWithRelations[]> {
    return this.db.ninjaAssignment.findMany({
      where: {
        ninjaDomain: { classroomId, isActive: true },
        isActive: true
      },
      include: {
        person: { select: PERSON_SELECT },
        ninjaDomain: { select: DOMAIN_SELECT },
        assignedBy: { select: PERSON_SELECT }
      },
      orderBy: [{ person: { displayName: 'asc' } }, { ninjaDomain: { displayOrder: 'asc' } }]
    });
  }

  async listAssignmentsByDomain(domainId: string): Promise<NinjaAssignmentWithPerson[]> {
    return this.db.ninjaAssignment.findMany({
      where: { ninjaDomainId: domainId, isActive: true },
      include: { person: { select: PERSON_SELECT } },
      orderBy: { person: { displayName: 'asc' } }
    });
  }

  async listAssignmentsForPerson(
    classroomId: string,
    personId: string
  ): Promise<NinjaAssignmentWithDomain[]> {
    return this.db.ninjaAssignment.findMany({
      where: {
        personId,
        ninjaDomain: { classroomId, isActive: true },
        isActive: true
      },
      include: { ninjaDomain: { select: DOMAIN_SELECT } },
      orderBy: { ninjaDomain: { displayOrder: 'asc' } }
    });
  }

  async getAssignment(
    personId: string,
    domainId: string
  ): Promise<NinjaAssignmentRecord | null> {
    return this.db.ninjaAssignment.findUnique({
      where: { personId_ninjaDomainId: { personId, ninjaDomainId: domainId } }
    });
  }

  async createAssignment(
    input: CreateNinjaAssignmentInput
  ): Promise<NinjaAssignmentWithRelations> {
    return this.db.ninjaAssignment.create({
      data: {
        personId: input.personId,
        ninjaDomainId: input.ninjaDomainId,
        assignedById: input.assignedById
      },
      include: {
        person: { select: PERSON_SELECT },
        ninjaDomain: { select: DOMAIN_SELECT },
        assignedBy: { select: PERSON_SELECT }
      }
    });
  }

  async updateAssignment(
    id: string,
    input: UpdateNinjaAssignmentInput
  ): Promise<NinjaAssignmentWithRelations> {
    return this.db.ninjaAssignment.update({
      where: { id },
      data: {
        assignedById: input.assignedById,
        assignedAt: input.assignedAt,
        isActive: input.isActive,
        revokedAt: input.revokedAt
      },
      include: {
        person: { select: PERSON_SELECT },
        ninjaDomain: { select: DOMAIN_SELECT },
        assignedBy: { select: PERSON_SELECT }
      }
    });
  }

  async listAssignmentsForPeople(
    classroomId: string,
    personIds: string[]
  ): Promise<NinjaAssignmentWithRelations[]> {
    if (personIds.length === 0) return [];

    return this.db.ninjaAssignment.findMany({
      where: {
        personId: { in: personIds },
        ninjaDomain: { classroomId, isActive: true },
        isActive: true
      },
      include: {
        person: { select: PERSON_SELECT },
        ninjaDomain: { select: DOMAIN_SELECT }
      },
      orderBy: [{ ninjaDomain: { displayOrder: 'asc' } }, { person: { displayName: 'asc' } }]
    });
  }
}
