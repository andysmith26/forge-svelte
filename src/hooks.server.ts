import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { resolvePinSession } from '$lib/server/pinAuth';
import { isDemoMode, initEnvironment, getEnvironment } from '$lib/server/environment';

const initHandle: Handle = async ({ event, resolve }) => {
  await initEnvironment();
  return resolve(event);
};

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

/**
 * Demo mode hook: auto-authenticates as demo teacher,
 * but defers to PIN session if one exists (for student testing).
 */
const demoHandle: Handle = async ({ event, resolve }) => {
  const { DEMO_TEACHER_PERSON_ID } = await import('$lib/server/demo/seedData');
  const env = getEnvironment();

  // Try PIN session first (students)
  event.locals.pinSession = await resolvePinSession(event, env.pinRepo);

  if (event.locals.pinSession) {
    event.locals.actor = {
      personId: event.locals.pinSession.personId,
      authType: 'pin',
      pinClassroomId: event.locals.pinSession.classroomId
    };
  } else {
    // Fallback: auto-auth as demo teacher
    event.locals.actor = {
      personId: DEMO_TEACHER_PERSON_ID,
      authType: 'google',
      pinClassroomId: null
    };
  }

  event.locals.session = null;
  return resolve(event);
};

let handle: Handle;

if (isDemoMode) {
  handle = sequence(initHandle, demoHandle);
} else {
  const { authHandle } = await import('$lib/server/auth');
  handle = sequence(initHandle, authHandle, pinAndActorHandle);
}

export { handle };
