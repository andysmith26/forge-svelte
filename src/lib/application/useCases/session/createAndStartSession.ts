import type { SessionRepository, SessionRecord } from '$lib/application/ports/SessionRepository';
import type { ClassroomRepository } from '$lib/application/ports/ClassroomRepository';
import type { EventStore } from '$lib/application/ports/EventStore';
import type { Clock } from '$lib/application/ports/Clock';
import { createSession } from './createSession';
import { startSession } from './startSession';
import type { Result } from '$lib/types/result';
import { err } from '$lib/types/result';

const DEFAULT_DROP_IN_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

export type CreateAndStartSessionError =
  | { type: 'ACTIVE_SESSION_EXISTS' }
  | { type: 'SESSION_NOT_FOUND'; sessionId: string }
  | { type: 'CLASSROOM_NOT_FOUND' }
  | { type: 'INVALID_STATE'; currentStatus: string }
  | { type: 'INTERNAL_ERROR'; message: string };

export async function createAndStartSession(
  deps: {
    sessionRepo: SessionRepository;
    classroomRepo: ClassroomRepository;
    eventStore: EventStore;
    clock: Clock;
  },
  input: { classroomId: string; actorId: string }
): Promise<Result<SessionRecord, CreateAndStartSessionError>> {
  const now = deps.clock.now();

  const createResult = await createSession(
    { sessionRepo: deps.sessionRepo },
    {
      classroomId: input.classroomId,
      name: null,
      sessionType: 'drop_in',
      scheduledDate: now,
      startTime: now,
      endTime: new Date(now.getTime() + DEFAULT_DROP_IN_DURATION_MS)
    }
  );

  if (createResult.status === 'err') {
    return err(createResult.error);
  }

  const startResult = await startSession(
    {
      sessionRepo: deps.sessionRepo,
      classroomRepo: deps.classroomRepo,
      eventStore: deps.eventStore
    },
    { sessionId: createResult.value.id, actorId: input.actorId }
  );

  if (startResult.status === 'err') {
    return err(startResult.error);
  }

  return startResult;
}
