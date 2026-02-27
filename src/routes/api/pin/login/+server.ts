import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEnvironment } from '$lib/server/environment';
import { loginWithPin } from '$lib/application/useCases/pin/loginWithPin';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const body = await request.json();
  const { classroomCode, pin } = body;

  if (!classroomCode || !pin) {
    return json({ error: 'Classroom code and PIN are required' }, { status: 400 });
  }

  const env = getEnvironment();
  const result = await loginWithPin(
    { pinRepo: env.pinRepo, hashService: env.hashService, tokenGenerator: env.tokenGenerator },
    { classroomCode, pin }
  );

  if (result.status === 'err') {
    if (result.error.type === 'INVALID_CREDENTIALS') {
      return json({ error: 'Invalid classroom code or PIN' }, { status: 401 });
    }
    return json({ error: 'Internal error' }, { status: 500 });
  }

  cookies.set('forge_pin_session', result.value.token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 4 * 60 * 60
  });

  return json({ success: true });
};
