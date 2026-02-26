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
  UpdateNinjaAssignmentInput,
  IdGenerator
} from '$lib/application/ports';
import type { MemoryStore } from './MemoryStore';

export class MemoryNinjaRepository implements NinjaRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly idGen: IdGenerator
  ) {}

  async listDomains(classroomId: string): Promise<NinjaDomainRecord[]> {
    return [...this.store.ninjaDomains.values()]
      .filter((d) => d.classroomId === classroomId && d.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getDomainById(id: string): Promise<NinjaDomainRecord | null> {
    return this.store.ninjaDomains.get(id) ?? null;
  }

  async findDomainByName(classroomId: string, name: string): Promise<NinjaDomainRecord | null> {
    const lower = name.toLowerCase();
    for (const d of this.store.ninjaDomains.values()) {
      if (d.classroomId === classroomId && d.name.toLowerCase() === lower && d.isActive) {
        return d;
      }
    }
    return null;
  }

  async getNextDomainOrder(classroomId: string): Promise<number> {
    let max = 0;
    for (const d of this.store.ninjaDomains.values()) {
      if (d.classroomId === classroomId && d.displayOrder > max) {
        max = d.displayOrder;
      }
    }
    return max + 1;
  }

  async createDomain(input: CreateNinjaDomainInput): Promise<NinjaDomainRecord> {
    const id = this.idGen.generate();
    const record: NinjaDomainRecord = {
      id,
      classroomId: input.classroomId,
      name: input.name,
      description: input.description,
      displayOrder: input.displayOrder,
      isActive: true
    };
    this.store.ninjaDomains.set(id, record);
    return record;
  }

  async updateDomain(id: string, input: UpdateNinjaDomainInput): Promise<NinjaDomainRecord> {
    const domain = this.store.ninjaDomains.get(id);
    if (!domain) throw new Error(`Domain ${id} not found`);
    const updated = { ...domain, ...input };
    this.store.ninjaDomains.set(id, updated);
    return updated;
  }

  async archiveDomain(id: string): Promise<NinjaDomainRecord> {
    const domain = this.store.ninjaDomains.get(id);
    if (!domain) throw new Error(`Domain ${id} not found`);
    const updated = { ...domain, isActive: false };
    this.store.ninjaDomains.set(id, updated);
    return updated;
  }

  async deactivateAssignmentsForDomain(domainId: string, revokedAt: Date): Promise<number> {
    let count = 0;
    for (const [id, a] of this.store.ninjaAssignments.entries()) {
      if (a.ninjaDomainId === domainId && a.isActive) {
        this.store.ninjaAssignments.set(id, { ...a, isActive: false, revokedAt });
        count++;
      }
    }
    return count;
  }

  async listAssignmentsByClassroom(classroomId: string): Promise<NinjaAssignmentWithRelations[]> {
    const result: NinjaAssignmentWithRelations[] = [];
    for (const a of this.store.ninjaAssignments.values()) {
      if (!a.isActive) continue;
      const domain = this.store.ninjaDomains.get(a.ninjaDomainId);
      if (!domain || domain.classroomId !== classroomId) continue;
      result.push(this.withRelations(a));
    }
    return result;
  }

  async listAssignmentsByDomain(domainId: string): Promise<NinjaAssignmentWithPerson[]> {
    const result: NinjaAssignmentWithPerson[] = [];
    for (const a of this.store.ninjaAssignments.values()) {
      if (a.ninjaDomainId === domainId && a.isActive) {
        const person = this.store.persons.get(a.personId);
        result.push({
          ...a,
          person: { id: a.personId, displayName: person?.displayName ?? 'Unknown' }
        });
      }
    }
    return result;
  }

  async listAssignmentsForPerson(
    classroomId: string,
    personId: string
  ): Promise<NinjaAssignmentWithDomain[]> {
    const result: NinjaAssignmentWithDomain[] = [];
    for (const a of this.store.ninjaAssignments.values()) {
      if (a.personId !== personId || !a.isActive) continue;
      const domain = this.store.ninjaDomains.get(a.ninjaDomainId);
      if (!domain || domain.classroomId !== classroomId) continue;
      result.push({
        ...a,
        ninjaDomain: {
          id: domain.id,
          name: domain.name,
          description: domain.description,
          displayOrder: domain.displayOrder
        }
      });
    }
    return result;
  }

  async getAssignment(personId: string, domainId: string): Promise<NinjaAssignmentRecord | null> {
    for (const a of this.store.ninjaAssignments.values()) {
      if (a.personId === personId && a.ninjaDomainId === domainId && a.isActive) {
        return a;
      }
    }
    return null;
  }

  async createAssignment(input: CreateNinjaAssignmentInput): Promise<NinjaAssignmentWithRelations> {
    const id = this.idGen.generate();
    const record: NinjaAssignmentRecord = {
      id,
      personId: input.personId,
      ninjaDomainId: input.ninjaDomainId,
      assignedById: input.assignedById,
      isActive: true,
      assignedAt: new Date(),
      revokedAt: null
    };
    this.store.ninjaAssignments.set(id, record);
    return this.withRelations(record);
  }

  async updateAssignment(
    id: string,
    input: UpdateNinjaAssignmentInput
  ): Promise<NinjaAssignmentWithRelations> {
    const a = this.store.ninjaAssignments.get(id);
    if (!a) throw new Error(`Assignment ${id} not found`);
    const updated = { ...a, ...input };
    this.store.ninjaAssignments.set(id, updated);
    return this.withRelations(updated);
  }

  async listAssignmentsForPeople(
    classroomId: string,
    personIds: string[]
  ): Promise<NinjaAssignmentWithRelations[]> {
    const idSet = new Set(personIds);
    const result: NinjaAssignmentWithRelations[] = [];
    for (const a of this.store.ninjaAssignments.values()) {
      if (!a.isActive || !idSet.has(a.personId)) continue;
      const domain = this.store.ninjaDomains.get(a.ninjaDomainId);
      if (!domain || domain.classroomId !== classroomId) continue;
      result.push(this.withRelations(a));
    }
    return result;
  }

  private withRelations(a: NinjaAssignmentRecord): NinjaAssignmentWithRelations {
    const person = this.store.persons.get(a.personId);
    const domain = this.store.ninjaDomains.get(a.ninjaDomainId);
    const assignedBy = this.store.persons.get(a.assignedById);
    return {
      ...a,
      person: { id: a.personId, displayName: person?.displayName ?? 'Unknown' },
      ninjaDomain: {
        id: domain?.id ?? a.ninjaDomainId,
        name: domain?.name ?? 'Unknown',
        description: domain?.description ?? null,
        displayOrder: domain?.displayOrder ?? 0
      },
      assignedBy: assignedBy
        ? { id: assignedBy.id, displayName: assignedBy.displayName }
        : undefined
    };
  }
}
