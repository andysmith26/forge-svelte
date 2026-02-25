import { describe, it, expect, vi } from 'vitest';
import { requestHelp } from './requestHelp';
import {
  createMockHelpRepo,
  createMockSessionRepo,
  createMockClassroomRepo,
  createMockEventStore,
  createMockIdGenerator
} from '../../../../test-utils/mocks';
import type { SessionRecord } from '$lib/application/ports/SessionRepository';
import type { HelpRequestRecord } from '$lib/application/ports/HelpRepository';

const activeSession: SessionRecord = {
  id: 'ses-1',
  classroomId: 'cls-1',
  name: 'Test Session',
  sessionType: 'drop_in',
  scheduledDate: new Date('2025-01-15'),
  startTime: new Date('2025-01-15T09:00:00Z'),
  endTime: new Date('2025-01-15T11:00:00Z'),
  actualStartAt: new Date('2025-01-15T09:00:00Z'),
  actualEndAt: null,
  status: 'active'
};

const classroom = {
  id: 'cls-1',
  schoolId: 'sch-1',
  name: 'Test Classroom',
  slug: 'test',
  description: null,
  displayCode: 'ABC123',
  settings: {},
  isActive: true
};

const createdRequest: HelpRequestRecord = {
  id: 'req-1',
  classroomId: 'cls-1',
  sessionId: 'ses-1',
  requesterId: 'per-1',
  categoryId: null,
  description: 'I need help with my code',
  whatITried: 'I tried reading the docs and debugging step by step',
  urgency: 'question',
  status: 'pending',
  claimedById: null,
  claimedAt: null,
  resolvedAt: null,
  cancelledAt: null,
  resolutionNotes: null,
  cancellationReason: null,
  createdAt: new Date('2025-01-15T10:00:00Z')
};

const validInput = {
  sessionId: 'ses-1',
  requesterId: 'per-1',
  description: 'I need help with my code',
  whatITried: 'I tried reading the docs and debugging step by step',
  urgency: 'question' as const
};

describe('requestHelp', () => {
  it('returns ok with helpRequest and queuePosition on success', async () => {
    const sessionRepo = createMockSessionRepo({
      getById: vi.fn().mockResolvedValue(activeSession)
    });
    const helpRepo = createMockHelpRepo({
      findOpenRequest: vi.fn().mockResolvedValue(null),
      getRequestById: vi.fn().mockResolvedValue(createdRequest),
      countPendingBefore: vi.fn().mockResolvedValue(0)
    });
    const classroomRepo = createMockClassroomRepo({
      getById: vi.fn().mockResolvedValue(classroom),
      getMembership: vi.fn().mockResolvedValue(null)
    });
    const eventStore = createMockEventStore();
    const idGenerator = createMockIdGenerator(['req-1']);

    const result = await requestHelp(
      { helpRepo, sessionRepo, classroomRepo, eventStore, idGenerator },
      validInput
    );

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.value.helpRequest.id).toBe('req-1');
      expect(result.value.queuePosition).toBe(0);
    }
    expect(eventStore.appendAndEmit).toHaveBeenCalledOnce();
  });

  it('returns SESSION_NOT_FOUND when session does not exist', async () => {
    const result = await requestHelp(
      {
        helpRepo: createMockHelpRepo(),
        sessionRepo: createMockSessionRepo(),
        classroomRepo: createMockClassroomRepo(),
        eventStore: createMockEventStore(),
        idGenerator: createMockIdGenerator()
      },
      validInput
    );

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('SESSION_NOT_FOUND');
    }
  });

  it('returns SESSION_NOT_ACTIVE when session is ended', async () => {
    const endedSession = { ...activeSession, status: 'ended' as const, actualEndAt: new Date() };

    const result = await requestHelp(
      {
        helpRepo: createMockHelpRepo(),
        sessionRepo: createMockSessionRepo({ getById: vi.fn().mockResolvedValue(endedSession) }),
        classroomRepo: createMockClassroomRepo(),
        eventStore: createMockEventStore(),
        idGenerator: createMockIdGenerator()
      },
      validInput
    );

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('SESSION_NOT_ACTIVE');
    }
  });

  it('returns ALREADY_HAS_OPEN_REQUEST when requester has open request', async () => {
    const result = await requestHelp(
      {
        helpRepo: createMockHelpRepo({
          findOpenRequest: vi.fn().mockResolvedValue(createdRequest)
        }),
        sessionRepo: createMockSessionRepo({ getById: vi.fn().mockResolvedValue(activeSession) }),
        classroomRepo: createMockClassroomRepo(),
        eventStore: createMockEventStore(),
        idGenerator: createMockIdGenerator()
      },
      validInput
    );

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('ALREADY_HAS_OPEN_REQUEST');
    }
  });

  it('returns VALIDATION_ERROR when whatITried is too short', async () => {
    const result = await requestHelp(
      {
        helpRepo: createMockHelpRepo({ findOpenRequest: vi.fn().mockResolvedValue(null) }),
        sessionRepo: createMockSessionRepo({ getById: vi.fn().mockResolvedValue(activeSession) }),
        classroomRepo: createMockClassroomRepo({
          getById: vi.fn().mockResolvedValue(classroom),
          getMembership: vi.fn().mockResolvedValue(null)
        }),
        eventStore: createMockEventStore(),
        idGenerator: createMockIdGenerator()
      },
      { ...validInput, whatITried: 'too short' }
    );

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('VALIDATION_ERROR');
    }
  });
});
