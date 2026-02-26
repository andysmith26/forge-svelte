import type {
  HelpRepository,
  HelpCategoryRecord,
  HelpRequestRecord,
  HelpRequestWithRelations,
  HelpQueueItem,
  ResolvedRequestSample,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateRequestInput,
  UpdateRequestInput,
  IdGenerator
} from '$lib/application/ports';
import type { HelpUrgency } from '$lib/domain/types/help-urgency';
import type { MemoryStore } from './MemoryStore';

export class MemoryHelpRepository implements HelpRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly idGen: IdGenerator
  ) {}

  async listCategories(classroomId: string): Promise<HelpCategoryRecord[]> {
    return [...this.store.helpCategories.values()]
      .filter((c) => c.classroomId === classroomId && c.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getCategoryById(id: string): Promise<HelpCategoryRecord | null> {
    return this.store.helpCategories.get(id) ?? null;
  }

  async findCategoryByName(classroomId: string, name: string): Promise<HelpCategoryRecord | null> {
    const lower = name.toLowerCase();
    for (const c of this.store.helpCategories.values()) {
      if (c.classroomId === classroomId && c.name.toLowerCase() === lower && c.isActive) {
        return c;
      }
    }
    return null;
  }

  async getNextCategoryOrder(classroomId: string): Promise<number> {
    let max = 0;
    for (const c of this.store.helpCategories.values()) {
      if (c.classroomId === classroomId && c.displayOrder > max) {
        max = c.displayOrder;
      }
    }
    return max + 1;
  }

  async createCategory(input: CreateCategoryInput): Promise<HelpCategoryRecord> {
    const id = this.idGen.generate();
    const record: HelpCategoryRecord = {
      id,
      classroomId: input.classroomId,
      name: input.name,
      description: input.description,
      ninjaDomainId: input.ninjaDomainId,
      displayOrder: input.displayOrder,
      isActive: true
    };
    this.store.helpCategories.set(id, record);
    return record;
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<HelpCategoryRecord> {
    const cat = this.store.helpCategories.get(id);
    if (!cat) throw new Error(`Category ${id} not found`);
    const updated = { ...cat, ...input };
    this.store.helpCategories.set(id, updated);
    return updated;
  }

  async archiveCategory(id: string): Promise<HelpCategoryRecord> {
    const cat = this.store.helpCategories.get(id);
    if (!cat) throw new Error(`Category ${id} not found`);
    const updated = { ...cat, isActive: false };
    this.store.helpCategories.set(id, updated);
    return updated;
  }

  async getRequestById(id: string): Promise<HelpRequestRecord | null> {
    return this.store.helpRequests.get(id) ?? null;
  }

  async findOpenRequest(sessionId: string, requesterId: string): Promise<HelpRequestRecord | null> {
    for (const r of this.store.helpRequests.values()) {
      if (
        r.sessionId === sessionId &&
        r.requesterId === requesterId &&
        (r.status === 'pending' || r.status === 'claimed')
      ) {
        return r;
      }
    }
    return null;
  }

  async listOpenRequests(
    sessionId: string,
    requesterId: string
  ): Promise<HelpRequestWithRelations[]> {
    const result: HelpRequestWithRelations[] = [];
    for (const r of this.store.helpRequests.values()) {
      if (
        r.sessionId === sessionId &&
        r.requesterId === requesterId &&
        (r.status === 'pending' || r.status === 'claimed')
      ) {
        result.push(this.withRelations(r));
      }
    }
    return result;
  }

  async listQueue(sessionId: string): Promise<HelpQueueItem[]> {
    const result: HelpQueueItem[] = [];
    for (const r of this.store.helpRequests.values()) {
      if (r.sessionId === sessionId && (r.status === 'pending' || r.status === 'claimed')) {
        const requester = this.store.persons.get(r.requesterId);
        result.push({
          ...r,
          requester: {
            id: r.requesterId,
            displayName: requester?.displayName ?? 'Unknown'
          },
          category: r.categoryId ? this.getCategorySummary(r.categoryId) : null,
          claimedBy: r.claimedById ? this.getPersonSummary(r.claimedById) : null
        });
      }
    }
    return result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async countPendingBefore(classroomId: string, createdAt: Date): Promise<number> {
    let count = 0;
    for (const r of this.store.helpRequests.values()) {
      if (
        r.classroomId === classroomId &&
        r.status === 'pending' &&
        r.createdAt.getTime() < createdAt.getTime()
      ) {
        count++;
      }
    }
    return count;
  }

  async listResolvedSamples(classroomId: string, limit: number): Promise<ResolvedRequestSample[]> {
    return [...this.store.helpRequests.values()]
      .filter((r) => r.classroomId === classroomId && r.status === 'resolved')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((r) => ({ createdAt: r.createdAt, resolvedAt: r.resolvedAt }));
  }

  // Internal helper to create a HelpRequestRecord from CreateRequestInput
  createRequest(input: CreateRequestInput): HelpRequestRecord {
    const id = this.idGen.generate();
    const record: HelpRequestRecord = {
      id,
      classroomId: input.classroomId,
      sessionId: input.sessionId,
      requesterId: input.requesterId,
      categoryId: input.categoryId,
      description: input.description,
      whatITried: input.whatITried,
      urgency: input.urgency as HelpUrgency,
      status: 'pending',
      claimedById: null,
      claimedAt: null,
      resolvedAt: null,
      cancelledAt: null,
      resolutionNotes: null,
      cancellationReason: null,
      createdAt: new Date()
    };
    this.store.helpRequests.set(id, record);
    return record;
  }

  updateRequest(id: string, input: UpdateRequestInput): HelpRequestRecord {
    const req = this.store.helpRequests.get(id);
    if (!req) throw new Error(`Request ${id} not found`);
    const updated = { ...req, ...input };
    this.store.helpRequests.set(id, updated);
    return updated;
  }

  private withRelations(r: HelpRequestRecord): HelpRequestWithRelations {
    return {
      ...r,
      category: r.categoryId ? this.getCategorySummary(r.categoryId) : null,
      claimedBy: r.claimedById ? this.getPersonSummary(r.claimedById) : null
    };
  }

  private getCategorySummary(id: string) {
    const c = this.store.helpCategories.get(id);
    return c ? { id: c.id, name: c.name } : null;
  }

  private getPersonSummary(id: string) {
    const p = this.store.persons.get(id);
    return p ? { id: p.id, displayName: p.displayName } : null;
  }
}
