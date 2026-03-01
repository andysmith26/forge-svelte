import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.actor || locals.actor.authType !== 'pin') {
    redirect(302, '/login');
  }

  redirect(302, `/classroom/${locals.actor.pinClassroomId}`);
};
