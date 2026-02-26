import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvironment } from '$lib/server/environment';
import { logoutPin } from '$lib/application/useCases/pin/logoutPin';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get('forge_pin_session');

  if (token) {
    const env = getEnvironment();
    await logoutPin({ pinRepo: env.pinRepo }, { token });
  }

  cookies.delete('forge_pin_session', { path: '/' });

  redirect(302, '/login');
};
