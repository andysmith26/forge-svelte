import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { getEnvironment, isDemoMode, getDemoStore } from '$lib/server/environment';
import { getCurrentSession } from '$lib/application/useCases/session/getCurrentSession';
import { listPresent } from '$lib/application/useCases/presence/listPresent';
import { getSignInStatus } from '$lib/application/useCases/presence/getSignInStatus';
import { signIn } from '$lib/application/useCases/presence/signIn';
import { signOut } from '$lib/application/useCases/presence/signOut';

type KioskStudent = {
  id: string;
  displayName: string;
  pronouns: string | null;
  isPresent: boolean;
  themeColor: string | null;
  hasPin: boolean;
};

export const load: PageServerLoad = async ({ params }) => {
  const env = getEnvironment();

  const classroom = await env.classroomRepo.getByDisplayCode(params.code);
  if (!classroom) {
    error(404, { message: 'Classroom not found' });
  }

  const sessionResult = await getCurrentSession(
    { sessionRepo: env.sessionRepo },
    { classroomId: classroom.id }
  );

  const session =
    sessionResult.status === 'ok' && sessionResult.value
      ? {
          id: sessionResult.value.id,
          name: sessionResult.value.name,
          status: sessionResult.value.status
        }
      : null;

  if (!session || session.status !== 'active') {
    return {
      classroom: { id: classroom.id, name: classroom.name, displayCode: classroom.displayCode },
      session,
      students: [] as KioskStudent[],
      demoMode: isDemoMode,
      demoPins: {} as Record<string, string>
    };
  }

  const [members, presentResult, studentsWithPins] = await Promise.all([
    env.classroomRepo.listMembers(classroom.id),
    listPresent({ presenceRepo: env.presenceRepo }, { sessionId: session.id }),
    env.pinRepo.listStudentsWithPins(classroom.id)
  ]);

  const presentPeople = presentResult.status === 'ok' ? presentResult.value : [];
  const presentMap = new Map(presentPeople.map((p) => [p.id, p]));
  const pinMap = new Map(studentsWithPins.map((s) => [s.id, s.hasPin]));

  const students: KioskStudent[] = members
    .filter((m) => m.role === 'student')
    .map((m) => ({
      id: m.id,
      displayName: m.displayName,
      pronouns: m.pronouns,
      isPresent: presentMap.has(m.id),
      themeColor: presentMap.get(m.id)?.themeColor ?? null,
      hasPin: pinMap.get(m.id) ?? false
    }));

  const demoPins: Record<string, string> = {};
  if (isDemoMode) {
    const store = getDemoStore();
    if (store) {
      for (const student of students) {
        const pin = store.plaintextPins.get(student.id);
        if (pin) demoPins[student.id] = pin;
      }
    }
  }

  return {
    classroom: { id: classroom.id, name: classroom.name, displayCode: classroom.displayCode },
    session,
    students,
    demoMode: isDemoMode,
    demoPins
  };
};

export const actions: Actions = {
  togglePresence: async ({ params, request }) => {
    const env = getEnvironment();

    const classroom = await env.classroomRepo.getByDisplayCode(params.code);
    if (!classroom) return fail(404, { error: 'Classroom not found' });

    const sessionResult = await getCurrentSession(
      { sessionRepo: env.sessionRepo },
      { classroomId: classroom.id }
    );
    if (sessionResult.status !== 'ok' || !sessionResult.value) {
      return fail(400, { error: 'No active session' });
    }
    const sessionId = sessionResult.value.id;

    const formData = await request.formData();
    const personId = formData.get('personId') as string;
    if (!personId) return fail(400, { error: 'Missing personId' });

    const pin = (formData.get('pin') as string) || '';

    const membership = await env.classroomRepo.getMembership(personId, classroom.id);
    if (!membership || membership.role !== 'student') {
      return fail(403, { error: 'Not a student in this classroom' });
    }

    const pinHash = await env.pinRepo.getPersonPinHash(personId);
    if (pinHash) {
      if (!pin) return fail(403, { error: 'PIN_REQUIRED' });
      const pinValid = await env.hashService.compare(pin, pinHash);
      if (!pinValid) return fail(403, { error: 'INVALID_PIN' });
    }

    const statusResult = await getSignInStatus(
      { presenceRepo: env.presenceRepo },
      { sessionId, personId }
    );

    const isCurrentlySignedIn =
      statusResult.status === 'ok' && statusResult.value && !statusResult.value.signedOutAt;

    if (isCurrentlySignedIn) {
      const result = await signOut(
        {
          sessionRepo: env.sessionRepo,
          presenceRepo: env.presenceRepo,
          classroomRepo: env.classroomRepo,
          eventStore: env.eventStore
        },
        { sessionId, personId, actorId: personId, pinClassroomId: null }
      );
      if (result.status === 'err') return fail(400, { error: result.error.type });
    } else {
      const result = await signIn(
        {
          sessionRepo: env.sessionRepo,
          presenceRepo: env.presenceRepo,
          classroomRepo: env.classroomRepo,
          eventStore: env.eventStore,
          idGenerator: env.idGenerator
        },
        { sessionId, personId, actorId: personId, pinClassroomId: null }
      );
      if (result.status === 'err') return fail(400, { error: result.error.type });
    }

    return { success: true };
  }
};
