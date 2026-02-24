import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getEnvironment } from '$lib/server/environment';
import { listMyClassrooms } from '$lib/application/useCases/classroom/listMyClassrooms';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.actor) {
    redirect(302, '/auth/signin');
  }

  const env = getEnvironment();
  const result = await listMyClassrooms(
    { classroomRepo: env.classroomRepo },
    { personId: locals.actor.personId }
  );

  if (result.status === 'err') {
    return { classrooms: [] };
  }

  return {
    classrooms: result.value.map((m) => ({
      id: m.classroom.id,
      name: m.classroom.name,
      displayCode: m.classroom.displayCode,
      role: m.role,
      isActive: m.classroom.isActive
    }))
  };
};
