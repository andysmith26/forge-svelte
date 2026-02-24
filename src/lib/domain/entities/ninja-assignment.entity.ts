import { ValidationError, ConflictError } from '$lib/domain/errors';

export type NinjaAssignmentProps = {
  readonly id: string;
  readonly personId: string;
  readonly ninjaDomainId: string;
  readonly assignedById: string;
  readonly isActive: boolean;
  readonly assignedAt: Date;
  readonly revokedAt: Date | null;
};

export class NinjaAssignmentEntity {
  private constructor(private readonly props: NinjaAssignmentProps) {}

  get id(): string {
    return this.props.id;
  }
  get personId(): string {
    return this.props.personId;
  }
  get ninjaDomainId(): string {
    return this.props.ninjaDomainId;
  }
  get assignedById(): string {
    return this.props.assignedById;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get assignedAt(): Date {
    return this.props.assignedAt;
  }
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  static create(props: NinjaAssignmentProps): NinjaAssignmentEntity {
    NinjaAssignmentEntity.validatePersonId(props.personId);
    NinjaAssignmentEntity.validateNinjaDomainId(props.ninjaDomainId);
    NinjaAssignmentEntity.validateAssignedById(props.assignedById);

    return new NinjaAssignmentEntity(props);
  }

  static fromRecord(record: NinjaAssignmentProps): NinjaAssignmentEntity {
    return new NinjaAssignmentEntity(record);
  }

  static createAssignment(
    id: string,
    personId: string,
    ninjaDomainId: string,
    assignedById: string,
    assignedAt: Date = new Date()
  ): NinjaAssignmentEntity {
    return NinjaAssignmentEntity.create({
      id,
      personId,
      ninjaDomainId,
      assignedById,
      isActive: true,
      assignedAt,
      revokedAt: null
    });
  }

  static validatePersonId(personId: string): void {
    if (!personId || personId.trim().length === 0) {
      throw new ValidationError('Person ID is required');
    }
  }

  static validateNinjaDomainId(ninjaDomainId: string): void {
    if (!ninjaDomainId || ninjaDomainId.trim().length === 0) {
      throw new ValidationError('Ninja domain ID is required');
    }
  }

  static validateAssignedById(assignedById: string): void {
    if (!assignedById || assignedById.trim().length === 0) {
      throw new ValidationError('Assigned by ID is required');
    }
  }

  isCurrentlyActive(): boolean {
    return this.isActive && this.revokedAt === null;
  }

  canRevoke(): boolean {
    return this.isActive && this.revokedAt === null;
  }

  canReactivate(): boolean {
    return !this.isActive || this.revokedAt !== null;
  }

  revoke(revokedAt: Date = new Date()): NinjaAssignmentEntity {
    if (!this.canRevoke()) {
      throw new ConflictError('Assignment is already revoked');
    }

    return new NinjaAssignmentEntity({
      ...this.props,
      isActive: false,
      revokedAt
    });
  }

  reactivate(assignedById: string, assignedAt: Date = new Date()): NinjaAssignmentEntity {
    if (!this.canReactivate()) {
      throw new ConflictError('Assignment is already active');
    }

    return new NinjaAssignmentEntity({
      ...this.props,
      assignedById,
      assignedAt,
      isActive: true,
      revokedAt: null
    });
  }

  getDurationDays(): number {
    const endTime = this.revokedAt ?? new Date();
    const milliseconds = endTime.getTime() - this.assignedAt.getTime();
    return Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  }

  toObject(): NinjaAssignmentProps {
    return { ...this.props };
  }
}
