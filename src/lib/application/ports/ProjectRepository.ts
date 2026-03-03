import type { ProjectVisibility } from '$lib/domain/entities/project.entity';

export type ProjectRecord = {
  id: string;
  schoolId: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  visibility: ProjectVisibility;
  createdById: string;
  createdAt: Date;
};

export type ProjectMembershipRecord = {
  id: string;
  projectId: string;
  personId: string;
  isActive: boolean;
  joinedAt: Date;
  leftAt: Date | null;
};

export type SubsystemRecord = {
  id: string;
  projectId: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
};

export type HandoffRecord = {
  id: string;
  projectId: string;
  authorId: string;
  sessionId: string | null;
  whatIDid: string;
  whatsNext: string | null;
  blockers: string | null;
  questions: string | null;
  createdAt: Date;
};

export type HandoffWithRelations = HandoffRecord & {
  author: { id: string; displayName: string };
  subsystems: { id: string; name: string }[];
};

export type HandoffReadStatusRecord = {
  id: string;
  projectId: string;
  personId: string;
  lastReadAt: Date;
};

export type ProjectMemberSummary = {
  id: string;
  personId: string;
  displayName: string;
  isActive: boolean;
};

export type ProjectListItem = ProjectRecord & {
  memberCount: number;
  lastHandoffAt: Date | null;
  unreadCount?: number;
};

export type ProjectWithMembers = ProjectRecord & {
  members: ProjectMemberSummary[];
  memberCount: number;
};

export interface ProjectRepository {
  // Project CRUD
  getById(id: string): Promise<ProjectRecord | null>;
  getWithMembers(id: string): Promise<ProjectWithMembers | null>;
  listBySchool(schoolId: string, includeArchived?: boolean): Promise<ProjectListItem[]>;
  listByMember(schoolId: string, personId: string): Promise<ProjectListItem[]>;
  findByName(schoolId: string, name: string): Promise<ProjectRecord | null>;

  // Membership
  getMembership(projectId: string, personId: string): Promise<ProjectMembershipRecord | null>;
  getActiveMembership(projectId: string, personId: string): Promise<ProjectMembershipRecord | null>;
  listActiveMembers(
    projectId: string
  ): Promise<(ProjectMembershipRecord & { person: { id: string; displayName: string } })[]>;
  getActiveProjectsForPerson(schoolId: string, personId: string): Promise<ProjectRecord[]>;

  // Subsystems
  listSubsystems(projectId: string): Promise<SubsystemRecord[]>;
  getSubsystemById(id: string): Promise<SubsystemRecord | null>;
  findSubsystemByName(projectId: string, name: string): Promise<SubsystemRecord | null>;
  getNextSubsystemOrder(projectId: string): Promise<number>;

  // Handoffs
  getHandoffById(id: string): Promise<HandoffRecord | null>;
  listHandoffs(
    projectId: string,
    options?: { limit?: number; afterDate?: Date }
  ): Promise<HandoffWithRelations[]>;
  countHandoffsSince(projectId: string, since: Date): Promise<number>;
  getLastHandoffByAuthor(projectId: string, authorId: string): Promise<HandoffRecord | null>;
  hasHandoffInSession(projectId: string, authorId: string, sessionId: string): Promise<boolean>;

  // Read status
  getReadStatus(projectId: string, personId: string): Promise<HandoffReadStatusRecord | null>;
  countUnread(projectId: string, personId: string): Promise<number>;
  upsertReadStatus(projectId: string, personId: string, lastReadAt: Date): Promise<void>;

  // Freshness
  getLastHandoffDate(projectId: string): Promise<Date | null>;
  getLastHandoffDates(projectIds: string[]): Promise<Map<string, Date | null>>;
  countUnreadBatch(projectIds: string[], personId: string): Promise<Map<string, number>>;
}
