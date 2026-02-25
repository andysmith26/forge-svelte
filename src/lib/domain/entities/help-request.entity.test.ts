import { describe, it, expect } from 'vitest';
import { HelpRequestEntity, type HelpRequestProps } from './help-request.entity';
import { ValidationError, ConflictError } from '$lib/domain/errors';

function validProps(overrides?: Partial<HelpRequestProps>): HelpRequestProps {
  return {
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
    createdAt: new Date('2025-01-15T10:00:00Z'),
    ...overrides
  };
}

describe('HelpRequestEntity', () => {
  describe('create', () => {
    it('succeeds with valid props', () => {
      const entity = HelpRequestEntity.create(validProps());
      expect(entity.id).toBe('req-1');
      expect(entity.status).toBe('pending');
    });

    it('throws ValidationError for empty description', () => {
      expect(() => HelpRequestEntity.create(validProps({ description: '' }))).toThrow(
        ValidationError
      );
    });

    it('throws ValidationError for description over 1000 chars', () => {
      expect(() => HelpRequestEntity.create(validProps({ description: 'a'.repeat(1001) }))).toThrow(
        ValidationError
      );
    });

    it('throws ValidationError for empty whatITried', () => {
      expect(() => HelpRequestEntity.create(validProps({ whatITried: '' }))).toThrow(
        ValidationError
      );
    });

    it('throws ValidationError for whatITried under 20 characters', () => {
      expect(() => HelpRequestEntity.create(validProps({ whatITried: 'too short' }))).toThrow(
        ValidationError
      );
    });

    it('throws ValidationError for whatITried over 1000 chars', () => {
      expect(() => HelpRequestEntity.create(validProps({ whatITried: 'a'.repeat(1001) }))).toThrow(
        ValidationError
      );
    });

    it('throws ValidationError for invalid urgency', () => {
      expect(() => HelpRequestEntity.create(validProps({ urgency: 'invalid' as never }))).toThrow(
        ValidationError
      );
    });
  });

  describe('state machine', () => {
    it('can claim a pending request', () => {
      const entity = HelpRequestEntity.create(validProps());
      expect(entity.canClaim()).toBe(true);

      const claimed = entity.claim('teacher-1', new Date('2025-01-15T10:05:00Z'));
      expect(claimed.status).toBe('claimed');
      expect(claimed.claimedById).toBe('teacher-1');
    });

    it('cannot claim a non-pending request', () => {
      const claimed = HelpRequestEntity.fromRecord(
        validProps({ status: 'claimed', claimedById: 'teacher-1', claimedAt: new Date() })
      );
      expect(claimed.canClaim()).toBe(false);
      expect(() => claimed.claim('teacher-2')).toThrow(ConflictError);
    });

    it('can resolve a claimed request', () => {
      const claimed = HelpRequestEntity.fromRecord(
        validProps({ status: 'claimed', claimedById: 'teacher-1', claimedAt: new Date() })
      );
      expect(claimed.canResolve()).toBe(true);

      const resolved = claimed.resolve('Fixed it', new Date('2025-01-15T10:10:00Z'));
      expect(resolved.status).toBe('resolved');
      expect(resolved.resolutionNotes).toBe('Fixed it');
    });

    it('cannot resolve a pending request', () => {
      const entity = HelpRequestEntity.create(validProps());
      expect(entity.canResolve()).toBe(false);
      expect(() => entity.resolve()).toThrow(ConflictError);
    });

    it('can cancel from pending', () => {
      const entity = HelpRequestEntity.create(validProps());
      expect(entity.canCancel()).toBe(true);

      const cancelled = entity.cancel('No longer needed');
      expect(cancelled.status).toBe('cancelled');
    });

    it('can cancel from claimed', () => {
      const claimed = HelpRequestEntity.fromRecord(
        validProps({ status: 'claimed', claimedById: 'teacher-1', claimedAt: new Date() })
      );
      expect(claimed.canCancel()).toBe(true);
    });

    it('cannot cancel a resolved request', () => {
      const resolved = HelpRequestEntity.fromRecord(
        validProps({ status: 'resolved', resolvedAt: new Date() })
      );
      expect(resolved.canCancel()).toBe(false);
      expect(() => resolved.cancel()).toThrow(ConflictError);
    });
  });

  describe('getWaitTimeMinutes', () => {
    it('returns minutes from creation to now for pending requests', () => {
      const entity = HelpRequestEntity.create(
        validProps({ createdAt: new Date('2025-01-15T10:00:00Z') })
      );
      const waitTime = entity.getWaitTimeMinutes(new Date('2025-01-15T10:15:00Z'));
      expect(waitTime).toBe(15);
    });

    it('returns minutes from creation to claim for claimed requests', () => {
      const entity = HelpRequestEntity.fromRecord(
        validProps({
          status: 'claimed',
          createdAt: new Date('2025-01-15T10:00:00Z'),
          claimedAt: new Date('2025-01-15T10:08:00Z')
        })
      );
      const waitTime = entity.getWaitTimeMinutes(new Date('2025-01-15T11:00:00Z'));
      expect(waitTime).toBe(8);
    });
  });
});
