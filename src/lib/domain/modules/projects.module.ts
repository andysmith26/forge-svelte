import type { ModuleDefinition } from '$lib/domain/types/classroom-settings';

export const projectsModule: ModuleDefinition = {
  id: 'projects',
  name: 'Projects',
  description: 'Multi-session project tracking and handoffs',
  navItem: { label: 'Projects', hrefSuffix: '/projects' },
  smartboardPanel: true,
  status: 'available',
  defaultEnabled: false
};
