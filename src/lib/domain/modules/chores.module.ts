import type { ModuleDefinition } from '$lib/domain/types/classroom-settings';

export const choresModule: ModuleDefinition = {
  id: 'chores',
  name: 'Chores',
  description: 'Classroom task management and verification',
  navItem: { label: 'Chores', hrefSuffix: '/chores' },
  status: 'coming_soon',
  defaultEnabled: false
};
