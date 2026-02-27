# Forge — Architecture

This document describes how Forge implements the principles defined in [PRINCIPLES_TECHNICAL.md](PRINCIPLES_TECHNICAL.md) within a SvelteKit application.

---

## Tech Stack

| Concern         | Technology                               |
| --------------- | ---------------------------------------- |
| Framework       | SvelteKit 2 + Svelte 5                   |
| Language        | TypeScript (strict)                      |
| Styling         | Tailwind CSS 4                           |
| ORM             | Prisma                                   |
| Auth (teachers) | Auth.js (@auth/sveltekit) + Google OAuth |
| Auth (students) | PIN-based cookie sessions                |
| Testing         | Vitest                                   |
| Package manager | pnpm                                     |
| Build           | Vite                                     |

---

## Directory Map

```
src/
├── lib/
│   ├── domain/                    # Layer 1 — Pure business logic
│   │   ├── entities/              # Domain entities (classes + types)
│   │   ├── errors/                # Domain error hierarchy
│   │   ├── events/                # Domain event definitions
│   │   ├── modules/               # Feature module metadata
│   │   └── types/                 # Value types, enums, helpers
│   │
│   ├── application/               # Layer 2 — Use cases & ports
│   │   ├── ports/                 # Repository & service interfaces
│   │   ├── useCases/              # Grouped by domain area
│   │   │   ├── session/
│   │   │   ├── presence/
│   │   │   ├── help/
│   │   │   ├── classroom/
│   │   │   ├── ninja/
│   │   │   ├── person/
│   │   │   └── pin/
│   │   └── smartboard/            # Data providers for public displays
│   │
│   ├── infrastructure/            # Layer 3 — Adapters
│   │   ├── repositories/          # Prisma implementations
│   │   │   └── memory/            # In-memory implementations (demo/test)
│   │   ├── events/                # Event store + projectors
│   │   └── services/              # IdGenerator, HashService, TokenGenerator
│   │
│   ├── server/                    # Server-only glue
│   │   ├── environment.ts         # Composition root
│   │   ├── auth.ts                # Auth.js configuration
│   │   ├── pinAuth.ts             # PIN session resolution
│   │   ├── prisma.ts              # Prisma client singleton
│   │   └── demo/                  # Demo data seeding
│   │
│   ├── components/                # Shared UI components
│   └── types/                     # Shared utility types (Result)
│
├── routes/                        # Layer 4 — SvelteKit pages & API
│   ├── classroom/[classroomId]/   # Classroom pages
│   ├── display/[code]/            # Public smartboard display
│   ├── pin/                       # Student PIN login
│   └── api/                       # API endpoints
│
└── test-utils/                    # Test mocks & factories
```

---

## Layer 1: Domain

### Entities

Forge entities use **Level 2** (class-based) design from the principles doc. Each entity has:

- **Private constructor** — prevents direct instantiation
- **`static create()`** — validates input, enforces invariants
- **`static fromRecord()`** — hydrates from persistence without re-validating
- **Readonly getters** — immutability enforced structurally
- **State machine methods** — `canStart()`, `canClaim()`, etc.

| Entity              | Design | Key Behavior                                          |
| ------------------- | ------ | ----------------------------------------------------- |
| `SessionEntity`     | Class  | State machine: scheduled → active → ended/cancelled   |
| `PersonEntity`      | Class  | Profile management, display name generation           |
| `ClassroomEntity`   | Class  | Module configuration, settings validation             |
| `SignInEntity`      | Class  | Attendance tracking with duration calculation         |
| `HelpRequestEntity` | Class  | State machine: pending → claimed → resolved/cancelled |
| `Membership`        | Type   | Plain data — role, active status                      |
| `NinjaDomain`       | Type   | Plain data — skill category definition                |
| `NinjaAssignment`   | Type   | Plain data — person-to-domain mapping                 |

**Why Level 2 for the main entities:** Session and HelpRequest have state machines with 3+ transition guards scattered across use cases — the exact signal described in the principles doc for upgrading from plain types. Membership, NinjaDomain, and NinjaAssignment remain plain types because they're simple data containers with no lifecycle.

### Errors

Domain errors extend a `DomainError` base class:

| Error                  | Purpose                            |
| ---------------------- | ---------------------------------- |
| `ValidationError`      | Invalid input (carries `issues[]`) |
| `NotFoundError`        | Entity not found                   |
| `ConflictError`        | Invalid state transition           |
| `NotAuthorizedError`   | Authentication failure             |
| `ForbiddenError`       | Authorization failure              |
| `FeatureDisabledError` | Classroom module not enabled       |

### Events

Domain events use discriminated unions with typed payloads:

