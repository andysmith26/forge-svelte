export const CLASSROOM_MODULES = {
  PRESENCE: 'presence',
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

export const DEFAULT_CLASSROOM_SETTINGS: ClassroomSettings = {
  modules: {
    presence: { enabled: true },
    help: { enabled: false },
    projects: { enabled: false },
    chores: { enabled: false }
  }
};

export const EXISTING_CLASSROOM_SETTINGS: ClassroomSettings = {
  modules: {
    presence: { enabled: true },
    help: { enabled: true },
    projects: { enabled: false },
    chores: { enabled: false }
  }
};

export function isValidClassroomSettings(value: unknown): value is ClassroomSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Record<string, unknown>;

  if (!settings.modules || typeof settings.modules !== 'object') return false;

  const modules = settings.modules as Record<string, unknown>;
  const requiredModules: ClassroomModule[] = ['presence', 'help', 'projects', 'chores'];

  return requiredModules.every(
    (key) => modules[key] && typeof (modules[key] as ModuleConfig).enabled === 'boolean'
  );
}

export function parseClassroomSettings(json: unknown): ClassroomSettings {
  if (isValidClassroomSettings(json)) {
    return json;
  }
  return DEFAULT_CLASSROOM_SETTINGS;
}

export const MODULE_INFO: Record<ClassroomModule, { name: string; description: string }> = {
  presence: {
    name: 'Presence',
    description: "Track who's here during class sessions"
  },
  help: {
    name: 'Help Queue & Ninjas',
    description: 'Peer help queue with ninja specializations'
  },
  projects: {
    name: 'Projects',
    description: 'Multi-session project tracking and handoffs'
  },
  chores: {
    name: 'Chores',
    description: 'Classroom task management and verification'
  }
};
