import type { Role } from '$lib/domain/types/roles';

export type Membership = {
  readonly id: string;
  readonly classroomId: string;
  readonly personId: string;
  readonly role: Role;
  readonly isActive: boolean;
  readonly joinedAt: Date;
  readonly leftAt: Date | null;
};
