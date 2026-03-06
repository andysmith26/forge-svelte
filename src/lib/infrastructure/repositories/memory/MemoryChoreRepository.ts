import type {
  ChoreRepository,
  ChoreRecord,
  ChoreInstanceRecord,
  ChoreVerificationRecord,
  ChoreInstanceWithRelations,
  ChoreListItem
} from '$lib/application/ports/ChoreRepository';
import type { ChoreVerificationType } from '$lib/domain/entities/chore.entity';
import type { IdGenerator } from '$lib/application/ports';
import type { MemoryStore } from './MemoryStore';

export class MemoryChoreRepository implements ChoreRepository {
  constructor(
    private readonly store: MemoryStore,
    private readonly idGen: IdGenerator
  ) {}

  async getById(id: string): Promise<ChoreRecord | null> {
    return this.store.chores.get(id) ?? null;
  }

  async listBySchool(schoolId: string, includeArchived = false): Promise<ChoreListItem[]> {
    const chores = [...this.store.chores.values()]
      .filter((c) => c.schoolId === schoolId && (includeArchived || c.isActive))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return chores.map((c) => ({
      ...c,
      activeInstanceCount: [...this.store.choreInstances.values()].filter(
        (i) => i.choreId === c.id && i.status !== 'archived'
      ).length
    }));
  }

  async findByName(schoolId: string, name: string): Promise<ChoreRecord | null> {
    const lower = name.toLowerCase();
    for (const c of this.store.chores.values()) {
      if (c.schoolId === schoolId && c.name.toLowerCase() === lower && c.isActive) {
        return c;
      }
    }
    return null;
  }

  async getInstanceById(id: string): Promise<ChoreInstanceRecord | null> {
    return this.store.choreInstances.get(id) ?? null;
  }

  async getInstanceWithRelations(id: string): Promise<ChoreInstanceWithRelations | null> {
    const instance = this.store.choreInstances.get(id);
    if (!instance) return null;
    return this.toInstanceWithRelations(instance);
  }

  async listInstances(
    choreId: string,
    filters?: { status?: ChoreInstanceRecord['status'] }
  ): Promise<ChoreInstanceRecord[]> {
    return [...this.store.choreInstances.values()]
      .filter((i) => i.choreId === choreId && (!filters?.status || i.status === filters.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async listAvailableInstances(schoolId: string): Promise<ChoreInstanceWithRelations[]> {
    const schoolChoreIds = new Set(
      [...this.store.chores.values()]
        .filter((c) => c.schoolId === schoolId && c.isActive)
        .map((c) => c.id)
    );

    const instances = [...this.store.choreInstances.values()]
      .filter((i) => schoolChoreIds.has(i.choreId) && i.status === 'available')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return instances.map((i) => this.toInstanceWithRelations(i));
  }

  async listClaimedByPerson(
    schoolId: string,
    personId: string
  ): Promise<ChoreInstanceWithRelations[]> {
    const schoolChoreIds = new Set(
      [...this.store.chores.values()].filter((c) => c.schoolId === schoolId).map((c) => c.id)
    );

    const instances = [...this.store.choreInstances.values()]
      .filter(
        (i) =>
          schoolChoreIds.has(i.choreId) &&
          i.claimedById === personId &&
          ['claimed', 'completed', 'redo_requested'].includes(i.status)
      )
      .sort((a, b) => (b.claimedAt?.getTime() ?? 0) - (a.claimedAt?.getTime() ?? 0));

    return instances.map((i) => this.toInstanceWithRelations(i));
  }

  async listNeedingVerification(schoolId: string): Promise<ChoreInstanceWithRelations[]> {
    const peerTeacherChoreIds = new Set(
      [...this.store.chores.values()]
        .filter(
          (c) =>
            c.schoolId === schoolId &&
            (c.verificationType === 'peer' || c.verificationType === 'teacher')
        )
        .map((c) => c.id)
    );

    const instances = [...this.store.choreInstances.values()]
      .filter((i) => peerTeacherChoreIds.has(i.choreId) && i.status === 'completed')
      .sort((a, b) => (a.completedAt?.getTime() ?? 0) - (b.completedAt?.getTime() ?? 0));

    return instances.map((i) => this.toInstanceWithRelations(i));
  }

  async listRecentlyCompleted(schoolId: string, limit = 10): Promise<ChoreInstanceWithRelations[]> {
    const schoolChoreIds = new Set(
      [...this.store.chores.values()].filter((c) => c.schoolId === schoolId).map((c) => c.id)
    );

    const instances = [...this.store.choreInstances.values()]
      .filter((i) => schoolChoreIds.has(i.choreId) && i.status === 'verified')
      .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
      .slice(0, limit);

    return instances.map((i) => this.toInstanceWithRelations(i));
  }

  async listVerifications(
    choreInstanceId: string
  ): Promise<(ChoreVerificationRecord & { verifier: { id: string; displayName: string } })[]> {
    return [...this.store.choreVerifications.values()]
      .filter((v) => v.choreInstanceId === choreInstanceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((v) => {
        const person = this.store.persons.get(v.verifierId);
        return {
          ...v,
          verifier: { id: v.verifierId, displayName: person?.displayName ?? 'Unknown' }
        };
      });
  }

  private toInstanceWithRelations(instance: ChoreInstanceRecord): ChoreInstanceWithRelations {
    const chore = this.store.chores.get(instance.choreId)!;
    const claimedBy = instance.claimedById ? this.store.persons.get(instance.claimedById) : null;
    const verifications = [...this.store.choreVerifications.values()]
      .filter((v) => v.choreInstanceId === instance.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((v) => {
        const person = this.store.persons.get(v.verifierId);
        return {
          ...v,
          verifier: { id: v.verifierId, displayName: person?.displayName ?? 'Unknown' }
        };
      });

    return {
      ...instance,
      chore: {
        id: chore.id,
        name: chore.name,
        verificationType: chore.verificationType as ChoreVerificationType
      },
      claimedBy: claimedBy ? { id: claimedBy.id, displayName: claimedBy.displayName } : null,
      verifications
    };
  }
}
