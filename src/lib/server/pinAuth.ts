import type { RequestEvent } from '@sveltejs/kit';
import type { PinRepository } from '$lib/application/ports';

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
 *
 * When pinRepo is provided, uses it instead of Prisma directly (for demo mode).
 */
export async function resolvePinSession(
  event: RequestEvent,
  pinRepo?: PinRepository
): Promise<PinSessionData | null> {
  const token = event.cookies.get(PIN_SESSION_COOKIE);
  if (!token) return null;

  if (pinRepo) {
    return resolvePinSessionFromRepo(event, token, pinRepo);
  }

  return resolvePinSessionFromPrisma(event, token);
}

async function resolvePinSessionFromRepo(
  event: RequestEvent,
  token: string,
  pinRepo: PinRepository
): Promise<PinSessionData | null> {
  const session = await pinRepo.getPinSessionByToken(token);
  if (!session) return null;

  const now = new Date();

  if (session.expiresAt < now) {
    await pinRepo.deletePinSession(token);
    event.cookies.delete(PIN_SESSION_COOKIE, { path: '/' });
    return null;
  }

  const inactivityThreshold = new Date(now.getTime() - INACTIVITY_TIMEOUT_MS);
  if (session.lastActivityAt < inactivityThreshold) {
    await pinRepo.deletePinSession(token);
    event.cookies.delete(PIN_SESSION_COOKIE, { path: '/' });
    return null;
  }

  const shouldRefresh =
    now.getTime() - session.lastActivityAt.getTime() > ACTIVITY_REFRESH_INTERVAL_MS;
  if (shouldRefresh) {
    await pinRepo.touchPinSession(token, now);
  }

  return {
    personId: session.personId,
    classroomId: session.classroomId,
    displayName: session.displayName
  };
}

async function resolvePinSessionFromPrisma(
  event: RequestEvent,
  token: string
): Promise<PinSessionData | null> {
  const { prisma } = await import('./prisma');

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

  if (session.expiresAt < now) {
    await prisma.pinSession.delete({ where: { token } }).catch(() => {});
    event.cookies.delete(PIN_SESSION_COOKIE, { path: '/' });
    return null;
  }

  const inactivityThreshold = new Date(now.getTime() - INACTIVITY_TIMEOUT_MS);
  if (session.lastActivityAt < inactivityThreshold) {
    await prisma.pinSession.delete({ where: { token } }).catch(() => {});
    event.cookies.delete(PIN_SESSION_COOKIE, { path: '/' });
    return null;
  }

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
