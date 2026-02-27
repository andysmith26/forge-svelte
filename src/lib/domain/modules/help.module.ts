import type { ModuleDefinition } from '$lib/domain/types/classroom-settings';

export const helpModule: ModuleDefinition = {
  id: 'help',
  name: 'Help Queue & Ninjas',
  description: 'Peer help queue with ninja specializations',
  navItem: { label: 'Help', hrefSuffix: '/help' },
  smartboardPanel: true,
  status: 'available',
  defaultEnabled: false
};