```
SESSION_STARTED, SESSION_ENDED
PERSON_SIGNED_IN, PERSON_SIGNED_OUT
HELP_REQUESTED, HELP_CLAIMED, HELP_UNCLAIMED, HELP_RESOLVED, HELP_CANCELLED
```

Each event carries `EventMetadata` (eventId, occurredAt, correlationId, version) and a typed payload.

### Modules

Feature modules are defined as domain objects in `src/lib/domain/modules/`:

- `presenceModule` — Attendance tracking
- `helpModule` — Help queue
- `profileModule` — User profile customization
- `projectsModule` — Project management (coming soon)
- `choresModule` — Chore assignments (coming soon)

Each module defines: id, name, description, navigation item, smartboard panel, status, default enabled state, and visibility by role. Modules are toggled per-classroom via `ClassroomSettings`.

---

## Layer 2: Application

### Ports

All external dependencies are accessed through port interfaces defined in `src/lib/application/ports/`:

**Repository ports:**

| Port                             | Responsibility                 |
| -------------------------------- | ------------------------------ |
| `SessionRepository`              | Session CRUD + queries         |
| `PersonRepository`               | People, memberships, profiles  |
| `ClassroomRepository`            | Classrooms, members, settings  |
| `PresenceRepository`             | Sign-in/out, presence lists    |
| `HelpRepository`                 | Help requests, categories      |
| `NinjaRepository`                | Skill domains, assignments     |
| `PinRepository`                  | PIN auth, sessions, candidates |
| `RealtimeNotificationRepository` | WebSocket notifications        |
| `EventStore`                     | Domain event persistence       |

**Service ports:**

| Port             | Responsibility                    |
| ---------------- | --------------------------------- |
| `IdGenerator`    | UUID generation                   |
| `HashService`    | Password/PIN hashing + comparison |
| `TokenGenerator` | Secure token generation           |

### Use Cases

Every use case follows the same pattern:

```typescript
export async function verbNoun(
  deps: { portA: PortA; portB: PortB },
  input: { ... }
): Promise<Result<SuccessType, ErrorType>>
```

**Organized by domain area:**

| Area         | Use Cases                                                                                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session/`   | createSession, createAndStartSession, startSession, endSession, cancelSession, getSession, getCurrentSession, getPublicCurrentSession, listSessions                                                            |
| `presence/`  | signIn, signOut, getSignInStatus, listPresent, listPresentPublic, listSignInsForSession                                                                                                                        |
| `help/`      | requestHelp, claimHelpRequest, unclaimHelpRequest, resolveHelpRequest, cancelHelpRequest, getHelpQueue, getHelpQueuePublic, getMyOpenRequests, listCategories, createCategory, updateCategory, archiveCategory |
| `classroom/` | getClassroom, listMyClassrooms, getClassroomSettings, updateModules                                                                                                                                            |
| `ninja/`     | listDomains, createDomain, updateDomain, archiveDomain, getNinjaPresence, getDomainsWithNinjas, assignNinja, revokeNinja                                                                                       |
| `person/`    | getProfile, updateProfile, listStudents, addStudent, updateStudent, removeStudent, bulkImportStudents                                                                                                          |
| `pin/`       | loginWithPin, logoutPin, generatePin, generateAllPins, setPin, removePin, listStudentsWithPins                                                                                                                 |

**Authorization** is handled by `checkAuthorization.ts` which exports `requireMember()`, `requireTeacher()`, and `requireSignedIn()` — each returns `Result<Membership, AuthorizationError>` for composition with other use cases.

### Result Type

Defined in `src/lib/types/result.ts`:

```typescript
type Result<OkType, ErrType> = Ok<OkType> | Err<ErrType>;
// Discriminant: status: 'ok' | 'err'
```

With helper constructors `ok()`, `err()` and type guards `isOk()`, `isErr()`.

Every use case defines its error type as a discriminated union:

```typescript
type RequestHelpError =
  | { type: 'NOT_SIGNED_IN' }
  | { type: 'ALREADY_HAS_OPEN_REQUEST' }
  | { type: 'NO_ACTIVE_SESSION' }
  | { type: 'FEATURE_DISABLED' }
  | { type: 'INTERNAL_ERROR'; message: string };
