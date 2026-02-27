import type { ModuleDefinition } from '$lib/domain/types/classroom-settings';

export const profileModule: ModuleDefinition = {
  id: 'profile',
  name: 'Profile',
  description: 'Students customize their profile and self-presentation',
  navItem: { label: 'Profile', hrefSuffix: '/profile' },
  status: 'available',
  defaultEnabled: false
};
