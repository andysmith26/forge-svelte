import type { RequestEvent } from '@sveltejs/kit';
import { prisma } from './prisma';

const PIN_SESSION_COOKIE = 'forge_pin_session';
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export interface PinSessionData {
  personId: string;
  classroomId: string;
  displayName: string;
}

/**
 * Resolve the PIN session from the request cookie.
 * Returns null if no valid PIN session exists.
 * Touches lastActivityAt if stale (throttled to every 5 minutes).
 */
export async function resolvePinSession(event: RequestEvent): Promise<PinSessionData | null> {
  const token = event.cookies.get(PIN_SESSION_COOKIE);
  if (!token) return null;

  const session = await prisma.pinSession.findUnique({
    where: { token },
    include: {
      person: {
        select: { id: true, displayName: true }
      }
    }
  });

  if (!session) return null;

  const now = new Date();

  // Check absolute expiry
  if (session.expiresAt < now) {
    await prisma.pinSession.delete({ where: { token } }).catch(() => {});
    event.cookies.delete(PIN_SESSION_COOKIE, { path: '/' });
    return null;
  }

  // Check inactivity timeout
  const inactivityThreshold = new Date(now.getTime() - INACTIVITY_TIMEOUT_MS);
  if (session.lastActivityAt < inactivityThreshold) {
    await prisma.pinSession.delete({ where: { token } }).catch(() => {});
    event.cookies.delete(PIN_SESSION_COOKIE, { path: '/' });
    return null;
  }

  // Throttled activity refresh
  const shouldRefresh =
    now.getTime() - session.lastActivityAt.getTime() > ACTIVITY_REFRESH_INTERVAL_MS;
  if (shouldRefresh) {
    await prisma.pinSession.update({
      where: { token },
      data: { lastActivityAt: now }
    });
  }

  return {
    personId: session.personId,
    classroomId: session.classroomId,
    displayName: session.person.displayName
  };
}

export { PIN_SESSION_COOKIE };
