import type { PrismaClient } from '@prisma/client';
import type {
  SessionRepository,
  SessionRecord,
  SessionFilters,
  CreateSessionInput,
  SessionWithClassroom,
  SessionWithDetails
} from '$lib/application/ports';

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly db: PrismaClient) {}

  async getById(id: string): Promise<SessionRecord | null> {
    return this.db.classSession.findUnique({ where: { id } });
  }

  async getWithClassroom(id: string): Promise<SessionWithClassroom | null> {
    return this.db.classSession.findUnique({
      where: { id },
      include: {
        classroom: { select: { id: true, name: true, displayCode: true } }
      }
    });
  }

  async getWithDetails(id: string): Promise<SessionWithDetails | null> {
    return this.db.classSession.findUnique({
      where: { id },
      include: {
        classroom: { select: { id: true, name: true, displayCode: true } },
        signIns: {
          include: {
            person: { select: { id: true, displayName: true, pronouns: true } }
          }
        }
      }
    });
  }

  async getCurrentWithClassroom(classroomId: string): Promise<SessionWithClassroom | null> {
    return this.db.classSession.findFirst({
      where: { classroomId, status: 'active' },
      include: {
        classroom: { select: { id: true, name: true, displayCode: true } }
      }
    });
  }

  async findActive(classroomId: string): Promise<SessionRecord | null> {
    return this.db.classSession.findFirst({
      where: { classroomId, status: 'active' }
    });
  }

  async listByClassroom(
    classroomId: string,
    filters: SessionFilters = {}
  ): Promise<SessionRecord[]> {
    const { from, to } = filters;

    return this.db.classSession.findMany({
      where: {
        classroomId,
        ...(from && { scheduledDate: { gte: from } }),
        ...(to && { scheduledDate: { lte: to } })
      },
      orderBy: { scheduledDate: 'desc' }
    });
  }

  async create(input: CreateSessionInput): Promise<SessionRecord> {
    return this.db.classSession.create({
      data: {
        classroomId: input.classroomId,
        name: input.name ?? null,
        sessionType: input.sessionType,
        scheduledDate: input.scheduledDate,
        startTime: input.startTime,
        endTime: input.endTime,
        status: input.status ?? 'scheduled'
      }
    });
  }

  async update(id: string, data: Partial<SessionRecord>): Promise<SessionRecord> {
    return this.db.classSession.update({
      where: { id },
      data: {
        name: data.name,
        status: data.status,
        actualStartAt: data.actualStartAt,
        actualEndAt: data.actualEndAt
      }
    });
  }
}
