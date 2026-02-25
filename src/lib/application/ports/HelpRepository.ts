import type { HelpUrgency } from '$lib/domain/types/help-urgency';

export type HelpStatus = 'pending' | 'claimed' | 'resolved' | 'cancelled';

export type HelpCategoryRecord = {
  id: string;
  classroomId: string;
  name: string;
  description: string | null;
  ninjaDomainId: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type HelpRequestRecord = {
  id: string;
  classroomId: string;
  sessionId: string;
  requesterId: string;
  categoryId: string | null;
  description: string;
  whatITried: string;
  urgency: HelpUrgency;
  status: HelpStatus;
  claimedById: string | null;
  claimedAt: Date | null;
  resolvedAt: Date | null;
  cancelledAt: Date | null;
  resolutionNotes: string | null;
  cancellationReason: string | null;
  createdAt: Date;
};

export type HelpCategorySummary = {
  id: string;
  name: string;
};

export type PersonSummary = {
  id: string;
  displayName: string;
};

export type HelpRequestWithRelations = HelpRequestRecord & {
  category: HelpCategorySummary | null;
  claimedBy: PersonSummary | null;
};

export type HelpQueueItem = HelpRequestRecord & {
  requester: PersonSummary;
  category: HelpCategorySummary | null;
  claimedBy: PersonSummary | null;
};

export type ResolvedRequestSample = {
  createdAt: Date;
  resolvedAt: Date | null;
};

export type CreateCategoryInput = {
  classroomId: string;
  name: string;
  description: string | null;
  ninjaDomainId: string | null;
  displayOrder: number;
};

export type UpdateCategoryInput = {
  name?: string;
  description?: string | null;
  ninjaDomainId?: string | null;
};

export type CreateRequestInput = {
  classroomId: string;
  sessionId: string;
  requesterId: string;
  categoryId: string | null;
  description: string;
  whatITried: string;
  urgency: HelpUrgency;
};

export type UpdateRequestInput = {
  status?: HelpStatus;
  claimedById?: string | null;
  claimedAt?: Date | null;
  resolvedAt?: Date | null;
  cancelledAt?: Date | null;
  resolutionNotes?: string | null;
  cancellationReason?: string | null;
};

export interface HelpRepository {
  listCategories(classroomId: string): Promise<HelpCategoryRecord[]>;
  getCategoryById(id: string): Promise<HelpCategoryRecord | null>;
  findCategoryByName(classroomId: string, name: string): Promise<HelpCategoryRecord | null>;
  getNextCategoryOrder(classroomId: string): Promise<number>;
  createCategory(input: CreateCategoryInput): Promise<HelpCategoryRecord>;
  updateCategory(id: string, input: UpdateCategoryInput): Promise<HelpCategoryRecord>;
  archiveCategory(id: string): Promise<HelpCategoryRecord>;

  getRequestById(id: string): Promise<HelpRequestRecord | null>;
  findOpenRequest(sessionId: string, requesterId: string): Promise<HelpRequestRecord | null>;
  listOpenRequests(sessionId: string, requesterId: string): Promise<HelpRequestWithRelations[]>;
  listQueue(sessionId: string): Promise<HelpQueueItem[]>;
  countPendingBefore(classroomId: string, createdAt: Date): Promise<number>;
  listResolvedSamples(classroomId: string, limit: number): Promise<ResolvedRequestSample[]>;
}
