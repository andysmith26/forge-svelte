import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { requireTeacher } from '$lib/application/useCases/checkAuthorization';
import { listSessionsWithStats } from '$lib/application/useCases/session/listSessionsWithStats';

export const load: PageServerLoad = async ({ locals, params }) => {
  const env = getEnvironment();
  const actor = locals.actor!;

  const authResult = await requireTeacher(
    { classroomRepo: env.classroomRepo },
    actor.personId,
    params.classroomId
  );
  if (authResult.status === 'err') {
    error(403, { message: 'Teachers only' });
  }

  const result = await listSessionsWithStats(
    {
      sessionRepo: env.sessionRepo,
      presenceRepo: env.presenceRepo,
      helpRepo: env.helpRepo
    },
    { classroomId: params.classroomId }
  );

  return {
    sessions: result.status === 'ok' ? result.value : []
  };
};
