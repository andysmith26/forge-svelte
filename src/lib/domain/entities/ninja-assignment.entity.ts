export type NinjaAssignment = {
  readonly id: string;
  readonly personId: string;
  readonly ninjaDomainId: string;
  readonly assignedById: string;
  readonly isActive: boolean;
  readonly assignedAt: Date;
  readonly revokedAt: Date | null;
};
