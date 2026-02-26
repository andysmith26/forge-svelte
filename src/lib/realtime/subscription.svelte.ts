import { invalidateAll } from '$app/navigation';
import { getSupabaseClient, isRealtimeEnabled } from './supabase.js';
import { ChannelBuilder } from './channels.js';
import type { ConnectionState, NotificationRow } from './types.js';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

interface SubscriptionConfig {
  subscriptionName: string;
  filterChannel: string;
  entityType: string;
}

function createSubscription(config: SubscriptionConfig) {
  let connectionState = $state<ConnectionState>(
    isRealtimeEnabled() ? 'connecting' : 'disconnected'
  );
  let channel: RealtimeChannel | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let reconnectAttempts = 0;

  function handleChange(payload: RealtimePostgresChangesPayload<NotificationRow>) {
    const record = payload.new as NotificationRow | undefined;
    if (
      record &&
      record.channel === config.filterChannel &&
      record.entity_type === config.entityType
    ) {
      invalidateAll();
    }
  }

  function subscribe(): RealtimeChannel | null {
    const client = getSupabaseClient();
    if (!client) {
      connectionState = 'disconnected';
      return null;
    }

    connectionState = 'connecting';

    const ch = client
      .channel(config.subscriptionName)
      .on<NotificationRow>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_notifications',
          filter: `channel=eq.${config.filterChannel}`
        },
        handleChange
      )
      .subscribe((status) => {
        switch (status) {
          case 'SUBSCRIBED':
            connectionState = 'connected';
            reconnectAttempts = 0;
            break;
          case 'CHANNEL_ERROR':
            connectionState = 'error';
            attemptReconnect();
            break;
          case 'TIMED_OUT':
          case 'CLOSED':
            connectionState = 'disconnected';
            break;
        }
      });

    return ch;
  }

  function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      connectionState = 'error';
      return;
    }

    connectionState = 'reconnecting';
    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts) + Math.random() * 1000,
      RECONNECT_MAX_DELAY
    );
    reconnectAttempts++;

    reconnectTimeout = setTimeout(() => {
      cleanup(false);
      channel = subscribe();
    }, delay);
  }

  function cleanup(resetState = true) {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    const client = getSupabaseClient();
    if (channel && client) {
      client.removeChannel(channel);
      channel = null;
    }
    if (resetState) {
      connectionState = 'disconnected';
    }
  }

  function start() {
    channel = subscribe();
  }

  return {
    get connectionState() {
      return connectionState;
    },
    get isConnected() {
      return connectionState === 'connected';
    },
    start,
    cleanup
  };
}

export interface RealtimeState {
  readonly connectionState: ConnectionState;
  readonly isConnected: boolean;
}

export function createPresenceSubscription(sessionId: string): RealtimeState {
  const sub = createSubscription({
    subscriptionName: `presence-sub:${sessionId}`,
    filterChannel: ChannelBuilder.presence(sessionId),
    entityType: 'sign_in'
  });

  $effect(() => {
    sub.start();
    return () => sub.cleanup();
  });

  return sub;
}

export function createSessionSubscription(classroomId: string): RealtimeState {
  const sub = createSubscription({
    subscriptionName: `session-sub:${classroomId}`,
    filterChannel: ChannelBuilder.session(classroomId),
    entityType: 'session'
  });

  $effect(() => {
    sub.start();
    return () => sub.cleanup();
  });

  return sub;
}

export function createHelpSubscription(sessionId: string): RealtimeState {
  const sub = createSubscription({
    subscriptionName: `help-sub:${sessionId}`,
    filterChannel: ChannelBuilder.help(sessionId),
    entityType: 'help_request'
  });

  $effect(() => {
    sub.start();
    return () => sub.cleanup();
  });

  return sub;
}

export function createClassroomSubscription(
  classroomId: string,
  sessionId: string | null
): RealtimeState {
  const sessionSub = createSubscription({
    subscriptionName: `session-sub:${classroomId}`,
    filterChannel: ChannelBuilder.session(classroomId),
    entityType: 'session'
  });

  const presenceSub = sessionId
    ? createSubscription({
        subscriptionName: `presence-sub:${sessionId}`,
        filterChannel: ChannelBuilder.presence(sessionId),
        entityType: 'sign_in'
      })
    : null;

  const helpSub = sessionId
    ? createSubscription({
        subscriptionName: `help-sub:${sessionId}`,
        filterChannel: ChannelBuilder.help(sessionId),
        entityType: 'help_request'
      })
    : null;

  $effect(() => {
    sessionSub.start();
    presenceSub?.start();
    helpSub?.start();
    return () => {
      sessionSub.cleanup();
      presenceSub?.cleanup();
      helpSub?.cleanup();
    };
  });

  return {
    get connectionState() {
      if (sessionSub.connectionState === 'error') return 'error';
      if (sessionSub.connectionState === 'reconnecting') return 'reconnecting';
      if (sessionSub.connectionState === 'connecting') return 'connecting';
      return sessionSub.connectionState;
    },
    get isConnected() {
      return sessionSub.isConnected;
    }
  };
}
