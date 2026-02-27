import type { ModuleDefinition } from '$lib/domain/types/classroom-settings';

export const presenceModule: ModuleDefinition = {
  id: 'presence',
  name: 'Presence',
  description: "Track who's here during class sessions",
  navItem: { label: 'Presence', hrefSuffix: '/presence' },
  smartboardPanel: true,
  status: 'available',
  defaultEnabled: true
};
