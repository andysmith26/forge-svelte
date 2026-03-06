import type {
  ChoreSize,
  ChoreRecurrence,
  ChoreVerificationType
} from '$lib/domain/entities/chore.entity';

export type ChoreRecord = {
  id: string;
  schoolId: string;
  name: string;
  description: string;
  size: ChoreSize;
  estimatedMinutes: number | null;
  recurrence: ChoreRecurrence;
  verificationType: ChoreVerificationType;
  location: string | null;
  isActive: boolean;
  createdById: string;
  createdAt: Date;
};

export type ChoreInstanceRecord = {
  id: string;
  choreId: string;
  sessionId: string | null;
  status: 'available' | 'claimed' | 'completed' | 'verified' | 'redo_requested' | 'archived';
  dueDate: Date | null;
  claimedById: string | null;
  claimedAt: Date | null;
  completedAt: Date | null;
  completionNotes: string | null;
  createdAt: Date;
};

export type ChoreVerificationRecord = {
  id: string;
  choreInstanceId: string;
  verifierId: string;
  decision: 'approved' | 'redo_requested';
  feedback: string | null;
  verifiedAt: Date;
  createdAt: Date;
};

export type ChoreInstanceWithRelations = ChoreInstanceRecord & {
  chore: { id: string; name: string; verificationType: ChoreVerificationType };
  claimedBy: { id: string; displayName: string } | null;
  verifications: (ChoreVerificationRecord & {
    verifier: { id: string; displayName: string };
  })[];
};

export type ChoreListItem = ChoreRecord & {
  activeInstanceCount: number;
};

export interface ChoreRepository {
  // Chore CRUD
  getById(id: string): Promise<ChoreRecord | null>;
  listBySchool(schoolId: string, includeArchived?: boolean): Promise<ChoreListItem[]>;
  findByName(schoolId: string, name: string): Promise<ChoreRecord | null>;

  // Instances
  getInstanceById(id: string): Promise<ChoreInstanceRecord | null>;
  getInstanceWithRelations(id: string): Promise<ChoreInstanceWithRelations | null>;
  listInstances(
    choreId: string,
    filters?: { status?: ChoreInstanceRecord['status'] }
  ): Promise<ChoreInstanceRecord[]>;
  listAvailableInstances(schoolId: string): Promise<ChoreInstanceWithRelations[]>;
  listClaimedByPerson(schoolId: string, personId: string): Promise<ChoreInstanceWithRelations[]>;
  listNeedingVerification(schoolId: string): Promise<ChoreInstanceWithRelations[]>;
  listRecentlyCompleted(schoolId: string, limit?: number): Promise<ChoreInstanceWithRelations[]>;

  // Verifications
  listVerifications(
    choreInstanceId: string
  ): Promise<(ChoreVerificationRecord & { verifier: { id: string; displayName: string } })[]>;
}
