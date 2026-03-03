import { ValidationError, ConflictError } from '$lib/domain/errors';

export type ProjectVisibility = 'browseable' | 'members_only';

export type ProjectProps = {
  readonly id: string;
  readonly schoolId: string;
  readonly name: string;
  readonly description: string | null;
  readonly isArchived: boolean;
  readonly visibility: ProjectVisibility;
  readonly createdById: string;
  readonly createdAt: Date;
};

export class ProjectEntity {
  private constructor(private readonly props: ProjectProps) {}

  get id(): string {
    return this.props.id;
  }
  get schoolId(): string {
    return this.props.schoolId;
  }
  get name(): string {
    return this.props.name;
  }
  get description(): string | null {
    return this.props.description;
  }
  get isArchived(): boolean {
    return this.props.isArchived;
  }
  get visibility(): ProjectVisibility {
    return this.props.visibility;
  }
  get createdById(): string {
    return this.props.createdById;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(props: ProjectProps): ProjectEntity {
    ProjectEntity.validateName(props.name);
    if (props.description !== null) {
      ProjectEntity.validateDescription(props.description);
    }
    return new ProjectEntity(props);
  }

  static fromRecord(record: ProjectProps): ProjectEntity {
    return new ProjectEntity(record);
  }

  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Project name is required');
    }
    if (name.trim().length > 100) {
      throw new ValidationError('Project name must be 100 characters or less');
    }
  }

  static validateDescription(description: string): void {
    if (description.length > 500) {
      throw new ValidationError('Project description must be 500 characters or less');
    }
  }

  canArchive(): boolean {
    return !this.isArchived;
  }

  canUnarchive(): boolean {
    return this.isArchived;
  }

  archive(): ProjectEntity {
    if (!this.canArchive()) {
      throw new ConflictError('Project is already archived');
    }
    return new ProjectEntity({ ...this.props, isArchived: true });
  }

  unarchive(): ProjectEntity {
    if (!this.canUnarchive()) {
      throw new ConflictError('Project is not archived');
    }
    return new ProjectEntity({ ...this.props, isArchived: false });
  }

  updateDetails(updates: {
    name?: string;
    description?: string | null;
    visibility?: ProjectVisibility;
  }): ProjectEntity {
    if (updates.name !== undefined) ProjectEntity.validateName(updates.name);
    if (updates.description !== undefined && updates.description !== null) {
      ProjectEntity.validateDescription(updates.description);
    }
    return new ProjectEntity({
      ...this.props,
      name: updates.name ?? this.props.name,
      description: updates.description !== undefined ? updates.description : this.props.description,
      visibility: updates.visibility ?? this.props.visibility
    });
  }

  toObject(): ProjectProps {
    return { ...this.props };
  }
}
