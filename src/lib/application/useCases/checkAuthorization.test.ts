import { describe, it, expect, vi } from 'vitest';
import { requireMember, requireTeacher, requireSignedIn } from './checkAuthorization';
import { createMockClassroomRepo, createMockPresenceRepo } from '../../../test-utils/mocks';
import type { ClassroomMembership } from '$lib/application/ports/ClassroomRepository';
import type { SignInRecord } from '$lib/application/ports/PresenceRepository';

const membership: ClassroomMembership = {
  id: 'mem-1',
  classroomId: 'cls-1',
  personId: 'per-1',
  role: 'teacher',
  isActive: true,
  joinedAt: new Date('2025-01-01'),
  leftAt: null
};

const studentMembership: ClassroomMembership = {
  ...membership,
  role: 'student'
};

const signIn: SignInRecord = {
  id: 'si-1',
  sessionId: 'ses-1',
  personId: 'per-1',
  signedInAt: new Date('2025-01-15T10:00:00Z'),
  signedOutAt: null,
  signedInById: 'per-1',
  signedOutById: null,
  signoutType: null
};

describe('requireMember', () => {
  it('returns ok with membership when person is a member', async () => {
    const classroomRepo = createMockClassroomRepo({
      getMembership: vi.fn().mockResolvedValue(membership)
    });

    const result = await requireMember({ classroomRepo }, 'per-1', 'cls-1');

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.value.personId).toBe('per-1');
    }
  });

  it('returns NOT_AUTHENTICATED when personId is empty', async () => {
    const classroomRepo = createMockClassroomRepo();

    const result = await requireMember({ classroomRepo }, '', 'cls-1');

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('NOT_AUTHENTICATED');
    }
  });

  it('returns NOT_MEMBER when no membership exists', async () => {
    const classroomRepo = createMockClassroomRepo();

    const result = await requireMember({ classroomRepo }, 'per-1', 'cls-1');

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('NOT_MEMBER');
    }
  });
});

describe('requireTeacher', () => {
  it('returns ok when person is a teacher', async () => {
    const classroomRepo = createMockClassroomRepo({
      getMembership: vi.fn().mockResolvedValue(membership)
    });

    const result = await requireTeacher({ classroomRepo }, 'per-1', 'cls-1');

    expect(result.status).toBe('ok');
  });

  it('returns NOT_TEACHER when person is a student', async () => {
    const classroomRepo = createMockClassroomRepo({
      getMembership: vi.fn().mockResolvedValue(studentMembership)
    });

    const result = await requireTeacher({ classroomRepo }, 'per-1', 'cls-1');

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('NOT_TEACHER');
    }
  });

  it('returns NOT_MEMBER when no membership exists', async () => {
    const classroomRepo = createMockClassroomRepo();

    const result = await requireTeacher({ classroomRepo }, 'per-1', 'cls-1');

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('NOT_MEMBER');
    }
  });
});

describe('requireSignedIn', () => {
  it('returns ok when person is signed in', async () => {
    const presenceRepo = createMockPresenceRepo({
      getSignIn: vi.fn().mockResolvedValue(signIn)
    });

    const result = await requireSignedIn({ presenceRepo }, 'per-1', 'ses-1');

    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      expect(result.value.personId).toBe('per-1');
    }
  });

  it('returns NOT_SIGNED_IN when no sign-in exists', async () => {
    const presenceRepo = createMockPresenceRepo();

    const result = await requireSignedIn({ presenceRepo }, 'per-1', 'ses-1');

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('NOT_SIGNED_IN');
    }
  });

  it('returns NOT_SIGNED_IN when sign-in has been signed out', async () => {
    const signedOut = { ...signIn, signedOutAt: new Date() };
    const presenceRepo = createMockPresenceRepo({
      getSignIn: vi.fn().mockResolvedValue(signedOut)
    });

    const result = await requireSignedIn({ presenceRepo }, 'per-1', 'ses-1');

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('NOT_SIGNED_IN');
    }
  });

  it('returns NOT_AUTHENTICATED when personId is empty', async () => {
    const presenceRepo = createMockPresenceRepo();

    const result = await requireSignedIn({ presenceRepo }, '', 'ses-1');

    expect(result.status).toBe('err');
    if (result.status === 'err') {
      expect(result.error.type).toBe('NOT_AUTHENTICATED');
    }
  });
});
