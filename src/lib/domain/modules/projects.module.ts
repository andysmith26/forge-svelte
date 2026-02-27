import type { ModuleDefinition } from '$lib/domain/types/classroom-settings';

export const projectsModule: ModuleDefinition = {
  id: 'projects',
  name: 'Projects',
  description: 'Multi-session project tracking and handoffs',
  navItem: { label: 'Projects', hrefSuffix: '/projects' },
  status: 'coming_soon',
  defaultEnabled: false
};
