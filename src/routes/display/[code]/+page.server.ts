import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getPublicCurrentSession } from '$lib/application/useCases/session/getPublicCurrentSession';
import { getClassroomSettings } from '$lib/application/useCases/classroom/getClassroomSettings';
import { listPresentPublic } from '$lib/application/useCases/presence/listPresentPublic';
import { getHelpQueuePublic } from '$lib/application/useCases/help/getHelpQueuePublic';
import { getNinjaPresence } from '$lib/application/useCases/ninja/getNinjaPresence';

export const load: PageServerLoad = async ({ params }) => {
  const env = getEnvironment();

  const classroom = await env.classroomRepo.getByDisplayCode(params.code);
  if (!classroom) {
    error(404, { message: 'Classroom not found' });
  }

  const settingsResult = await getClassroomSettings(
    { classroomRepo: env.classroomRepo },
    { classroomId: classroom.id }
  );

  const sessionResult = await getPublicCurrentSession(
    { sessionRepo: env.sessionRepo },
    { classroomId: classroom.id }
  );

  const session =
    sessionResult.status === 'ok' && sessionResult.value
      ? {
          id: sessionResult.value.id,
          name: sessionResult.value.name,
          status: sessionResult.value.status,
          classroomName: sessionResult.value.classroom.name
        }
      : null;

  const settings = settingsResult.status === 'ok' ? settingsResult.value : null;
  const presenceEnabled = settings?.modules.presence?.enabled ?? false;
  const helpEnabled = settings?.modules.help?.enabled ?? false;

  let present: {
    id: string;
    displayName: string;
    pronouns: string | null;
    askMeAbout: string[];
  }[] = [];
  let queue: {
    id: string;
    description: string;
    urgency: string;
    status: string;
    createdAt: string;
    requester: { id: string; displayName: string };
    category: { id: string; name: string } | null;
    claimedBy: { id: string; displayName: string } | null;
  }[] = [];
  let ninjaAssignments: { personId: string; domainName: string }[] = [];

  if (session && session.status === 'active') {
    if (presenceEnabled) {
      const presentResult = await listPresentPublic(
        { presenceRepo: env.presenceRepo },
        { sessionId: session.id }
      );
      if (presentResult.status === 'ok') {
        present = presentResult.value.map((p) => ({
          id: p.id,
          displayName: p.displayName,
          pronouns: p.pronouns,
          askMeAbout: p.askMeAbout
        }));
      }

      const ninjaResult = await getNinjaPresence(
        { ninjaRepo: env.ninjaRepo, sessionRepo: env.sessionRepo, presenceRepo: env.presenceRepo },
        { sessionId: session.id }
      );
      if (ninjaResult.status === 'ok') {
        ninjaAssignments = ninjaResult.value.map((a) => ({
          personId: a.personId,
          domainName: a.ninjaDomain.name
        }));
      }
    }

    if (helpEnabled) {
      const queueResult = await getHelpQueuePublic(
        { helpRepo: env.helpRepo },
        { sessionId: session.id }
      );
      if (queueResult.status === 'ok') {
        queue = queueResult.value.map((item) => ({
          id: item.id,
          description: item.description,
          urgency: item.urgency,
          status: item.status,
          createdAt: item.createdAt.toISOString(),
          requester: item.requester,
          category: item.category,
          claimedBy: item.claimedBy
        }));
      }
    }
  }

  return {
    classroom: { name: classroom.name, displayCode: classroom.displayCode },
    session,
    settings: { presenceEnabled, helpEnabled },
    present,
    queue,
    ninjaAssignments
  };
};
