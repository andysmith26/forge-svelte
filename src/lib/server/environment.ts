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
  IdGenerator
} from '$lib/application/ports';
import type { MemoryStore } from '$lib/infrastructure/repositories/memory/MemoryStore';
import type { MemoryPinRepository } from '$lib/infrastructure/repositories/memory/MemoryPinRepository';
import { PUBLIC_DEMO_MODE } from '$env/static/public';
import { UuidIdGenerator } from '$lib/infrastructure/services';

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
  idGenerator: IdGenerator;
}

export const isDemoMode = PUBLIC_DEMO_MODE === 'true';

// Module-level singleton — safe for adapter-node (long-running process)
let _env: AppEnvironment | null = null;
let _envPromise: Promise<AppEnvironment> | null = null;

// Demo-specific exports (only populated in demo mode)
let _demoStore: MemoryStore | null = null;
let _demoPinRepo: MemoryPinRepository | null = null;

export function getDemoStore(): MemoryStore | null {
  return _demoStore;
}

export function getDemoPinRepo(): MemoryPinRepository | null {
  return _demoPinRepo;
}

export function getEnvironment(): AppEnvironment {
  if (_env) return _env;
  throw new Error(
    'Environment not initialized. Ensure initEnvironment() is called in hooks.server.ts.'
  );
}

export async function initEnvironment(): Promise<AppEnvironment> {
  if (_env) return _env;
  if (_envPromise) return _envPromise;

  _envPromise = isDemoMode ? createDemoEnvironment() : createProductionEnvironment();
  _env = await _envPromise;
  return _env;
}

async function createDemoEnvironment(): Promise<AppEnvironment> {
  const mem = await import('$lib/infrastructure/repositories/memory');
  const { seedDemoData } = await import('./demo/seedData');

  const store = new mem.MemoryStore();
  const idGenerator = new UuidIdGenerator();
  const pinRepo = new mem.MemoryPinRepository(store, idGenerator);

  _demoStore = store;
  _demoPinRepo = pinRepo;

  seedDemoData(store, pinRepo);

  return {
    classroomRepo: new mem.MemoryClassroomRepository(store),
    sessionRepo: new mem.MemorySessionRepository(store, idGenerator),
    presenceRepo: new mem.MemoryPresenceRepository(store, idGenerator),
    helpRepo: new mem.MemoryHelpRepository(store, idGenerator),
    ninjaRepo: new mem.MemoryNinjaRepository(store, idGenerator),
    personRepo: new mem.MemoryPersonRepository(store, idGenerator),
    pinRepo,
    realtimeNotificationRepo: new mem.MemoryRealtimeNotificationRepository(),
    eventStore: new mem.MemoryEventStore(store, idGenerator),
    idGenerator
  };
}

async function createProductionEnvironment(): Promise<AppEnvironment> {
  const { prisma } = await import('./prisma');
  const repos = await import('$lib/infrastructure/repositories');
  const events = await import('$lib/infrastructure/events');

  const projectorRegistry = events.createProjectorRegistry();

  return {
    classroomRepo: new repos.PrismaClassroomRepository(prisma),
    sessionRepo: new repos.PrismaSessionRepository(prisma),
    presenceRepo: new repos.PrismaPresenceRepository(prisma),
    helpRepo: new repos.PrismaHelpRepository(prisma),
    ninjaRepo: new repos.PrismaNinjaRepository(prisma),
    personRepo: new repos.PrismaPersonRepository(prisma),
    pinRepo: new repos.PrismaPinRepository(prisma),
    realtimeNotificationRepo: new repos.PrismaRealtimeNotificationRepository(prisma),
    eventStore: new events.PrismaEventStore(prisma, projectorRegistry),
    idGenerator: new UuidIdGenerator()
  };
}
