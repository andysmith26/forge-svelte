import type { Role } from './roles';

export const CLASSROOM_MODULES = {
  PRESENCE: 'presence',
  PROFILE: 'profile',
  HELP: 'help',
  PROJECTS: 'projects',
  CHORES: 'chores'
} as const;

export type ClassroomModule = (typeof CLASSROOM_MODULES)[keyof typeof CLASSROOM_MODULES];

export type ModuleConfig = {
  enabled: boolean;
};

export type ClassroomSettings = {
  modules: {
    [K in ClassroomModule]: ModuleConfig;
  };
};

export type ModuleDefinition = {
  id: ClassroomModule;
  name: string;
  description: string;
  navItem?: { label: string; hrefSuffix: string };
  smartboardPanel?: boolean;
  status: 'available' | 'coming_soon';
  defaultEnabled: boolean;
  /** Roles that can see the module nav item. undefined = all roles. */
  visibleTo?: Role[];
};

export const MODULE_DEFINITIONS: Record<ClassroomModule, ModuleDefinition> = {
  presence: {
    id: 'presence',
    name: 'Presence',
    description: "Track who's here during class sessions",
    navItem: { label: 'Presence', hrefSuffix: '/presence' },
    smartboardPanel: true,
    status: 'available',
    defaultEnabled: true
  },
  profile: {
    id: 'profile',
    name: 'Profile',
    description: 'Students customize their profile and self-presentation',
    navItem: { label: 'Profile', hrefSuffix: '/profile' },
    status: 'available',
    defaultEnabled: false
  },
  help: {
    id: 'help',
    name: 'Help Queue & Ninjas',
    description: 'Peer help queue with ninja specializations',
    navItem: { label: 'Help', hrefSuffix: '/help' },
    smartboardPanel: true,
    status: 'available',
    defaultEnabled: false
  },
  projects: {
    id: 'projects',
    name: 'Projects',
    description: 'Multi-session project tracking and handoffs',
    navItem: { label: 'Projects', hrefSuffix: '/projects' },
    status: 'coming_soon',
    defaultEnabled: false
  },
  chores: {
    id: 'chores',
    name: 'Chores',
    description: 'Classroom task management and verification',
    navItem: { label: 'Chores', hrefSuffix: '/chores' },
    status: 'coming_soon',
    defaultEnabled: false
  }
};

/** @deprecated Use MODULE_DEFINITIONS instead */
export const MODULE_INFO: Record<ClassroomModule, { name: string; description: string }> =
  Object.fromEntries(
    Object.entries(MODULE_DEFINITIONS).map(([key, def]) => [
      key,
      { name: def.name, description: def.description }
    ])
  ) as Record<ClassroomModule, { name: string; description: string }>;

export const DEFAULT_CLASSROOM_SETTINGS: ClassroomSettings = {
  modules: Object.fromEntries(
    Object.values(CLASSROOM_MODULES).map((mod) => [
      mod,
      { enabled: MODULE_DEFINITIONS[mod].defaultEnabled }
    ])
  ) as ClassroomSettings['modules']
};

export const EXISTING_CLASSROOM_SETTINGS: ClassroomSettings = {
  modules: {
    presence: { enabled: true },
    profile: { enabled: false },
    help: { enabled: true },
    projects: { enabled: false },
    chores: { enabled: false }
  }
};

const ALL_MODULE_KEYS = Object.values(CLASSROOM_MODULES);

export function isValidClassroomSettings(value: unknown): value is ClassroomSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Record<string, unknown>;

  if (!settings.modules || typeof settings.modules !== 'object') return false;

  const modules = settings.modules as Record<string, unknown>;

  return ALL_MODULE_KEYS.every(
    (key) => modules[key] && typeof (modules[key] as ModuleConfig).enabled === 'boolean'
  );
}

export function parseClassroomSettings(json: unknown): ClassroomSettings {
  if (!json || typeof json !== 'object') return DEFAULT_CLASSROOM_SETTINGS;
  const raw = json as Record<string, unknown>;

  if (!raw.modules || typeof raw.modules !== 'object') return DEFAULT_CLASSROOM_SETTINGS;

  const modules = raw.modules as Record<string, unknown>;
  const result: Record<string, ModuleConfig> = {};

  for (const mod of ALL_MODULE_KEYS) {
    const existing = modules[mod] as ModuleConfig | undefined;
    result[mod] =
      existing && typeof existing.enabled === 'boolean'
        ? existing
        : { enabled: MODULE_DEFINITIONS[mod].defaultEnabled };
  }

  return { modules: result as ClassroomSettings['modules'] };
}
