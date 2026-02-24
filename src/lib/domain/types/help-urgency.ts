export const HelpUrgency = {
  Blocked: 'blocked',
  Question: 'question',
  CheckWork: 'check_work'
} as const;

export type HelpUrgency = (typeof HelpUrgency)[keyof typeof HelpUrgency];
