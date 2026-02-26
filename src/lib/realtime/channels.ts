export const CHANNEL_PREFIXES = {
  PRESENCE: 'presence',
  SESSION: 'session',
  HELP: 'help'
} as const;

export const CHANNEL_SCOPES = {
  SESSION: 'session',
  CLASSROOM: 'classroom'
} as const;

export const ChannelBuilder = {
  presence(sessionId: string): string {
    return `${CHANNEL_PREFIXES.PRESENCE}:${CHANNEL_SCOPES.SESSION}:${sessionId}`;
  },

  session(classroomId: string): string {
    return `${CHANNEL_PREFIXES.SESSION}:${CHANNEL_SCOPES.CLASSROOM}:${classroomId}`;
  },

  help(sessionId: string): string {
    return `${CHANNEL_PREFIXES.HELP}:${CHANNEL_SCOPES.SESSION}:${sessionId}`;
  }
} as const;
