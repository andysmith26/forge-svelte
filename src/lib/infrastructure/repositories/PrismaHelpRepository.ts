import type { PrismaClient } from '@prisma/client';
import type {
  HelpRepository,
  HelpCategoryRecord,
  HelpRequestRecord,
  HelpRequestWithRelations,
  HelpQueueItem,
  ResolvedRequestSample,
  CreateCategoryInput,
  UpdateCategoryInput
} from '$lib/application/ports';

export class PrismaHelpRepository implements HelpRepository {
  constructor(private readonly db: PrismaClient) {}

  async listCategories(classroomId: string): Promise<HelpCategoryRecord[]> {
    return this.db.helpCategory.findMany({
      where: { classroomId, isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
  }

  async getCategoryById(id: string): Promise<HelpCategoryRecord | null> {
    return this.db.helpCategory.findUnique({ where: { id } });
  }

  async findCategoryByName(
    classroomId: string,
    name: string
  ): Promise<HelpCategoryRecord | null> {
    return this.db.helpCategory.findFirst({
      where: { classroomId, name, isActive: true }
    });
  }

  async getNextCategoryOrder(classroomId: string): Promise<number> {
    const maxOrder = await this.db.helpCategory.aggregate({
      where: { classroomId },
      _max: { displayOrder: true }
    });
    return (maxOrder._max.displayOrder ?? -1) + 1;
  }

  async createCategory(input: CreateCategoryInput): Promise<HelpCategoryRecord> {
    return this.db.helpCategory.create({
      data: {
        classroomId: input.classroomId,
        name: input.name,
        description: input.description ?? null,
        ninjaDomainId: input.ninjaDomainId ?? null,
        displayOrder: input.displayOrder
      }
    });
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<HelpCategoryRecord> {
    return this.db.helpCategory.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        ninjaDomainId: input.ninjaDomainId
      }
    });
  }

  async archiveCategory(id: string): Promise<HelpCategoryRecord> {
    return this.db.helpCategory.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getRequestById(id: string): Promise<HelpRequestRecord | null> {
    return this.db.helpRequest.findUnique({ where: { id } });
  }

  async findOpenRequest(
    sessionId: string,
    requesterId: string
  ): Promise<HelpRequestRecord | null> {
    return this.db.helpRequest.findFirst({
      where: {
        sessionId,
        requesterId,
        status: { in: ['pending', 'claimed'] }
      }
    });
  }

  async listOpenRequests(
    sessionId: string,
    requesterId: string
  ): Promise<HelpRequestWithRelations[]> {
    return this.db.helpRequest.findMany({
      where: {
        sessionId,
        requesterId,
        status: { in: ['pending', 'claimed'] }
      },
      include: {
        category: { select: { id: true, name: true } },
        claimedBy: { select: { id: true, displayName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async listQueue(sessionId: string): Promise<HelpQueueItem[]> {
    return this.db.helpRequest.findMany({
      where: {
        sessionId,
        status: { in: ['pending', 'claimed'] }
      },
      include: {
        requester: { select: { id: true, displayName: true } },
        category: { select: { id: true, name: true } },
        claimedBy: { select: { id: true, displayName: true } }
      },
      orderBy: [{ urgency: 'asc' }, { createdAt: 'asc' }]
    });
  }

  async countPendingBefore(classroomId: string, createdAt: Date): Promise<number> {
    return this.db.helpRequest.count({
      where: {
        classroomId,
        status: 'pending',
        createdAt: { lte: createdAt }
      }
    });
  }

  async listResolvedSamples(
    classroomId: string,
    limit: number
  ): Promise<ResolvedRequestSample[]> {
    return this.db.helpRequest.findMany({
      where: {
        classroomId,
        status: 'resolved',
        resolvedAt: { not: null }
      },
      select: { createdAt: true, resolvedAt: true },
      orderBy: { resolvedAt: 'desc' },
      take: limit
    });
  }
}
