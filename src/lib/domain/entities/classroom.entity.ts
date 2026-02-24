import { ValidationError } from '$lib/domain/errors';
import type { ClassroomSettings, ClassroomModule } from '$lib/domain/types/classroom-settings';
import {
  parseClassroomSettings,
  isValidClassroomSettings,
  DEFAULT_CLASSROOM_SETTINGS
} from '$lib/domain/types/classroom-settings';

export type ClassroomProps = {
  readonly id: string;
  readonly schoolId: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string | null;
  readonly displayCode: string;
  readonly settings: ClassroomSettings;
  readonly isActive: boolean;
};

export class ClassroomEntity {
  private constructor(private readonly props: ClassroomProps) {}

  get id(): string {
    return this.props.id;
  }
  get schoolId(): string {
    return this.props.schoolId;
  }
  get name(): string {
    return this.props.name;
  }
  get slug(): string {
    return this.props.slug;
  }
  get description(): string | null {
    return this.props.description;
  }
  get displayCode(): string {
    return this.props.displayCode;
  }
  get settings(): ClassroomSettings {
    return this.props.settings;
  }
  get isActive(): boolean {
    return this.props.isActive;
  }

  static create(props: ClassroomProps): ClassroomEntity {
    ClassroomEntity.validateName(props.name);
    ClassroomEntity.validateSchoolId(props.schoolId);
    ClassroomEntity.validateDisplayCode(props.displayCode);
    ClassroomEntity.validateSlug(props.slug);

    return new ClassroomEntity(props);
  }

  static fromRecord(record: {
    id: string;
    schoolId: string;
    name: string;
    slug: string;
    description: string | null;
    displayCode: string;
    settings: unknown;
    isActive: boolean;
  }): ClassroomEntity {
    return new ClassroomEntity({
      ...record,
      settings: parseClassroomSettings(record.settings)
    });
  }

  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Classroom name is required');
    }
    if (name.length > 100) {
      throw new ValidationError('Classroom name must be 100 characters or less');
    }
  }

  static validateSchoolId(schoolId: string): void {
    if (!schoolId || schoolId.trim().length === 0) {
      throw new ValidationError('School ID is required');
    }
  }

  static validateDisplayCode(displayCode: string): void {
    if (!displayCode || displayCode.length !== 6) {
      throw new ValidationError('Display code must be exactly 6 characters');
    }
    if (!/^[A-Z0-9]+$/.test(displayCode)) {
      throw new ValidationError('Display code must be uppercase alphanumeric');
    }
  }

  static validateSlug(slug: string): void {
    if (!slug || slug.trim().length === 0) {
      throw new ValidationError('Slug is required');
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new ValidationError('Slug must be lowercase alphanumeric with hyphens only');
    }
  }

  static validateSettings(settings: unknown): ClassroomSettings {
    if (!isValidClassroomSettings(settings)) {
      throw new ValidationError('Invalid classroom settings format');
    }
    return settings;
  }

  isModuleEnabled(module: ClassroomModule): boolean {
    return this.settings.modules[module]?.enabled ?? false;
  }

  getEnabledModules(): ClassroomModule[] {
    return (Object.keys(this.settings.modules) as ClassroomModule[]).filter((module) =>
      this.isModuleEnabled(module)
    );
  }

  hasPresenceEnabled(): boolean {
    return this.isModuleEnabled('presence');
  }

  hasHelpEnabled(): boolean {
    return this.isModuleEnabled('help');
  }

  hasProjectsEnabled(): boolean {
    return this.isModuleEnabled('projects');
  }

  hasChoresEnabled(): boolean {
    return this.isModuleEnabled('chores');
  }

  setModuleEnabled(module: ClassroomModule, enabled: boolean): ClassroomEntity {
    const newSettings: ClassroomSettings = {
      ...this.settings,
      modules: {
        ...this.settings.modules,
        [module]: { enabled }
      }
    };

    return new ClassroomEntity({
      ...this.props,
      settings: newSettings
    });
  }

  updateSettings(settings: ClassroomSettings): ClassroomEntity {
    ClassroomEntity.validateSettings(settings);

    return new ClassroomEntity({
      ...this.props,
      settings
    });
  }

  updateInfo(updates: { name?: string; description?: string | null }): ClassroomEntity {
    if (updates.name !== undefined) {
      ClassroomEntity.validateName(updates.name);
    }

    return new ClassroomEntity({
      ...this.props,
      name: updates.name ?? this.props.name,
      description: updates.description !== undefined ? updates.description : this.props.description
    });
  }

  deactivate(): ClassroomEntity {
    return new ClassroomEntity({
      ...this.props,
      isActive: false
    });
  }

  getSmartboardPath(): string {
    return `/display/${this.displayCode}`;
  }

  toObject(): ClassroomProps {
    return { ...this.props };
  }

  toRecord(): Omit<ClassroomProps, 'settings'> & { settings: unknown } {
    return {
      ...this.props,
      settings: this.props.settings as unknown
    };
  }
}
