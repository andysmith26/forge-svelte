import { describe, it, expect } from 'vitest';
import { SessionEntity, type SessionProps } from './session.entity';
import { ValidationError, ConflictError } from '$lib/domain/errors';

function validProps(overrides?: Partial<SessionProps>): SessionProps {
  return {
    id: 'ses-1',
    classroomId: 'cls-1',
    name: 'Morning Session',
    sessionType: 'drop_in',
    scheduledDate: new Date('2025-01-15'),
    startTime: new Date('2025-01-15T09:00:00Z'),
    endTime: new Date('2025-01-15T11:00:00Z'),
    actualStartAt: null,
    actualEndAt: null,
    status: 'scheduled',
    ...overrides
  };
}

describe('SessionEntity', () => {
  describe('create', () => {
    it('succeeds with valid props', () => {
      const entity = SessionEntity.create(validProps());
      expect(entity.id).toBe('ses-1');
      expect(entity.status).toBe('scheduled');
    });

    it('throws ValidationError when start >= end', () => {
      expect(() =>
        SessionEntity.create(
          validProps({
            startTime: new Date('2025-01-15T11:00:00Z'),
            endTime: new Date('2025-01-15T09:00:00Z')
          })
        )
      ).toThrow(ValidationError);
    });

    it('throws ValidationError when start equals end', () => {
      const same = new Date('2025-01-15T10:00:00Z');
      expect(() => SessionEntity.create(validProps({ startTime: same, endTime: same }))).toThrow(
        ValidationError
      );
    });

    it('throws ValidationError for empty classroomId', () => {
      expect(() => SessionEntity.create(validProps({ classroomId: '' }))).toThrow(ValidationError);
    });

    it('throws ValidationError for invalid session type', () => {
      expect(() => SessionEntity.create(validProps({ sessionType: 'invalid' as never }))).toThrow(
        ValidationError
      );
    });
  });

  describe('state machine', () => {
    it('follows scheduled → active → ended lifecycle', () => {
      const scheduled = SessionEntity.create(validProps());
      expect(scheduled.canStart()).toBe(true);
      expect(scheduled.canEnd()).toBe(false);

      const active = scheduled.start(new Date('2025-01-15T09:00:00Z'));
      expect(active.status).toBe('active');
      expect(active.isActive()).toBe(true);
      expect(active.canStart()).toBe(false);
      expect(active.canEnd()).toBe(true);

      const ended = active.end(new Date('2025-01-15T11:00:00Z'));
      expect(ended.status).toBe('ended');
      expect(ended.hasEnded()).toBe(true);
      expect(ended.canEnd()).toBe(false);
    });

    it('follows scheduled → cancelled lifecycle', () => {
      const scheduled = SessionEntity.create(validProps());
      expect(scheduled.canCancel()).toBe(true);

      const cancelled = scheduled.cancel();
      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.hasEnded()).toBe(true);
    });

    it('throws ConflictError when starting an active session', () => {
      const active = SessionEntity.fromRecord(
        validProps({ status: 'active', actualStartAt: new Date() })
      );
      expect(() => active.start()).toThrow(ConflictError);
    });

    it('throws ConflictError when ending a scheduled session', () => {
      const scheduled = SessionEntity.create(validProps());
      expect(() => scheduled.end()).toThrow(ConflictError);
    });

    it('throws ConflictError when cancelling an active session', () => {
      const active = SessionEntity.fromRecord(
        validProps({ status: 'active', actualStartAt: new Date() })
      );
      expect(() => active.cancel()).toThrow(ConflictError);
    });
  });

  describe('duration helpers', () => {
    it('calculates scheduled duration in minutes', () => {
      const entity = SessionEntity.create(validProps());
      expect(entity.getScheduledDurationMinutes()).toBe(120);
    });

    it('calculates actual duration when start and end are set', () => {
      const entity = SessionEntity.fromRecord(
        validProps({
          status: 'ended',
          actualStartAt: new Date('2025-01-15T09:05:00Z'),
          actualEndAt: new Date('2025-01-15T10:35:00Z')
        })
      );
      expect(entity.getActualDurationMinutes()).toBe(90);
    });

    it('returns null for actual duration when not ended', () => {
      const entity = SessionEntity.create(validProps());
      expect(entity.getActualDurationMinutes()).toBeNull();
    });
  });
});
