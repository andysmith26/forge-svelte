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
import {
  PrismaClassroomRepository,
  PrismaSessionRepository,
  PrismaPresenceRepository,
  PrismaHelpRepository,
  PrismaNinjaRepository,
  PrismaPersonRepository,
  PrismaPinRepository,
  PrismaRealtimeNotificationRepository
} from '$lib/infrastructure/repositories';
import { PrismaEventStore, createProjectorRegistry } from '$lib/infrastructure/events';
import { prisma } from './prisma';

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

  const projectorRegistry = createProjectorRegistry();

  _env = {
    classroomRepo: new PrismaClassroomRepository(prisma),
    sessionRepo: new PrismaSessionRepository(prisma),
    presenceRepo: new PrismaPresenceRepository(prisma),
    helpRepo: new PrismaHelpRepository(prisma),
    ninjaRepo: new PrismaNinjaRepository(prisma),
    personRepo: new PrismaPersonRepository(prisma),
    pinRepo: new PrismaPinRepository(prisma),
    realtimeNotificationRepo: new PrismaRealtimeNotificationRepository(prisma),
    eventStore: new PrismaEventStore(prisma, projectorRegistry),
    clock: new SystemClock(),
    idGenerator: new UuidIdGenerator()
  };

  return _env;
}
