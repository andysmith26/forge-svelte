/**
 * Stub — will be fully defined when porting the application layer (Phase 3).
 */
export interface HelpRepository {
  listCategories(classroomId: string): Promise<HelpCategoryRecord[]>;
  createCategory(data: unknown): Promise<HelpCategoryRecord>;
  updateCategory(id: string, data: unknown): Promise<HelpCategoryRecord>;
  archiveCategory(id: string): Promise<void>;
  createRequest(data: unknown): Promise<HelpRequestRecord>;
  getRequestById(id: string): Promise<HelpRequestRecord | null>;
  updateRequest(id: string, data: unknown): Promise<HelpRequestRecord>;
  listOpenRequests(sessionId: string): Promise<HelpRequestRecord[]>;
}

export interface HelpCategoryRecord {
  id: string;
  classroomId: string;
  name: string;
  description: string | null;
  ninjaDomainId: string | null;
  displayOrder: number;
  isActive: boolean;
}

export interface HelpRequestRecord {
  id: string;
  classroomId: string;
  sessionId: string;
  requesterId: string;
  categoryId: string | null;
  description: string;
  whatITried: string;
  urgency: 'blocked' | 'question' | 'check_work';
  status: 'pending' | 'claimed' | 'resolved' | 'cancelled';
  claimedById: string | null;
  claimedAt: Date | null;
  resolvedAt: Date | null;
  cancelledAt: Date | null;
  resolutionNotes: string | null;
  cancellationReason: string | null;
  createdAt: Date;
}
