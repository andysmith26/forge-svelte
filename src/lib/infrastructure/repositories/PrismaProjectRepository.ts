import type { PrismaClient } from '@prisma/client';
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

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly db: PrismaClient) {}

  // -- Project CRUD --

  async getById(id: string): Promise<ProjectRecord | null> {
    return this.db.project.findUnique({ where: { id } });
  }

  async getWithMembers(id: string): Promise<ProjectWithMembers | null> {
    const project = await this.db.project.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { person: { select: { id: true, displayName: true } } },
          orderBy: { joinedAt: 'asc' }
        }
      }
    });
    if (!project) return null;
    return {
      id: project.id,
      schoolId: project.schoolId,
      name: project.name,
      description: project.description,
      isArchived: project.isArchived,
      visibility: project.visibility,
      createdById: project.createdById,
      createdAt: project.createdAt,
      members: project.memberships.map((m) => ({
        id: m.id,
        personId: m.personId,
        displayName: m.person.displayName,
        isActive: m.isActive
      })),
      memberCount: project.memberships.filter((m) => m.isActive).length
    };
  }

  async listBySchool(schoolId: string, includeArchived = false): Promise<ProjectListItem[]> {
    const where = includeArchived ? { schoolId } : { schoolId, isArchived: false };
    const projects = await this.db.project.findMany({
      where,
      include: {
        memberships: { where: { isActive: true }, select: { id: true } },
        handoffs: { orderBy: { createdAt: 'desc' as const }, take: 1, select: { createdAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return projects.map((p) => ({
      id: p.id,
      schoolId: p.schoolId,
      name: p.name,
      description: p.description,
      isArchived: p.isArchived,
      visibility: p.visibility,
      createdById: p.createdById,
      createdAt: p.createdAt,
      memberCount: p.memberships.length,
      lastHandoffAt: p.handoffs[0]?.createdAt ?? null
    }));
  }

  async listByMember(schoolId: string, personId: string): Promise<ProjectListItem[]> {
    const memberships = await this.db.projectMembership.findMany({
      where: { personId, isActive: true, project: { schoolId } },
      include: {
        project: {
          include: {
            memberships: { where: { isActive: true }, select: { id: true } },
            handoffs: {
              orderBy: { createdAt: 'desc' as const },
              take: 1,
              select: { createdAt: true }
            }
          }
        }
      }
    });
    return memberships.map((m) => ({
      id: m.project.id,
      schoolId: m.project.schoolId,
      name: m.project.name,
      description: m.project.description,
      isArchived: m.project.isArchived,
      visibility: m.project.visibility,
      createdById: m.project.createdById,
      createdAt: m.project.createdAt,
      memberCount: m.project.memberships.length,
      lastHandoffAt: m.project.handoffs[0]?.createdAt ?? null
    }));
  }

  async findByName(schoolId: string, name: string): Promise<ProjectRecord | null> {
    return this.db.project.findFirst({
      where: {
        schoolId,
        name: { equals: name, mode: 'insensitive' },
        isArchived: false
      }
    });
  }

  // -- Membership --

  async getMembership(
    projectId: string,
    personId: string
  ): Promise<ProjectMembershipRecord | null> {
    return this.db.projectMembership.findUnique({
      where: { projectId_personId: { projectId, personId } }
    });
  }

  async getActiveMembership(
    projectId: string,
    personId: string
  ): Promise<ProjectMembershipRecord | null> {
    return this.db.projectMembership.findFirst({
      where: { projectId, personId, isActive: true }
    });
  }

  async listActiveMembers(
    projectId: string
  ): Promise<(ProjectMembershipRecord & { person: { id: string; displayName: string } })[]> {
    return this.db.projectMembership.findMany({
      where: { projectId, isActive: true },
      include: { person: { select: { id: true, displayName: true } } },
      orderBy: { joinedAt: 'asc' }
    });
  }

  async getActiveProjectsForPerson(schoolId: string, personId: string): Promise<ProjectRecord[]> {
    const memberships = await this.db.projectMembership.findMany({
      where: {
        personId,
        isActive: true,
        project: { schoolId, isArchived: false }
      },
      include: { project: true }
    });
    return memberships.map((m) => m.project);
  }

  // -- Subsystems --

  async listSubsystems(projectId: string): Promise<SubsystemRecord[]> {
    return this.db.subsystem.findMany({
      where: { projectId, isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async getSubsystemById(id: string): Promise<SubsystemRecord | null> {
    return this.db.subsystem.findUnique({ where: { id } });
  }

  async findSubsystemByName(projectId: string, name: string): Promise<SubsystemRecord | null> {
    return this.db.subsystem.findFirst({
      where: { projectId, name: { equals: name, mode: 'insensitive' }, isActive: true }
    });
  }

  async getNextSubsystemOrder(projectId: string): Promise<number> {
    const maxOrder = await this.db.subsystem.aggregate({
      where: { projectId },
      _max: { displayOrder: true }
    });
    return (maxOrder._max.displayOrder ?? -1) + 1;
  }

  // -- Handoffs --

  async getHandoffById(id: string): Promise<HandoffRecord | null> {
    return this.db.handoff.findUnique({ where: { id } });
  }

  async listHandoffs(
    projectId: string,
    options?: { limit?: number; afterDate?: Date }
  ): Promise<HandoffWithRelations[]> {
    const handoffs = await this.db.handoff.findMany({
      where: {
        projectId,
        ...(options?.afterDate ? { createdAt: { gt: options.afterDate } } : {})
      },
      include: {
        author: { select: { id: true, displayName: true } },
        handoffSubsystems: {
          include: { subsystem: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'asc' },
      ...(options?.limit ? { take: options.limit } : {})
    });
    return handoffs.map((h) => ({
      id: h.id,
      projectId: h.projectId,
      authorId: h.authorId,
      sessionId: h.sessionId,
      whatIDid: h.whatIDid,
      whatsNext: h.whatsNext,
      blockers: h.blockers,
      questions: h.questions,
      createdAt: h.createdAt,
      author: h.author,
      subsystems: h.handoffSubsystems.map((hs) => hs.subsystem)
    }));
  }

  async countHandoffsSince(projectId: string, since: Date): Promise<number> {
    return this.db.handoff.count({
      where: { projectId, createdAt: { gt: since } }
    });
  }

  async getLastHandoffByAuthor(projectId: string, authorId: string): Promise<HandoffRecord | null> {
    return this.db.handoff.findFirst({
      where: { projectId, authorId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async hasHandoffInSession(
    projectId: string,
    authorId: string,
    sessionId: string
  ): Promise<boolean> {
    const count = await this.db.handoff.count({
      where: { projectId, authorId, sessionId }
    });
    return count > 0;
  }

  // -- Read Status --

  async getReadStatus(
    projectId: string,
    personId: string
  ): Promise<HandoffReadStatusRecord | null> {
    return this.db.handoffReadStatus.findUnique({
      where: { projectId_personId: { projectId, personId } }
    });
  }

  async countUnread(projectId: string, personId: string): Promise<number> {
    const readStatus = await this.getReadStatus(projectId, personId);
    const since = readStatus?.lastReadAt;
    if (!since) {
      return this.db.handoff.count({ where: { projectId } });
    }
    return this.db.handoff.count({
      where: { projectId, createdAt: { gt: since }, authorId: { not: personId } }
    });
  }

  async upsertReadStatus(projectId: string, personId: string, lastReadAt: Date): Promise<void> {
    await this.db.handoffReadStatus.upsert({
      where: { projectId_personId: { projectId, personId } },
      create: { projectId, personId, lastReadAt },
      update: { lastReadAt }
    });
  }

  // -- Freshness --

  async getLastHandoffDate(projectId: string): Promise<Date | null> {
    const handoff = await this.db.handoff.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });
    return handoff?.createdAt ?? null;
  }

  async getLastHandoffDates(projectIds: string[]): Promise<Map<string, Date | null>> {
    if (projectIds.length === 0) return new Map();
    const results = await this.db.handoff.groupBy({
      by: ['projectId'],
      where: { projectId: { in: projectIds } },
      _max: { createdAt: true }
    });
    const map = new Map<string, Date | null>();
    for (const id of projectIds) {
      map.set(id, null);
    }
    for (const row of results) {
      map.set(row.projectId, row._max.createdAt);
    }
    return map;
  }

  async countUnreadBatch(projectIds: string[], personId: string): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (projectIds.length === 0) return map;

    const readStatuses = await this.db.handoffReadStatus.findMany({
      where: { projectId: { in: projectIds }, personId }
    });
    const readMap = new Map<string, Date>();
    for (const rs of readStatuses) {
      readMap.set(rs.projectId, rs.lastReadAt);
    }

    for (const projectId of projectIds) {
      const since = readMap.get(projectId);
      if (!since) {
        const count = await this.db.handoff.count({ where: { projectId } });
        map.set(projectId, count);
      } else {
        const count = await this.db.handoff.count({
          where: { projectId, createdAt: { gt: since }, authorId: { not: personId } }
        });
        map.set(projectId, count);
      }
    }

    return map;
  }

  // -- Responses --

  async listResponsesForHandoff(
    handoffId: string,
    itemType: 'blocker' | 'question'
  ): Promise<HandoffResponseWithAuthor[]> {
    const responses = await this.db.handoffResponse.findMany({
      where: { handoffId, itemType },
      include: { author: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'asc' }
    });
    return responses.map((r) => ({
      id: r.id,
      handoffId: r.handoffId,
      itemType: r.itemType as 'blocker' | 'question',
      authorId: r.authorId,
      content: r.content,
      createdAt: r.createdAt,
      author: r.author
    }));
  }

  // -- Resolutions --

  async getResolution(
    handoffId: string,
    itemType: 'blocker' | 'question'
  ): Promise<HandoffItemResolutionWithResolver | null> {
    const resolution = await this.db.handoffItemResolution.findUnique({
      where: { handoffId_itemType: { handoffId, itemType } },
      include: { resolvedBy: { select: { id: true, displayName: true } } }
    });
    if (!resolution) return null;
    return {
      id: resolution.id,
      handoffId: resolution.handoffId,
      itemType: resolution.itemType as 'blocker' | 'question',
      resolvedById: resolution.resolvedById,
      note: resolution.note,
      createdAt: resolution.createdAt,
      resolvedBy: resolution.resolvedBy
    };
  }

  async getResolutionsForHandoffs(
    handoffIds: string[]
  ): Promise<Map<string, HandoffItemResolutionWithResolver[]>> {
    if (handoffIds.length === 0) return new Map();
    const resolutions = await this.db.handoffItemResolution.findMany({
      where: { handoffId: { in: handoffIds } },
      include: { resolvedBy: { select: { id: true, displayName: true } } }
    });
    const map = new Map<string, HandoffItemResolutionWithResolver[]>();
    for (const r of resolutions) {
      const key = r.handoffId;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({
        id: r.id,
        handoffId: r.handoffId,
        itemType: r.itemType as 'blocker' | 'question',
        resolvedById: r.resolvedById,
        note: r.note,
        createdAt: r.createdAt,
        resolvedBy: r.resolvedBy
      });
    }
    return map;
  }

  // -- Unresolved Items --

  async listUnresolvedItems(projectId: string): Promise<UnresolvedItem[]> {
    const handoffs = await this.db.handoff.findMany({
      where: {
        projectId,
        OR: [{ blockers: { not: null } }, { questions: { not: null } }]
      },
      include: {
        author: { select: { id: true, displayName: true } },
        resolutions: true,
        responses: { select: { id: true, itemType: true } },
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const items: UnresolvedItem[] = [];
    for (const h of handoffs) {
      const resolvedTypes = new Set(h.resolutions.map((r) => r.itemType));
      if (h.blockers && !resolvedTypes.has('blocker')) {
        items.push({
          handoffId: h.id,
          projectId: h.projectId,
          projectName: h.project.name,
          itemType: 'blocker',
          content: h.blockers,
          authorId: h.authorId,
          authorName: h.author.displayName,
          createdAt: h.createdAt,
          responseCount: h.responses.filter((r) => r.itemType === 'blocker').length
        });
      }
      if (h.questions && !resolvedTypes.has('question')) {
        items.push({
          handoffId: h.id,
          projectId: h.projectId,
          projectName: h.project.name,
          itemType: 'question',
          content: h.questions,
          authorId: h.authorId,
          authorName: h.author.displayName,
          createdAt: h.createdAt,
          responseCount: h.responses.filter((r) => r.itemType === 'question').length
        });
      }
    }
    return items;
  }

  async listUnresolvedItemsBySchool(schoolId: string): Promise<UnresolvedItem[]> {
    const handoffs = await this.db.handoff.findMany({
      where: {
        project: { schoolId, isArchived: false },
        OR: [{ blockers: { not: null } }, { questions: { not: null } }]
      },
      include: {
        author: { select: { id: true, displayName: true } },
        resolutions: true,
        responses: { select: { id: true, itemType: true } },
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const items: UnresolvedItem[] = [];
    for (const h of handoffs) {
      const resolvedTypes = new Set(h.resolutions.map((r) => r.itemType));
      if (h.blockers && !resolvedTypes.has('blocker')) {
        items.push({
          handoffId: h.id,
          projectId: h.projectId,
          projectName: h.project.name,
          itemType: 'blocker',
          content: h.blockers,
          authorId: h.authorId,
          authorName: h.author.displayName,
          createdAt: h.createdAt,
          responseCount: h.responses.filter((r) => r.itemType === 'blocker').length
        });
      }
      if (h.questions && !resolvedTypes.has('question')) {
        items.push({
          handoffId: h.id,
          projectId: h.projectId,
          projectName: h.project.name,
          itemType: 'question',
          content: h.questions,
          authorId: h.authorId,
          authorName: h.author.displayName,
          createdAt: h.createdAt,
          responseCount: h.responses.filter((r) => r.itemType === 'question').length
        });
      }
    }
    return items;
  }

  async listUnresolvedItemsByPerson(schoolId: string, personId: string): Promise<UnresolvedItem[]> {
    const handoffs = await this.db.handoff.findMany({
      where: {
        project: {
          schoolId,
          isArchived: false,
          memberships: { some: { personId, isActive: true } }
        },
        OR: [{ blockers: { not: null } }, { questions: { not: null } }]
      },
      include: {
        author: { select: { id: true, displayName: true } },
        resolutions: true,
        responses: { select: { id: true, itemType: true } },
        project: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const items: UnresolvedItem[] = [];
    for (const h of handoffs) {
      const resolvedTypes = new Set(h.resolutions.map((r) => r.itemType));
      if (h.blockers && !resolvedTypes.has('blocker')) {
        items.push({
          handoffId: h.id,
          projectId: h.projectId,
          projectName: h.project.name,
          itemType: 'blocker',
          content: h.blockers,
          authorId: h.authorId,
          authorName: h.author.displayName,
          createdAt: h.createdAt,
          responseCount: h.responses.filter((r) => r.itemType === 'blocker').length
        });
      }
      if (h.questions && !resolvedTypes.has('question')) {
        items.push({
          handoffId: h.id,
          projectId: h.projectId,
          projectName: h.project.name,
          itemType: 'question',
          content: h.questions,
          authorId: h.authorId,
          authorName: h.author.displayName,
          createdAt: h.createdAt,
          responseCount: h.responses.filter((r) => r.itemType === 'question').length
        });
      }
    }
    return items;
  }
}
