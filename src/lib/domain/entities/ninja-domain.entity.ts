export type NinjaDomain = {
  readonly id: string;
  readonly classroomId: string;
  readonly name: string;
  readonly description: string | null;
  readonly displayOrder: number;
  readonly isActive: boolean;
};
