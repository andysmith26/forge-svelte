import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { authHandle } from '$lib/server/auth';
import { resolvePinSession } from '$lib/server/pinAuth';

const pinAndActorHandle: Handle = async ({ event, resolve }) => {
  // Resolve PIN session from cookie
  event.locals.pinSession = await resolvePinSession(event);

  // Resolve unified actor from either auth source
  const authSession = await event.locals.auth?.();
  if (authSession?.user) {
    event.locals.session = authSession as App.Locals['session'];
    const personId = (authSession.user as { personId?: string }).personId;
    if (personId) {
      event.locals.actor = {
        personId,
        authType: 'google',
        pinClassroomId: null
      };
    }
  } else if (event.locals.pinSession) {
    event.locals.actor = {
      personId: event.locals.pinSession.personId,
      authType: 'pin',
      pinClassroomId: event.locals.pinSession.classroomId
    };
  } else {
    event.locals.session = null;
    event.locals.actor = null;
  }

  return resolve(event);
};

export const handle = sequence(authHandle, pinAndActorHandle);
