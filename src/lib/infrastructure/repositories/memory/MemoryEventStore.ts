import type {
  EventStore,
  AppendEventInput,
  StoredEvent,
  EventFilters,
  IdGenerator
} from '$lib/application/ports';
import type {
  PersonSignedInPayload,
  PersonSignedOutPayload,
  SessionStartedPayload,
  SessionEndedPayload,
  HelpRequestedPayload,
  HelpClaimedPayload,
  HelpUnclaimedPayload,
  HelpResolvedPayload,
  HelpCancelledPayload
} from '$lib/domain/events';
import type { HelpUrgency } from '$lib/domain/types/help-urgency';
import type { MemoryStore } from './MemoryStore';

export class MemoryEventStore implements EventStore {
  constructor(
    private readonly store: MemoryStore,
    private readonly idGen: IdGenerator
  ) {}

  async append(input: AppendEventInput): Promise<StoredEvent> {
    const event: StoredEvent = {
      id: this.idGen.generate(),
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
    this.store.domainEvents.push(event);
    this.applyProjection(event);
    return event;
  }

  async appendAndEmit(input: AppendEventInput): Promise<StoredEvent> {
    return this.append(input);
  }

  async loadEvents(filters?: EventFilters): Promise<StoredEvent[]> {
    return this.store.domainEvents.filter((e) => {
      if (filters?.schoolId && e.schoolId !== filters.schoolId) return false;
      if (filters?.classroomId && e.classroomId !== filters.classroomId) return false;
      if (filters?.sessionId && e.sessionId !== filters.sessionId) return false;
      if (filters?.eventType && e.eventType !== filters.eventType) return false;
      if (filters?.entityType && e.entityType !== filters.entityType) return false;
      if (filters?.entityId && e.entityId !== filters.entityId) return false;
      return true;
    });
  }

  async countEvents(filters?: EventFilters): Promise<number> {
    return (await this.loadEvents(filters)).length;
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const before = this.store.domainEvents.length;
    this.store.domainEvents = this.store.domainEvents.filter(
      (e) => e.createdAt.getTime() >= date.getTime()
    );
    return before - this.store.domainEvents.length;
  }

  private applyProjection(event: StoredEvent): void {
    switch (event.eventType) {
      case 'PERSON_SIGNED_IN':
        this.projectSignIn(event);
        break;
      case 'PERSON_SIGNED_OUT':
        this.projectSignOut(event);
        break;
      case 'SESSION_STARTED':
        this.projectSessionStarted(event);
        break;
      case 'SESSION_ENDED':
        this.projectSessionEnded(event);
        break;
      case 'HELP_REQUESTED':
        this.projectHelpRequested(event);
        break;
      case 'HELP_CLAIMED':
        this.projectHelpClaimed(event);
        break;
      case 'HELP_UNCLAIMED':
        this.projectHelpUnclaimed(event);
        break;
      case 'HELP_RESOLVED':
        this.projectHelpResolved(event);
        break;
      case 'HELP_CANCELLED':
        this.projectHelpCancelled(event);
        break;
    }
  }

  private projectSignIn(event: StoredEvent): void {
    const p = event.payload as unknown as PersonSignedInPayload;

    // Check for existing sign-in (re-sign-in after sign-out)
    for (const [id, s] of this.store.signIns.entries()) {
      if (s.sessionId === p.sessionId && s.personId === p.personId) {
        this.store.signIns.set(id, {
          ...s,
          signedInAt: event.createdAt,
          signedOutAt: null,
          signedInById: p.signedInBy,
          signedOutById: null,
          signoutType: null
        });
        return;
      }
    }

    this.store.signIns.set(p.signInId, {
      id: p.signInId,
      sessionId: p.sessionId,
      personId: p.personId,
      signedInAt: event.createdAt,
      signedOutAt: null,
      signedInById: p.signedInBy,
      signedOutById: null,
      signoutType: null
    });
  }

  private projectSignOut(event: StoredEvent): void {
    const p = event.payload as unknown as PersonSignedOutPayload;
    const existing = this.store.signIns.get(p.signInId);
    if (existing) {
      this.store.signIns.set(p.signInId, {
        ...existing,
        signedOutAt: event.createdAt,
        signedOutById: p.signedOutBy ?? null,
        signoutType: p.signoutType
      });
    }
  }

  private projectSessionStarted(event: StoredEvent): void {
    const p = event.payload as unknown as SessionStartedPayload;
    const session = this.store.sessions.get(p.sessionId);
    if (session) {
      this.store.sessions.set(p.sessionId, {
        ...session,
        status: 'active',
        actualStartAt: event.createdAt
      });
    }
  }

  private projectSessionEnded(event: StoredEvent): void {
    const p = event.payload as unknown as SessionEndedPayload;
    const session = this.store.sessions.get(p.sessionId);
    if (session) {
      this.store.sessions.set(p.sessionId, {
        ...session,
        status: 'ended',
        actualEndAt: event.createdAt
      });
    }
    for (const [id, s] of this.store.signIns.entries()) {
      if (s.sessionId === p.sessionId && s.signedOutAt === null) {
        this.store.signIns.set(id, {
          ...s,
          signedOutAt: event.createdAt,
          signoutType: 'session_end'
        });
      }
    }
  }

  private projectHelpRequested(event: StoredEvent): void {
    const p = event.payload as unknown as HelpRequestedPayload;
    this.store.helpRequests.set(p.requestId, {
      id: p.requestId,
      classroomId: p.classroomId,
      sessionId: p.sessionId,
      requesterId: p.requesterId,
      categoryId: p.categoryId,
      description: p.description,
      whatITried: p.whatITried,
      urgency: p.urgency as HelpUrgency,
      status: 'pending',
      claimedById: null,
      claimedAt: null,
      resolvedAt: null,
      cancelledAt: null,
      resolutionNotes: null,
      cancellationReason: null,
      createdAt: event.createdAt
    });
  }

  private projectHelpClaimed(event: StoredEvent): void {
    const p = event.payload as unknown as HelpClaimedPayload;
    const req = this.store.helpRequests.get(p.requestId);
    if (req) {
      this.store.helpRequests.set(p.requestId, {
        ...req,
        status: 'claimed',
        claimedById: p.claimedById,
        claimedAt: event.createdAt
      });
    }
  }

  private projectHelpUnclaimed(event: StoredEvent): void {
    const p = event.payload as unknown as HelpUnclaimedPayload;
    const req = this.store.helpRequests.get(p.requestId);
    if (req) {
      this.store.helpRequests.set(p.requestId, {
        ...req,
        status: 'pending',
        claimedById: null,
        claimedAt: null
      });
    }
  }

  private projectHelpResolved(event: StoredEvent): void {
    const p = event.payload as unknown as HelpResolvedPayload;
    const req = this.store.helpRequests.get(p.requestId);
    if (req) {
      this.store.helpRequests.set(p.requestId, {
        ...req,
        status: 'resolved',
        resolvedAt: event.createdAt,
        resolutionNotes: p.resolutionNotes
      });
    }
  }

  private projectHelpCancelled(event: StoredEvent): void {
    const p = event.payload as unknown as HelpCancelledPayload;
    const req = this.store.helpRequests.get(p.requestId);
    if (req) {
      this.store.helpRequests.set(p.requestId, {
        ...req,
        status: 'cancelled',
        cancelledAt: event.createdAt,
        cancellationReason: p.reason
      });
    }
  }
}
