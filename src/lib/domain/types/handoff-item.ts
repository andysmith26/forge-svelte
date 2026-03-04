export const HandoffItemType = {
  Blocker: 'blocker',
  Question: 'question'
} as const;

export type HandoffItemType = (typeof HandoffItemType)[keyof typeof HandoffItemType];
