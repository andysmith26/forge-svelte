import type {
  ProjectRepository,
  ProjectRecord,
  ProjectMembershipRecord,
  SubsystemRecord,
  HandoffRecord,
  HandoffWithRelations,
  HandoffReadStatusRecord,
  ProjectListItem,
  ProjectWithMembers,
  HandoffResponseWithAuthor,
  HandoffItemResolutionWithResolver,
  UnresolvedItem
} from '$lib/application/ports/ProjectRepository';
import type { IdGenerator } from '$lib/application/ports';
import type { MemoryStore } from './MemoryStore';

export class MemoryProjectRepository implements ProjectRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly idGen: IdGenerator
  ) {}

  // -- Project CRUD --

  async getById(id: string): Promise<ProjectRecord | null> {
    return this.store.projects.get(id) ?? null;
  }

  async getWithMembers(id: string): Promise<ProjectWithMembers | null> {
    const project = this.store.projects.get(id);
    if (!project) return null;
    const memberships = [...this.store.projectMemberships.values()].filter(
      (m) => m.projectId === id
    );
    const members = memberships.map((m) => {
      const person = this.store.persons.get(m.personId);
      return {
        id: m.id,
        personId: m.personId,
        displayName: person?.displayName ?? 'Unknown',
        isActive: m.isActive
      };
    });
    return {
      ...project,
      members,
      memberCount: members.filter((m) => m.isActive).length
    };
  }

  async listBySchool(schoolId: string, includeArchived = false): Promise<ProjectListItem[]> {
    const projects = [...this.store.projects.values()]
      .filter((p) => p.schoolId === schoolId && (includeArchived || !p.isArchived))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return projects.map((p) => this.toListItem(p));
  }

  async listByMember(schoolId: string, personId: string): Promise<ProjectListItem[]> {
    const memberProjectIds = [...this.store.projectMemberships.values()]
      .filter((m) => m.personId === personId && m.isActive)
      .map((m) => m.projectId);

    return [...this.store.projects.values()]
      .filter((p) => memberProjectIds.includes(p.id) && p.schoolId === schoolId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((p) => this.toListItem(p));
  }

  async findByName(schoolId: string, name: string): Promise<ProjectRecord | null> {
    const lower = name.toLowerCase();
    for (const p of this.store.projects.values()) {
      if (p.schoolId === schoolId && p.name.toLowerCase() === lower && !p.isArchived) {
        return p;
      }
    }
    return null;
  }

  // -- Membership --

  async getMembership(
    projectId: string,
    personId: string
  ): Promise<ProjectMembershipRecord | null> {
    return this.store.projectMemberships.get(`${projectId}:${personId}`) ?? null;
  }

  async getActiveMembership(
    projectId: string,
    personId: string
  ): Promise<ProjectMembershipRecord | null> {
    const m = this.store.projectMemberships.get(`${projectId}:${personId}`);
    return m && m.isActive ? m : null;
  }

  async listActiveMembers(
    projectId: string
  ): Promise<(ProjectMembershipRecord & { person: { id: string; displayName: string } })[]> {
    return [...this.store.projectMemberships.values()]
      .filter((m) => m.projectId === projectId && m.isActive)
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime())
      .map((m) => {
        const person = this.store.persons.get(m.personId);
        return {
          ...m,
          person: { id: m.personId, displayName: person?.displayName ?? 'Unknown' }
        };
      });
  }

  async getActiveProjectsForPerson(schoolId: string, personId: string): Promise<ProjectRecord[]> {
    const projectIds = [...this.store.projectMemberships.values()]
      .filter((m) => m.personId === personId && m.isActive)
      .map((m) => m.projectId);

    return [...this.store.projects.values()].filter(
      (p) => projectIds.includes(p.id) && p.schoolId === schoolId && !p.isArchived
    );
  }

  // -- Subsystems --

  async listSubsystems(projectId: string): Promise<SubsystemRecord[]> {
    return [...this.store.subsystems.values()]
      .filter((s) => s.projectId === projectId && s.isActive)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  async getSubsystemById(id: string): Promise<SubsystemRecord | null> {
    return this.store.subsystems.get(id) ?? null;
  }

  async findSubsystemByName(projectId: string, name: string): Promise<SubsystemRecord | null> {
    const lower = name.toLowerCase();
    for (const s of this.store.subsystems.values()) {
      if (s.projectId === projectId && s.name.toLowerCase() === lower && s.isActive) {
        return s;
      }
    }
    return null;
  }

  async getNextSubsystemOrder(projectId: string): Promise<number> {
    const subsystems = [...this.store.subsystems.values()].filter((s) => s.projectId === projectId);
    if (subsystems.length === 0) return 0;
    return Math.max(...subsystems.map((s) => s.displayOrder)) + 1;
  }

  // -- Handoffs --

  async getHandoffById(id: string): Promise<HandoffRecord | null> {
    return this.store.handoffs.get(id) ?? null;
  }

  async listHandoffs(
    projectId: string,
    options?: { limit?: number; afterDate?: Date }
  ): Promise<HandoffWithRelations[]> {
    let handoffs = [...this.store.handoffs.values()]
      .filter((h) => h.projectId === projectId)
      .filter((h) => !options?.afterDate || h.createdAt > options.afterDate)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (options?.limit) {
      handoffs = handoffs.slice(0, options.limit);
    }

    return handoffs.map((h) => {
      const author = this.store.persons.get(h.authorId);
      const subsystemIds = this.store.handoffSubsystems
        .filter((hs) => hs.handoffId === h.id)
        .map((hs) => hs.subsystemId);
      const subsystems = subsystemIds
        .map((id) => this.store.subsystems.get(id))
        .filter((s): s is SubsystemRecord => !!s)
        .map((s) => ({ id: s.id, name: s.name }));

      return {
        ...h,
        author: { id: h.authorId, displayName: author?.displayName ?? 'Unknown' },
        subsystems
      };
    });
  }

  async countHandoffsSince(projectId: string, since: Date): Promise<number> {
    return [...this.store.handoffs.values()].filter(
      (h) => h.projectId === projectId && h.createdAt > since
    ).length;
  }

  async getLastHandoffByAuthor(projectId: string, authorId: string): Promise<HandoffRecord | null> {
    const handoffs = [...this.store.handoffs.values()]
      .filter((h) => h.projectId === projectId && h.authorId === authorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return handoffs[0] ?? null;
  }

  async hasHandoffInSession(
    projectId: string,
    authorId: string,
    sessionId: string
  ): Promise<boolean> {
    return [...this.store.handoffs.values()].some(
      (h) => h.projectId === projectId && h.authorId === authorId && h.sessionId === sessionId
    );
  }

  // -- Read Status --

  async getReadStatus(
    projectId: string,
    personId: string
  ): Promise<HandoffReadStatusRecord | null> {
    return this.store.handoffReadStatuses.get(`${projectId}:${personId}`) ?? null;
  }

  async countUnread(projectId: string, personId: string): Promise<number> {
    const readStatus = await this.getReadStatus(projectId, personId);
    const since = readStatus?.lastReadAt;
    if (!since) {
      return [...this.store.handoffs.values()].filter((h) => h.projectId === projectId).length;
    }
    return [...this.store.handoffs.values()].filter(
      (h) => h.projectId === projectId && h.createdAt > since && h.authorId !== personId
    ).length;
  }

  async upsertReadStatus(projectId: string, personId: string, lastReadAt: Date): Promise<void> {
    const key = `${projectId}:${personId}`;
    const existing = this.store.handoffReadStatuses.get(key);
    this.store.handoffReadStatuses.set(key, {
      id: existing?.id ?? this.idGen.generate(),
      projectId,
      personId,
      lastReadAt
    });
  }

  // -- Freshness --

  async getLastHandoffDate(projectId: string): Promise<Date | null> {
    const handoffs = [...this.store.handoffs.values()]
      .filter((h) => h.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return handoffs[0]?.createdAt ?? null;
  }

  async getLastHandoffDates(projectIds: string[]): Promise<Map<string, Date | null>> {
    const map = new Map<string, Date | null>();
    for (const id of projectIds) {
      map.set(id, await this.getLastHandoffDate(id));
    }
    return map;
  }

  async countUnreadBatch(projectIds: string[], personId: string): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    for (const id of projectIds) {
      map.set(id, await this.countUnread(id, personId));
    }
    return map;
  }

  // -- Responses --

  async listResponsesForHandoff(
    handoffId: string,
    itemType: 'blocker' | 'question'
  ): Promise<HandoffResponseWithAuthor[]> {
    return [...this.store.handoffResponses.values()]
      .filter((r) => r.handoffId === handoffId && r.itemType === itemType)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((r) => {
        const person = this.store.persons.get(r.authorId);
        return {
          ...r,
          author: { id: r.authorId, displayName: person?.displayName ?? 'Unknown' }
        };
      });
  }

  // -- Resolutions --

  async getResolution(
    handoffId: string,
    itemType: 'blocker' | 'question'
  ): Promise<HandoffItemResolutionWithResolver | null> {
    const key = `${handoffId}:${itemType}`;
    const resolution = this.store.handoffItemResolutions.get(key);
    if (!resolution) return null;
    const person = this.store.persons.get(resolution.resolvedById);
    return {
      ...resolution,
      resolvedBy: { id: resolution.resolvedById, displayName: person?.displayName ?? 'Unknown' }
    };
  }

  async getResolutionsForHandoffs(
    handoffIds: string[]
  ): Promise<Map<string, HandoffItemResolutionWithResolver[]>> {
    const map = new Map<string, HandoffItemResolutionWithResolver[]>();
    for (const r of this.store.handoffItemResolutions.values()) {
      if (handoffIds.includes(r.handoffId)) {
        if (!map.has(r.handoffId)) map.set(r.handoffId, []);
        const person = this.store.persons.get(r.resolvedById);
        map.get(r.handoffId)!.push({
          ...r,
          resolvedBy: { id: r.resolvedById, displayName: person?.displayName ?? 'Unknown' }
        });
      }
    }
    return map;
  }

  // -- Unresolved Items --

  async listUnresolvedItems(projectId: string): Promise<UnresolvedItem[]> {
    const handoffs = [...this.store.handoffs.values()]
      .filter((h) => h.projectId === projectId && (h.blockers !== null || h.questions !== null))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const items: UnresolvedItem[] = [];
    for (const h of handoffs) {
      const project = this.store.projects.get(h.projectId);
      const author = this.store.persons.get(h.authorId);
      if (h.blockers && !this.store.handoffItemResolutions.has(`${h.id}:blocker`)) {
        items.push({
          handoffId: h.id,
          projectId: h.projectId,
          projectName: project?.name ?? 'Unknown',
          itemType: 'blocker',
          content: h.blockers,
          authorId: h.authorId,
          authorName: author?.displayName ?? 'Unknown',
          createdAt: h.createdAt,
          responseCount: [...this.store.handoffResponses.values()].filter(
            (r) => r.handoffId === h.id && r.itemType === 'blocker'
          ).length
        });
      }
      if (h.questions && !this.store.handoffItemResolutions.has(`${h.id}:question`)) {
        items.push({
          handoffId: h.id,
          projectId: h.projectId,
          projectName: project?.name ?? 'Unknown',
          itemType: 'question',
          content: h.questions,
          authorId: h.authorId,
          authorName: author?.displayName ?? 'Unknown',
          createdAt: h.createdAt,
          responseCount: [...this.store.handoffResponses.values()].filter(
            (r) => r.handoffId === h.id && r.itemType === 'question'
          ).length
        });
      }
    }
    return items;
  }

  async listUnresolvedItemsBySchool(schoolId: string): Promise<UnresolvedItem[]> {
    const projectIds = [...this.store.projects.values()]
      .filter((p) => p.schoolId === schoolId && !p.isArchived)
      .map((p) => p.id);

    const allItems: UnresolvedItem[] = [];
    for (const pid of projectIds) {
      const items = await this.listUnresolvedItems(pid);
      allItems.push(...items);
    }
    return allItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // -- Helpers --

  private toListItem(p: ProjectRecord): ProjectListItem {
    const memberCount = [...this.store.projectMemberships.values()].filter(
      (m) => m.projectId === p.id && m.isActive
    ).length;
    const lastHandoff = [...this.store.handoffs.values()]
      .filter((h) => h.projectId === p.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    return {
      ...p,
      memberCount,
      lastHandoffAt: lastHandoff?.createdAt ?? null
    };
  }
}