```

### Smartboard Providers

`src/lib/application/smartboard/` contains data providers that compose use cases for public classroom displays. Each implements `SmartboardDataProvider<TDeps, TData>` and aggregates data from multiple use cases into a single response for the display route.

---

## Layer 3: Infrastructure

### Repository Implementations

Every repository port has two implementations:

| Implementation Pattern     | Storage    | Used In          |
| -------------------------- | ---------- | ---------------- |
| `Prisma{Entity}Repository` | PostgreSQL | Production       |
| `Memory{Entity}Repository` | In-memory  | Demo mode, tests |

Memory repositories share a `MemoryStore` — a single in-memory data structure that holds all entities. This makes demo mode fully functional without a database.

### Services

| Service                | Port             | Implementation                 |
| ---------------------- | ---------------- | ------------------------------ |
| `UuidIdGenerator`      | `IdGenerator`    | `crypto.randomUUID()`          |
| `BcryptHashService`    | `HashService`    | bcryptjs with 10 rounds        |
| `CryptoTokenGenerator` | `TokenGenerator` | `crypto.randomBytes(32).hex()` |

### Event Store

`PrismaEventStore` persists domain events and dispatches them to projectors. Projectors are registered in a `ProjectorRegistry` and react to specific event types to maintain read-optimized state.

---

## Layer 4: UI (Routes)

### Route Structure

| Route                               | Purpose                         |
| ----------------------------------- | ------------------------------- |
| `/`                                 | Home — list classrooms          |
| `/pin`                              | Student PIN login               |
| `/classroom/[classroomId]`          | Classroom layout + session mgmt |
| `/classroom/[classroomId]/presence` | Attendance tracking             |
| `/classroom/[classroomId]/help`     | Help queue                      |
| `/classroom/[classroomId]/roster`   | Student management + PINs       |
| `/classroom/[classroomId]/ninja`    | Ninja domains & assignments     |
| `/classroom/[classroomId]/profile`  | Student profile editing         |
| `/classroom/[classroomId]/settings` | Module configuration            |
| `/display/[code]`                   | Public smartboard display       |
| `/api/pin/login`                    | PIN auth endpoint               |
| `/api/pin/logout`                   | PIN logout endpoint             |
| `/api/cron/cleanup`                 | Expire stale PIN sessions       |

### UI → Use Case Pattern

Every `+page.server.ts` follows the same structure:

1. Get `AppEnvironment` from `getEnvironment()`
2. Resolve the actor from `locals.actor`
3. Call use cases with destructured port dependencies
4. Handle `Result` — map `ok` to page data, map `err` to SvelteKit `fail()`

```typescript
const env = getEnvironment();
const result = await signIn(
  { presenceRepo: env.presenceRepo, eventStore: env.eventStore },
  { sessionId, personId: actor.personId }
);
if (result.status === 'err') return fail(400, { error: result.error.type });
```

No route directly instantiates a repository or imports from infrastructure.

---

## Composition Root

`src/lib/server/environment.ts` assembles all dependencies based on runtime mode:

```typescript
interface AppEnvironment {
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
  hashService: HashService;
  tokenGenerator: TokenGenerator;
}
```

- **Production mode:** Prisma repositories + PostgreSQL
- **Demo mode:** Memory repositories with seeded data, no database required

The environment is initialized once in `hooks.server.ts` and accessed via `getEnvironment()` in routes.

---

## Authentication

Forge supports two authentication methods:

### Teacher Auth (OAuth)

- Auth.js with Google provider
- JWT session strategy
- On sign-in, links Google account to existing `Person` record by email
- Session populates `personId` for use case calls

### Student Auth (PIN)

- Students log in with classroom code + numeric PIN
- Cookie-based sessions (`forge_pin_session`)
- 30-minute inactivity timeout, refreshed on activity
- PIN hashes stored via `HashService` port
- Tokens generated via `TokenGenerator` port

### Unified Actor

`hooks.server.ts` resolves a unified actor from either auth method:

```typescript
locals.actor = { personId, authType: 'google' | 'pin', pinClassroomId? }
```

Routes use `locals.actor` without caring which auth method was used.

---

## Testing

### Test Utilities

Located in `src/test-utils/mocks.ts`, isolated from production code.

Mock factories for every port:

- `createMockClassroomRepo()`
- `createMockSessionRepo()`
- `createMockPresenceRepo()`
- `createMockHelpRepo()`
- `createMockEventStore()`
- `createMockIdGenerator()`
- `createMockHashService()`
- `createMockTokenGenerator()`

Each returns a fully-typed mock with `vi.fn()` stubs and sensible defaults.

### Test Strategy

| Layer     | Test Type         | Location                                    |
| --------- | ----------------- | ------------------------------------------- |
| Domain    | Unit tests        | `src/lib/domain/entities/*.test.ts`         |
| Use Cases | Integration tests | `src/lib/application/useCases/**/*.test.ts` |

---

## Dependency Enforcement

ESLint rules in `eslint.config.js` enforce layer boundaries at build time:

- Domain must not import from application, infrastructure, or routes
- Use cases must not import from infrastructure
- Infrastructure must not import from use cases or routes
- Routes must not import directly from infrastructure

Violations cause lint errors, preventing accidental coupling.
