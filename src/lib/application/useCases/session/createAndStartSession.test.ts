import { describe, it, expect, vi } from 'vitest';
import { createAndStartSession } from './createAndStartSession';
import {
  createMockSessionRepo,
  createMockClassroomRepo,
  createMockEventStore
} from '../../../../test-utils/mocks';
import type { SessionRecord } from '$lib/application/ports/SessionRepository';

const fixedNow = new Date('2025-01-15T10:00:00Z');

const scheduledSession: SessionRecord = {
  id: 'ses-1',
  classroomId: 'cls-1',
  name: null,
  sessionType: 'drop_in',
  scheduledDate: fixedNow,
  startTime: fixedNow,
  endTime: new Date(fixedNow.getTime() + 2 * 60 * 60 * 1000),
  actualStartAt: null,
  actualEndAt: null,
  status: 'scheduled'
};

const activeSession: SessionRecord = {
  ...scheduledSession,
  status: 'active',
  actualStartAt: fixedNow
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

describe('createAndStartSession', () => {
  it('creates a 2-hour drop-in session and starts it', async () => {
    let callCount = 0;
    const sessionRepo = createMockSessionRepo({
      findActive: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(scheduledSession),
      getById: vi.fn().mockImplementation(async () => {
        // First call from startSession to check session; second to return updated
        callCount++;
        return callCount === 1 ? scheduledSession : activeSession;
      })
    });
    const classroomRepo = createMockClassroomRepo({
      getById: vi.fn().mockResolvedValue(classroom)
    });
    const eventStore = createMockEventStore();

    const result = await createAndStartSession(
      { sessionRepo, classroomRepo, eventStore },
      { classroomId: 'cls-1', actorId: 'teacher-1' },
      fixedNow
    );

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.value.status).toBe('active');
    }

    // Verify create was called with 2-hour window
    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionType: 'drop_in',
        startTime: fixedNow,
        endTime: new Date(fixedNow.getTime() + 2 * 60 * 60 * 1000)
      })
    );

    expect(eventStore.appendAndEmit).toHaveBeenCalledOnce();
  });

  it('returns ACTIVE_SESSION_EXISTS when a session is already active', async () => {
    const sessionRepo = createMockSessionRepo({
      findActive: vi.fn().mockResolvedValue(activeSession)
    });
    const classroomRepo = createMockClassroomRepo();
    const eventStore = createMockEventStore();

    const result = await createAndStartSession(
      { sessionRepo, classroomRepo, eventStore },
      { classroomId: 'cls-1', actorId: 'teacher-1' },
      fixedNow
    );

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('ACTIVE_SESSION_EXISTS');
    }
  });
});
