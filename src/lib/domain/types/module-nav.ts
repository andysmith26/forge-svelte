import type { ClassroomSettings } from './classroom-settings';
import { MODULE_DEFINITIONS } from '$lib/domain/modules';
import type { Role } from './roles';

export type NavItem = {
  label: string;
  href: string;
};

export function getModuleNavItems(
  classroomId: string,
  settings: ClassroomSettings,
  role: Role
): NavItem[] {
  return Object.values(MODULE_DEFINITIONS)
    .filter((def) => {
      if (!def.navItem) return false;
      if (def.status === 'coming_soon') return false;
      if (!settings.modules[def.id]?.enabled) return false;
      if (def.visibleTo && !def.visibleTo.includes(role)) return false;
      return true;
    })
    .map((def) => ({
      label: def.navItem!.label,
      href: `/classroom/${classroomId}${def.navItem!.hrefSuffix}`
    }));
}
