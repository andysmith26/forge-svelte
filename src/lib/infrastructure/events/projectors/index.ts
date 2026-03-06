export { ProjectorRegistry } from './base';
export type { Projector } from './base';
export { SessionProjector } from './SessionProjector';
export { SignInProjector } from './SignInProjector';
export { HelpRequestProjector } from './HelpRequestProjector';
export { ProjectProjector } from './ProjectProjector';
export { ChoreProjector } from './ChoreProjector';

import { ProjectorRegistry } from './base';
import { SessionProjector } from './SessionProjector';
import { SignInProjector } from './SignInProjector';
import { HelpRequestProjector } from './HelpRequestProjector';
import { ProjectProjector } from './ProjectProjector';
import { ChoreProjector } from './ChoreProjector';

/**
 * Create a fully configured ProjectorRegistry with all projectors.
 * Registration order matters for foreign key constraints:
 * Session → SignIn → HelpRequest → Project → Chore (clear runs in reverse).
 */
export function createProjectorRegistry(): ProjectorRegistry {
  const registry = new ProjectorRegistry();
  registry.register(new SessionProjector());
  registry.register(new SignInProjector());
  registry.register(new HelpRequestProjector());
  registry.register(new ProjectProjector());
  registry.register(new ChoreProjector());
  return registry;
}
