import type {
  ClassroomRepository,
  SessionRepository,
  PresenceRepository,
  HelpRepository,
  NinjaRepository,
  PersonRepository,
  PinRepository,
  RealtimeNotificationRepository,
  EventStore,
  Clock,
  IdGenerator
} from '$lib/application/ports';
import { SystemClock, UuidIdGenerator } from '$lib/infrastructure/services';

export interface AppEnvironment {
  classroomRepo: ClassroomRepository;
  sessionRepo: SessionRepository;
  presenceRepo: PresenceRepository;
  helpRepo: HelpRepository;
  ninjaRepo: NinjaRepository;
  personRepo: PersonRepository;
  pinRepo: PinRepository;
  realtimeNotificationRepo: RealtimeNotificationRepository;
  eventStore: EventStore;
  clock: Clock;
  idGenerator: IdGenerator;
}

// Module-level singleton — safe for adapter-node (long-running process)
let _env: AppEnvironment | null = null;

export function getEnvironment(): AppEnvironment {
  if (_env) return _env;

  // TODO: Replace stubs with Prisma implementations in Phase 4
  const notImplemented = (name: string) =>
    new Proxy(
      {},
      {
        get(_, prop) {
          if (typeof prop === 'string') {
            return () => {
              throw new Error(`${name}.${prop}() not implemented yet`);
            };
          }
        }
      }
    );

  _env = {
    classroomRepo: notImplemented('classroomRepo') as unknown as ClassroomRepository,
    sessionRepo: notImplemented('sessionRepo') as unknown as SessionRepository,
    presenceRepo: notImplemented('presenceRepo') as unknown as PresenceRepository,
    helpRepo: notImplemented('helpRepo') as unknown as HelpRepository,
    ninjaRepo: notImplemented('ninjaRepo') as unknown as NinjaRepository,
    personRepo: notImplemented('personRepo') as unknown as PersonRepository,
    pinRepo: notImplemented('pinRepo') as unknown as PinRepository,
    realtimeNotificationRepo: notImplemented(
      'realtimeNotificationRepo'
    ) as unknown as RealtimeNotificationRepository,
    eventStore: notImplemented('eventStore') as unknown as EventStore,
    clock: new SystemClock(),
    idGenerator: new UuidIdGenerator()
  };

  return _env;
}
