export const Role = {
  Student: 'student',
  Teacher: 'teacher',
  Volunteer: 'volunteer'
} as const;

export type Role = (typeof Role)[keyof typeof Role];
