import type { ClassroomModule, ModuleDefinition } from '$lib/domain/types/classroom-settings';
import { presenceModule } from './presence.module';
import { helpModule } from './help.module';
import { profileModule } from './profile.module';
import { projectsModule } from './projects.module';
import { choresModule } from './chores.module';

export const MODULE_DEFINITIONS: Record<ClassroomModule, ModuleDefinition> = {
  presence: presenceModule,
  help: helpModule,
  profile: profileModule,
  projects: projectsModule,
  chores: choresModule
};

/** @deprecated Use MODULE_DEFINITIONS instead */
export const MODULE_INFO: Record<ClassroomModule, { name: string; description: string }> =
  Object.fromEntries(
    Object.entries(MODULE_DEFINITIONS).map(([key, def]) => [
      key,
      { name: def.name, description: def.description }
    ])
  ) as Record<ClassroomModule, { name: string; description: string }>;
