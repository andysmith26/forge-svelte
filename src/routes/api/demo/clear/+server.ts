import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isDemoMode, getDemoStore, getDemoPinRepo } from '$lib/server/environment';

export const POST: RequestHandler = async () => {
  if (!isDemoMode) error(404, 'Not found');

  const store = getDemoStore();
  const pinRepo = getDemoPinRepo();
  if (!store || !pinRepo) error(500, 'Demo store not initialized');

  store.clear();
  pinRepo.clearPinHashes();
  return json({ success: true });
};
