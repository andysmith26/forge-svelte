import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { requireTeacher } from '$lib/application/useCases/checkAuthorization';
import { getSessionAnalytics } from '$lib/application/useCases/session/getSessionAnalytics';

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

  const result = await getSessionAnalytics(
    {
      sessionRepo: env.sessionRepo,
      presenceRepo: env.presenceRepo,
      helpRepo: env.helpRepo,
      eventStore: env.eventStore
    },
    { sessionId: params.sessionId }
  );

  if (result.status === 'err') {
    if (result.error.type === 'SESSION_NOT_FOUND') {
      error(404, { message: 'Session not found' });
    }
    error(500, { message: 'Failed to load session analytics' });
  }

  return { analytics: result.value };
};
