import type { LayoutServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getClassroom } from '$lib/application/useCases/classroom/getClassroom';
import { getClassroomSettings } from '$lib/application/useCases/classroom/getClassroomSettings';
import { getCurrentSession } from '$lib/application/useCases/session/getCurrentSession';
import { requireMember } from '$lib/application/useCases/checkAuthorization';

export const load: LayoutServerLoad = async ({ locals, params }) => {
  if (!locals.actor) {
    redirect(302, '/auth/signin');
  }

  const env = getEnvironment();
  const classroomId = params.classroomId;

  const membershipResult = await requireMember(
    { classroomRepo: env.classroomRepo },
    locals.actor.personId,
    classroomId
  );

  if (membershipResult.status === 'err') {
    if (membershipResult.error.type === 'NOT_MEMBER') {
      error(403, { message: 'You are not a member of this classroom' });
    }
    redirect(302, '/auth/signin');
  }

  const classroomResult = await getClassroom(
    { classroomRepo: env.classroomRepo },
    { classroomId }
  );

  if (classroomResult.status === 'err') {
    error(404, { message: 'Classroom not found' });
  }

  const settingsResult = await getClassroomSettings(
    { classroomRepo: env.classroomRepo },
    { classroomId }
  );

  const sessionResult = await getCurrentSession(
    { sessionRepo: env.sessionRepo },
    { classroomId }
  );

  return {
    classroom: {
      id: classroomResult.value.id,
      name: classroomResult.value.name,
      displayCode: classroomResult.value.displayCode
    },
    membership: {
      role: membershipResult.value.role
    },
    settings: settingsResult.status === 'ok' ? settingsResult.value : null,
    currentSession:
      sessionResult.status === 'ok' && sessionResult.value
        ? {
            id: sessionResult.value.id,
            name: sessionResult.value.name,
            status: sessionResult.value.status,
            actualStartAt: sessionResult.value.actualStartAt?.toISOString() ?? null,
            actualEndAt: sessionResult.value.actualEndAt?.toISOString() ?? null
          }
        : null,
    actor: locals.actor
  };
};
