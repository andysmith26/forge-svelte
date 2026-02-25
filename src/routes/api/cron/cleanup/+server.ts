import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';

export const POST: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const [expiredSessions, oldEvents, oldNotifications] = await Promise.all([
    prisma.pinSession.deleteMany({
      where: { expiresAt: { lt: now } }
    }),
    prisma.domainEvent.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }
    }),
    prisma.realtimeNotification.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
    })
  ]);

  return json({
    cleaned: {
      expiredPinSessions: expiredSessions.count,
      oldEvents: oldEvents.count,
      oldNotifications: oldNotifications.count
    }
  });
};
