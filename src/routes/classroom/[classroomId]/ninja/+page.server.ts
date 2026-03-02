import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
  const parentData = await parent();
  redirect(302, `/classroom/${parentData.classroom.id}/help`);
};
