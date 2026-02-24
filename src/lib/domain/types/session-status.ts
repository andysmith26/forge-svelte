export const SessionStatus = {
  Scheduled: 'scheduled',
  Active: 'active',
  Ended: 'ended',
  Cancelled: 'cancelled'
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];
