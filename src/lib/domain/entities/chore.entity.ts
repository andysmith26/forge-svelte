import { ValidationError, ConflictError } from '$lib/domain/errors';

export type ChoreSize = 'small' | 'medium' | 'large';
export type ChoreRecurrence = 'one_time' | 'daily' | 'weekly';
export type ChoreVerificationType = 'self' | 'peer' | 'teacher';

export type ChoreProps = {
  readonly id: string;
  readonly schoolId: string;
  readonly name: string;
  readonly description: string;
  readonly size: ChoreSize;
  readonly estimatedMinutes: number | null;
  readonly recurrence: ChoreRecurrence;
  readonly verificationType: ChoreVerificationType;
  readonly location: string | null;
  readonly isActive: boolean;
  readonly createdById: string;
  readonly createdAt: Date;
};

export class ChoreEntity {
  private constructor(private readonly props: ChoreProps) {}

  get id(): string {
    return this.props.id;
  }
  get schoolId(): string {
    return this.props.schoolId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string {
    return this.props.description;
  }
  get size(): ChoreSize {
    return this.props.size;
  }
  get estimatedMinutes(): number | null {
    return this.props.estimatedMinutes;
  }
  get recurrence(): ChoreRecurrence {
    return this.props.recurrence;
  }
  get verificationType(): ChoreVerificationType {
    return this.props.verificationType;
  }
  get location(): string | null {
    return this.props.location;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }
  get createdById(): string {
    return this.props.createdById;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(props: ChoreProps): ChoreEntity {
    ChoreEntity.validateName(props.name);
    ChoreEntity.validateDescription(props.description);
    return new ChoreEntity(props);
  }

  static fromRecord(record: ChoreProps): ChoreEntity {
    return new ChoreEntity(record);
  }

  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Chore name is required');
    }
    if (name.trim().length > 100) {
      throw new ValidationError('Chore name must be 100 characters or less');
    }
  }

  static validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new ValidationError('Chore description is required');
    }
    if (description.length > 500) {
      throw new ValidationError('Chore description must be 500 characters or less');
    }
  }

  canArchive(): boolean {
    return this.isActive;
  }

  archive(): ChoreEntity {
    if (!this.canArchive()) {
      throw new ConflictError('Chore is already archived');
    }
    return new ChoreEntity({ ...this.props, isActive: false });
  }

  updateDetails(updates: {
    name?: string;
    description?: string;
    size?: ChoreSize;
    estimatedMinutes?: number | null;
    recurrence?: ChoreRecurrence;
    verificationType?: ChoreVerificationType;
    location?: string | null;
  }): ChoreEntity {
    if (updates.name !== undefined) ChoreEntity.validateName(updates.name);
    if (updates.description !== undefined) ChoreEntity.validateDescription(updates.description);
    return new ChoreEntity({
      ...this.props,
      name: updates.name ?? this.props.name,
      description: updates.description ?? this.props.description,
      size: updates.size ?? this.props.size,
      estimatedMinutes:
        updates.estimatedMinutes !== undefined
          ? updates.estimatedMinutes
          : this.props.estimatedMinutes,
      recurrence: updates.recurrence ?? this.props.recurrence,
      verificationType: updates.verificationType ?? this.props.verificationType,
      location: updates.location !== undefined ? updates.location : this.props.location
    });
  }

  toObject(): ChoreProps {
    return { ...this.props };
  }
}
