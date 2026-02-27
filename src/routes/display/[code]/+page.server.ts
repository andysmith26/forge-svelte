import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { getPublicCurrentSession } from '$lib/application/useCases/session/getPublicCurrentSession';
import { getClassroomSettings } from '$lib/application/useCases/classroom/getClassroomSettings';
import {
  presenceSmartboardProvider,
  helpSmartboardProvider,
  type PresencePanelData,
  type HelpPanelData
} from '$lib/application/smartboard';

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

  let present: PresencePanelData = [];
  let queue: HelpPanelData['queue'] = [];
  let ninjaAssignments: HelpPanelData['ninjaAssignments'] = [];

  if (session && session.status === 'active') {
    if (presenceEnabled) {
      present = await presenceSmartboardProvider.fetchData(
        { presenceRepo: env.presenceRepo },
        session.id
      );
    }

    if (helpEnabled) {
      const helpData = await helpSmartboardProvider.fetchData(
        {
          helpRepo: env.helpRepo,
          ninjaRepo: env.ninjaRepo,
          sessionRepo: env.sessionRepo,
          presenceRepo: env.presenceRepo
        },
        session.id
      );
      queue = helpData.queue;
      ninjaAssignments = helpData.ninjaAssignments;
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
