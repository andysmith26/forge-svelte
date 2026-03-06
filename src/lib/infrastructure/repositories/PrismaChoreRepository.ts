import type { PrismaClient } from '@prisma/client';
import type {
  ChoreRepository,
  ChoreRecord,
  ChoreInstanceRecord,
  ChoreVerificationRecord,
  ChoreInstanceWithRelations,
  ChoreListItem
} from '$lib/application/ports/ChoreRepository';
import type { ChoreVerificationType } from '$lib/domain/entities/chore.entity';

function mapChoreRecord(row: {
  id: string;
  schoolId: string;
  name: string;
  description: string;
  size: string;
  estimatedMinutes: number | null;
  recurrence: string;
  verificationType: string;
  location: string | null;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
}): ChoreRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    name: row.name,
    description: row.description,
    size: row.size as ChoreRecord['size'],
    estimatedMinutes: row.estimatedMinutes,
    recurrence: row.recurrence as ChoreRecord['recurrence'],
    verificationType: row.verificationType as ChoreRecord['verificationType'],
    location: row.location,
    isActive: row.isActive,
    createdById: row.createdById,
    createdAt: row.createdAt
  };
}

function mapInstanceRecord(row: {
  id: string;
  choreId: string;
  sessionId: string | null;
  status: string;
  dueDate: Date | null;
  claimedById: string | null;
  claimedAt: Date | null;
  completedAt: Date | null;
  completionNotes: string | null;
  createdAt: Date;
}): ChoreInstanceRecord {
  return {
    id: row.id,
    choreId: row.choreId,
    sessionId: row.sessionId,
    status: row.status as ChoreInstanceRecord['status'],
    dueDate: row.dueDate,
    claimedById: row.claimedById,
    claimedAt: row.claimedAt,
    completedAt: row.completedAt,
    completionNotes: row.completionNotes,
    createdAt: row.createdAt
  };
}

export class PrismaChoreRepository implements ChoreRepository {
  constructor(private readonly db: PrismaClient) {}

  async getById(id: string): Promise<ChoreRecord | null> {
    const row = await this.db.chore.findUnique({ where: { id } });
    return row ? mapChoreRecord(row) : null;
  }

