import { vi } from 'vitest';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { SessionRepository } from '$lib/application/ports/SessionRepository';
import type { HelpRepository } from '$lib/application/ports/HelpRepository';
import type { PresenceRepository } from '$lib/application/ports/PresenceRepository';
import type { EventStore, StoredEvent } from '$lib/application/ports/EventStore';
import type { IdGenerator } from '$lib/application/ports/IdGenerator';

type MockOf<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? ReturnType<typeof vi.fn<(...args: A) => R>>
    : T[K];
};

export function createMockClassroomRepo(
  overrides?: Partial<MockOf<ClassroomRepository>>
): MockOf<ClassroomRepository> {
  return {
    getById: vi.fn().mockResolvedValue(null),
    getByDisplayCode: vi.fn().mockResolvedValue(null),
    listMembershipsForPerson: vi.fn().mockResolvedValue([]),
    listMembers: vi.fn().mockResolvedValue([]),
    getMembership: vi.fn().mockResolvedValue(null),
    updateSettings: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

export function createMockSessionRepo(
  overrides?: Partial<MockOf<SessionRepository>>
): MockOf<SessionRepository> {
  return {
    getById: vi.fn().mockResolvedValue(null),
    getWithClassroom: vi.fn().mockResolvedValue(null),
    getWithDetails: vi.fn().mockResolvedValue(null),
    getCurrentWithClassroom: vi.fn().mockResolvedValue(null),
    findActive: vi.fn().mockResolvedValue(null),
    listByClassroom: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(null),
    ...overrides
  };
}

export function createMockHelpRepo(
  overrides?: Partial<MockOf<HelpRepository>>
): MockOf<HelpRepository> {
  return {
    listCategories: vi.fn().mockResolvedValue([]),
    getCategoryById: vi.fn().mockResolvedValue(null),
    findCategoryByName: vi.fn().mockResolvedValue(null),
    getNextCategoryOrder: vi.fn().mockResolvedValue(0),
    createCategory: vi.fn().mockResolvedValue(null),
    updateCategory: vi.fn().mockResolvedValue(null),
    archiveCategory: vi.fn().mockResolvedValue(null),
    getRequestById: vi.fn().mockResolvedValue(null),
    findOpenRequest: vi.fn().mockResolvedValue(null),
    listOpenRequests: vi.fn().mockResolvedValue([]),
    listQueue: vi.fn().mockResolvedValue([]),
    countPendingBefore: vi.fn().mockResolvedValue(0),
    listResolvedSamples: vi.fn().mockResolvedValue([]),
    ...overrides
  };
}

export function createMockPresenceRepo(
  overrides?: Partial<MockOf<PresenceRepository>>
): MockOf<PresenceRepository> {
  return {
    getSignIn: vi.fn().mockResolvedValue(null),
    createSignIn: vi.fn().mockResolvedValue(null),
    updateSignIn: vi.fn().mockResolvedValue(null),
    listPresentPeople: vi.fn().mockResolvedValue([]),
    listSignInsForSession: vi.fn().mockResolvedValue([]),
    signOutAll: vi.fn().mockResolvedValue(0),
    ...overrides
  };
}

export function createMockEventStore(
  overrides?: Partial<MockOf<EventStore>>
): MockOf<EventStore> & { events: StoredEvent[] } {
  const events: StoredEvent[] = [];
  return {
    events,
    append: vi.fn().mockImplementation(async (input) => {
      const event: StoredEvent = {
        id: `evt-${events.length + 1}`,
        schoolId: input.schoolId,
        classroomId: input.classroomId ?? null,
        sessionId: input.sessionId ?? null,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? null,
        payload: input.payload,
        createdAt: new Date()
      };
      events.push(event);
      return event;
    }),
    appendAndEmit: vi.fn().mockImplementation(async (input) => {
      const event: StoredEvent = {
        id: `evt-${events.length + 1}`,
        schoolId: input.schoolId,
        classroomId: input.classroomId ?? null,
        sessionId: input.sessionId ?? null,
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        actorId: input.actorId ?? null,
        payload: input.payload,
        createdAt: new Date()
      };
      events.push(event);
      return event;
    }),
    loadEvents: vi.fn().mockResolvedValue([]),
    countEvents: vi.fn().mockResolvedValue(0),
    deleteOlderThan: vi.fn().mockResolvedValue(0),
    ...overrides
  };
}

export function createMockIdGenerator(ids?: string[]): MockOf<IdGenerator> {
  let index = 0;
  return {
    generate: vi.fn().mockImplementation(() => {
      if (ids && index < ids.length) {
        return ids[index++];
      }
      return `id-${++index}`;
    })
  };
}
