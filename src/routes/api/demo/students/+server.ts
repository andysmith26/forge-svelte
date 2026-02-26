import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isDemoMode, getDemoStore } from '$lib/server/environment';
import { getDemoStudents, DEMO_CLASSROOM_CODE } from '$lib/server/demo/seedData';

export const GET: RequestHandler = async () => {
  if (!isDemoMode) error(404, 'Not found');

  const store = getDemoStore();
  if (!store) error(500, 'Demo store not initialized');

  const students = getDemoStudents(store);
  return json({ students, classroomCode: DEMO_CLASSROOM_CODE });
};
