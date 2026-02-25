export { ProjectorRegistry } from './base';
export type { Projector } from './base';
export { SessionProjector } from './SessionProjector';
export { SignInProjector } from './SignInProjector';
export { HelpRequestProjector } from './HelpRequestProjector';

import { ProjectorRegistry } from './base';
import { SessionProjector } from './SessionProjector';
import { SignInProjector } from './SignInProjector';
import { HelpRequestProjector } from './HelpRequestProjector';

/**
 * Create a fully configured ProjectorRegistry with all projectors.
 * Registration order matters for foreign key constraints:
 * Session → SignIn → HelpRequest (clear runs in reverse).
 */
export function createProjectorRegistry(): ProjectorRegistry {
  const registry = new ProjectorRegistry();
  registry.register(new SessionProjector());
  registry.register(new SignInProjector());
  registry.register(new HelpRequestProjector());
  return registry;
}