  async listBySchool(schoolId: string, includeArchived = false): Promise<ChoreListItem[]> {
    const where = includeArchived ? { schoolId } : { schoolId, isActive: true };
    const chores = await this.db.chore.findMany({
      where,
      include: {
        _count: {
          select: {
            instances: {
              where: { status: { notIn: ['archived'] } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return chores.map((c) => ({
      ...mapChoreRecord(c),
      activeInstanceCount: c._count.instances
    }));
  }

  async findByName(schoolId: string, name: string): Promise<ChoreRecord | null> {
    const row = await this.db.chore.findFirst({
      where: { schoolId, name, isActive: true }
    });
    return row ? mapChoreRecord(row) : null;
  }

  async getInstanceById(id: string): Promise<ChoreInstanceRecord | null> {
    const row = await this.db.choreInstance.findUnique({ where: { id } });
    return row ? mapInstanceRecord(row) : null;
  }

  async getInstanceWithRelations(id: string): Promise<ChoreInstanceWithRelations | null> {
    const row = await this.db.choreInstance.findUnique({
      where: { id },
      include: {
        chore: { select: { id: true, name: true, verificationType: true } },
        claimedBy: { select: { id: true, displayName: true } },
        verifications: {
          include: { verifier: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!row) return null;
    return {
      ...mapInstanceRecord(row),
      chore: {
        id: row.chore.id,
        name: row.chore.name,
        verificationType: row.chore.verificationType as ChoreVerificationType
      },
      claimedBy: row.claimedBy
        ? { id: row.claimedBy.id, displayName: row.claimedBy.displayName }
        : null,
      verifications: row.verifications.map((v) => ({
        id: v.id,
        choreInstanceId: v.choreInstanceId,
        verifierId: v.verifierId,
        decision: v.decision as ChoreVerificationRecord['decision'],
        feedback: v.feedback,
        verifiedAt: v.verifiedAt,
        createdAt: v.createdAt,
        verifier: { id: v.verifier.id, displayName: v.verifier.displayName }
      }))
    };
  }

  async listInstances(
    choreId: string,
    filters?: { status?: ChoreInstanceRecord['status'] }
  ): Promise<ChoreInstanceRecord[]> {
    const where: Record<string, unknown> = { choreId };
    if (filters?.status) where.status = filters.status;
    const rows = await this.db.choreInstance.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return rows.map(mapInstanceRecord);
  }

  async listAvailableInstances(schoolId: string): Promise<ChoreInstanceWithRelations[]> {
    const rows = await this.db.choreInstance.findMany({
      where: {
        status: 'available',
        chore: { schoolId, isActive: true }
      },
      include: {
        chore: { select: { id: true, name: true, verificationType: true } },
        claimedBy: { select: { id: true, displayName: true } },
        verifications: {
          include: { verifier: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return rows.map((row) => ({
      ...mapInstanceRecord(row),
      chore: {
        id: row.chore.id,
        name: row.chore.name,
        verificationType: row.chore.verificationType as ChoreVerificationType
      },
      claimedBy: row.claimedBy
        ? { id: row.claimedBy.id, displayName: row.claimedBy.displayName }
        : null,
      verifications: row.verifications.map((v) => ({
        id: v.id,
        choreInstanceId: v.choreInstanceId,
        verifierId: v.verifierId,
        decision: v.decision as ChoreVerificationRecord['decision'],
        feedback: v.feedback,
        verifiedAt: v.verifiedAt,
        createdAt: v.createdAt,
        verifier: { id: v.verifier.id, displayName: v.verifier.displayName }
      }))
    }));
  }

  async listClaimedByPerson(
    schoolId: string,
    personId: string
  ): Promise<ChoreInstanceWithRelations[]> {
    const rows = await this.db.choreInstance.findMany({
      where: {
        claimedById: personId,
        status: { in: ['claimed', 'completed', 'redo_requested'] },
        chore: { schoolId }
      },
      include: {
        chore: { select: { id: true, name: true, verificationType: true } },
        claimedBy: { select: { id: true, displayName: true } },
        verifications: {
          include: { verifier: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { claimedAt: 'desc' }
    });
    return rows.map((row) => ({
      ...mapInstanceRecord(row),
      chore: {
        id: row.chore.id,
        name: row.chore.name,
        verificationType: row.chore.verificationType as ChoreVerificationType
      },
      claimedBy: row.claimedBy
        ? { id: row.claimedBy.id, displayName: row.claimedBy.displayName }
        : null,
      verifications: row.verifications.map((v) => ({
        id: v.id,
        choreInstanceId: v.choreInstanceId,
        verifierId: v.verifierId,
        decision: v.decision as ChoreVerificationRecord['decision'],
        feedback: v.feedback,
        verifiedAt: v.verifiedAt,
        createdAt: v.createdAt,
        verifier: { id: v.verifier.id, displayName: v.verifier.displayName }
      }))
    }));
  }

  async listNeedingVerification(schoolId: string): Promise<ChoreInstanceWithRelations[]> {
    const rows = await this.db.choreInstance.findMany({
      where: {
        status: 'completed',
        chore: { schoolId, verificationType: { in: ['peer', 'teacher'] } }
      },
      include: {
        chore: { select: { id: true, name: true, verificationType: true } },
        claimedBy: { select: { id: true, displayName: true } },
        verifications: {
          include: { verifier: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { completedAt: 'asc' }
    });
    return rows.map((row) => ({
      ...mapInstanceRecord(row),
      chore: {
        id: row.chore.id,
        name: row.chore.name,
        verificationType: row.chore.verificationType as ChoreVerificationType
      },
      claimedBy: row.claimedBy
        ? { id: row.claimedBy.id, displayName: row.claimedBy.displayName }
        : null,
      verifications: row.verifications.map((v) => ({
        id: v.id,
        choreInstanceId: v.choreInstanceId,
        verifierId: v.verifierId,
        decision: v.decision as ChoreVerificationRecord['decision'],
        feedback: v.feedback,
        verifiedAt: v.verifiedAt,
        createdAt: v.createdAt,
        verifier: { id: v.verifier.id, displayName: v.verifier.displayName }
      }))
    }));
  }

  async listRecentlyCompleted(schoolId: string, limit = 10): Promise<ChoreInstanceWithRelations[]> {
    const rows = await this.db.choreInstance.findMany({
      where: {
        status: 'verified',
        chore: { schoolId }
      },
      include: {
        chore: { select: { id: true, name: true, verificationType: true } },
        claimedBy: { select: { id: true, displayName: true } },
        verifications: {
          include: { verifier: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { completedAt: 'desc' },
      take: limit
    });
    return rows.map((row) => ({
      ...mapInstanceRecord(row),
      chore: {
        id: row.chore.id,
        name: row.chore.name,
        verificationType: row.chore.verificationType as ChoreVerificationType
      },
      claimedBy: row.claimedBy
        ? { id: row.claimedBy.id, displayName: row.claimedBy.displayName }
        : null,
      verifications: row.verifications.map((v) => ({
        id: v.id,
        choreInstanceId: v.choreInstanceId,
        verifierId: v.verifierId,
        decision: v.decision as ChoreVerificationRecord['decision'],
        feedback: v.feedback,
        verifiedAt: v.verifiedAt,
        createdAt: v.createdAt,
        verifier: { id: v.verifier.id, displayName: v.verifier.displayName }
      }))
    }));
  }

  async listVerifications(
    choreInstanceId: string
  ): Promise<(ChoreVerificationRecord & { verifier: { id: string; displayName: string } })[]> {
    const rows = await this.db.choreVerification.findMany({
      where: { choreInstanceId },
      include: { verifier: { select: { id: true, displayName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((v) => ({
      id: v.id,
      choreInstanceId: v.choreInstanceId,
      verifierId: v.verifierId,
      decision: v.decision as ChoreVerificationRecord['decision'],
      feedback: v.feedback,
      verifiedAt: v.verifiedAt,
      createdAt: v.createdAt,
      verifier: { id: v.verifier.id, displayName: v.verifier.displayName }
    }));
  }
}
