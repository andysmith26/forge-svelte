import { ValidationError } from '$lib/domain/errors';

export type PersonProps = {
  readonly id: string;
  readonly schoolId: string;
  readonly email: string | null;
  readonly legalName: string;
  readonly displayName: string;
  readonly pronouns: string | null;
  readonly gradeLevel: string | null;
  readonly askMeAbout: readonly string[];
  readonly isActive: boolean;
};

export class PersonEntity {
  private constructor(private readonly props: PersonProps) {}

  get id(): string {
    return this.props.id;
  }
  get schoolId(): string {
    return this.props.schoolId;
  }
  get email(): string | null {
    return this.props.email;
  }
  get legalName(): string {
    return this.props.legalName;
  }
  get displayName(): string {
    return this.props.displayName;
  }
  get pronouns(): string | null {
    return this.props.pronouns;
  }
  get gradeLevel(): string | null {
    return this.props.gradeLevel;
  }
  get askMeAbout(): readonly string[] {
    return this.props.askMeAbout;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  static create(props: PersonProps): PersonEntity {
    PersonEntity.validateDisplayName(props.displayName);
    PersonEntity.validateEmail(props.email);
    PersonEntity.validateSchoolId(props.schoolId);

    return new PersonEntity({
      ...props,
      askMeAbout: [...props.askMeAbout]
    });
  }

  static fromRecord(record: PersonProps): PersonEntity {
    return new PersonEntity({
      ...record,
      askMeAbout: [...record.askMeAbout]
    });
  }

  static validateDisplayName(displayName: string): void {
    if (!displayName || displayName.trim().length === 0) {
      throw new ValidationError('Display name is required');
    }
    if (displayName.trim().length > 100) {
      throw new ValidationError('Display name must be 100 characters or less');
    }
  }

  static validateEmail(email: string | null): void {
    if (email === null) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  static validateSchoolId(schoolId: string): void {
    if (!schoolId || schoolId.trim().length === 0) {
      throw new ValidationError('School ID is required');
    }
  }

  canSignIn(): boolean {
    return this.isActive;
  }

  hasPinConfigured(): boolean {
    return true;
  }

  getPublicDisplayName(): string {
    return this.displayName;
  }

  updateProfile(updates: {
    displayName?: string;
    pronouns?: string | null;
    askMeAbout?: readonly string[];
  }): PersonEntity {
    if (updates.displayName !== undefined) {
      PersonEntity.validateDisplayName(updates.displayName);
    }

    return new PersonEntity({
      ...this.props,
      displayName: updates.displayName ?? this.props.displayName,
      pronouns: updates.pronouns !== undefined ? updates.pronouns : this.props.pronouns,
      askMeAbout:
        updates.askMeAbout !== undefined ? [...updates.askMeAbout] : this.props.askMeAbout
    });
  }

  deactivate(): PersonEntity {
    return new PersonEntity({
      ...this.props,
      isActive: false
    });
  }

  toObject(): PersonProps {
    return {
      ...this.props,
      askMeAbout: [...this.props.askMeAbout]
    };
  }
}
