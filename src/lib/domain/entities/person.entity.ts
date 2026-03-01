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
  readonly themeColor: string | null;
  readonly currentlyWorkingOn: string | null;
  readonly helpQueueVisible: boolean;
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
  get themeColor(): string | null {
    return this.props.themeColor;
  }
  get currentlyWorkingOn(): string | null {
    return this.props.currentlyWorkingOn;
  }
  get helpQueueVisible(): boolean {
    return this.props.helpQueueVisible;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  static create(props: PersonProps): PersonEntity {
    PersonEntity.validateDisplayName(props.displayName);
    PersonEntity.validateEmail(props.email);
    PersonEntity.validateSchoolId(props.schoolId);
    PersonEntity.validateAskMeAbout(props.askMeAbout);
    if (props.themeColor !== null) PersonEntity.validateThemeColor(props.themeColor);
    if (props.currentlyWorkingOn !== null)
      PersonEntity.validateCurrentlyWorkingOn(props.currentlyWorkingOn);

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

  static validateAskMeAbout(topics: readonly string[]): void {
    if (topics.length > 5) {
      throw new ValidationError('You can have at most 5 "ask me about" topics');
    }
  }

  static validateThemeColor(color: string): void {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      throw new ValidationError('Theme color must be a valid hex color (e.g. #4A90D9)');
    }
  }

  static validateCurrentlyWorkingOn(text: string): void {
    if (text.length > 200) {
      throw new ValidationError('"Currently working on" must be 200 characters or less');
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

  getInitialsContrastColor(): string {
    if (!this.props.themeColor) return '#1E40AF';
    const hex = this.props.themeColor.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  updateProfile(updates: {
    displayName?: string;
    pronouns?: string | null;
    askMeAbout?: readonly string[];
    themeColor?: string | null;
    currentlyWorkingOn?: string | null;
    helpQueueVisible?: boolean;
  }): PersonEntity {
    if (updates.displayName !== undefined) {
      PersonEntity.validateDisplayName(updates.displayName);
    }
    if (updates.askMeAbout !== undefined) {
      PersonEntity.validateAskMeAbout(updates.askMeAbout);
    }
    if (updates.themeColor !== undefined && updates.themeColor !== null) {
      PersonEntity.validateThemeColor(updates.themeColor);
    }
    if (updates.currentlyWorkingOn !== undefined && updates.currentlyWorkingOn !== null) {
      PersonEntity.validateCurrentlyWorkingOn(updates.currentlyWorkingOn);
    }

    return new PersonEntity({
      ...this.props,
      displayName: updates.displayName ?? this.props.displayName,
      pronouns: updates.pronouns !== undefined ? updates.pronouns : this.props.pronouns,
      askMeAbout:
        updates.askMeAbout !== undefined ? [...updates.askMeAbout] : this.props.askMeAbout,
      themeColor: updates.themeColor !== undefined ? updates.themeColor : this.props.themeColor,
      currentlyWorkingOn:
        updates.currentlyWorkingOn !== undefined
          ? updates.currentlyWorkingOn
          : this.props.currentlyWorkingOn,
      helpQueueVisible:
        updates.helpQueueVisible !== undefined
          ? updates.helpQueueVisible
          : this.props.helpQueueVisible
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
