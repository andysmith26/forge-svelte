import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

let _client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (_client !== undefined) return _client;

  const url = env.PUBLIC_SUPABASE_URL;
  const key = env.PUBLIC_SUPABASE_ANON_KEY;

  if (url && key) {
    _client = createClient(url, key, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  } else {
    _client = null;
  }

  return _client;
}

export function isRealtimeEnabled(): boolean {
  return getSupabaseClient() !== null;
}
