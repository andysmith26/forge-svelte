import { ValidationError } from '$lib/domain/errors';

export type NinjaDomainProps = {
  readonly id: string;
  readonly classroomId: string;
  readonly name: string;
  readonly description: string | null;
  readonly displayOrder: number;
  readonly isActive: boolean;
};

export class NinjaDomainEntity {
  private constructor(private readonly props: NinjaDomainProps) {}

  get id(): string {
    return this.props.id;
  }
  get classroomId(): string {
    return this.props.classroomId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get displayOrder(): number {
    return this.props.displayOrder;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  static create(props: NinjaDomainProps): NinjaDomainEntity {
    NinjaDomainEntity.validateName(props.name);
    NinjaDomainEntity.validateClassroomId(props.classroomId);
    NinjaDomainEntity.validateDisplayOrder(props.displayOrder);

    return new NinjaDomainEntity(props);
  }

  static fromRecord(record: NinjaDomainProps): NinjaDomainEntity {
    return new NinjaDomainEntity(record);
  }

  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Domain name is required');
    }
    if (name.length > 100) {
      throw new ValidationError('Domain name must be 100 characters or less');
    }
  }

  static validateClassroomId(classroomId: string): void {
    if (!classroomId || classroomId.trim().length === 0) {
      throw new ValidationError('Classroom ID is required');
    }
  }

  static validateDisplayOrder(displayOrder: number): void {
    if (displayOrder < 0) {
      throw new ValidationError('Display order must be non-negative');
    }
    if (!Number.isInteger(displayOrder)) {
      throw new ValidationError('Display order must be an integer');
    }
  }

  canHaveAssignments(): boolean {
    return this.isActive;
  }

  updateInfo(updates: { name?: string; description?: string | null }): NinjaDomainEntity {
    if (updates.name !== undefined) {
      NinjaDomainEntity.validateName(updates.name);
    }

    return new NinjaDomainEntity({
      ...this.props,
      name: updates.name ?? this.props.name,
      description: updates.description !== undefined ? updates.description : this.props.description
    });
  }

  reorder(displayOrder: number): NinjaDomainEntity {
    NinjaDomainEntity.validateDisplayOrder(displayOrder);

    return new NinjaDomainEntity({
      ...this.props,
      displayOrder
    });
  }

  archive(): NinjaDomainEntity {
    return new NinjaDomainEntity({
      ...this.props,
      isActive: false
    });
  }

  toObject(): NinjaDomainProps {
    return { ...this.props };
  }
}
