# Forge — Architecture

This document describes how Forge is built. For what Forge is and why, see [01-vision-and-scope.md](01-vision-and-scope.md). For the learning principles that constrain design, see [02-learning-principles.md](02-learning-principles.md).

---

## Design Values

1. **Clarity over cleverness** — Code should be readable and predictable.
2. **Explicit over implicit** — Dependencies, data flow, and error states should be visible.
3. **Testability by design** — Architecture enables testing at every layer.
4. **Framework independence** — Business logic survives framework changes.

---

## Foundational Commitments

These commitments flow from the [01-vision-and-scope.md](01-vision-and-scope.md) and shape every architectural decision.

**Event-sourced.** All state changes occur through append-only domain events. Current state is derived by replaying or projecting those events into read models.

- **Complete audit trail.** Every action is recorded. Teacher interventions are labeled (`byTeacher: true`) and never overwrite student events.
- **No data loss.** Bugs in how we display data can be fixed without losing the underlying record. Projections can be rebuilt from events at any time.
- **Evolvable views.** New ways of looking at classroom data can be added retroactively by writing new projections over existing events.

**Sessions are time containers.** Sessions bound presence and help requests. They do not constrain project or chore persistence. Projects and chores live across sessions — because construction doesn't stop when the bell rings.

**Real-time where it matters.** Presence, help queue, and smartboard views update within 2 seconds. Everything else updates on navigation or refresh.

---

## Layered Architecture

Forge follows a **hexagonal architecture** (ports & adapters) with a domain-centric, use-case-oriented design.

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│         (Routes, Pages, Components, View Logic)             │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│            (Use Cases, Ports, Orchestration)                │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                           │
│      (Entities, Value Objects, Domain Events, Invariants)   │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
│   (Repositories, External APIs, Storage, Framework Glue)    │
└─────────────────────────────────────────────────────────────┘
```

Dependencies flow inward: UI → Application → Domain ← Infrastructure.

### Dependency Rules

| Layer          | May Import From                 |
| -------------- | ------------------------------- |
| Domain         | Only other domain modules       |
| Ports          | Domain (for types)              |
| Use Cases      | Domain, Ports, other Use Cases  |
| Infrastructure | Domain, Ports (never use cases) |
| UI             | Use Cases, Domain (for types)   |

ESLint rules in `eslint.config.js` enforce these boundaries at build time. Violations cause lint errors, preventing accidental coupling.

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
| Realtime        | Supabase Realtime (Postgres changes)     |
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
│   │   │   ├── ninja/             # Peer expertise (legacy name)
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
│   ├── realtime/                   # Client-side realtime subscriptions
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

### Entity Design

Forge uses a **complexity gradient** for entity design. Most entities start as plain types; entities with state machines or lifecycle complexity use class-based design.

**Class-based entities** (Level 2) have:

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
| `NinjaDomain`       | Type   | Plain data — peer expertise category definition       |
| `NinjaAssignment`   | Type   | Plain data — person-to-expertise mapping              |

**Why class-based for the main entities:** Session and HelpRequest have state machines with 3+ transition guards scattered across use cases. Membership, NinjaDomain, and NinjaAssignment remain plain types because they're simple data containers with no lifecycle.

> **Terminology note:** The codebase uses "ninja" as a legacy name for what the [01-vision-and-scope.md](01-vision-and-scope.md) calls **peer expertise** — student-self-declared "ask me about" areas. The V&S explicitly replaces the teacher-assigned "ninja badge" concept with self-declared expertise. A future rename may align the code with this language.

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

| Module           | Purpose                                                        | Status              |
| ---------------- | -------------------------------------------------------------- | ------------------- |
| `presenceModule` | Attendance tracking                                            | Implemented         |
| `helpModule`     | Help queue with student-declared peer expertise                | Implemented         |
| `profileModule`  | Student identity customization and "ask me about" declarations | Implemented         |
| `projectsModule` | Multi-session project tracking and handoffs                    | Not yet implemented |
| `choresModule`   | Classroom task management and shared responsibility            | Not yet implemented |

Each module defines: id, name, description, navigation item, smartboard panel, status, default enabled state, and visibility by role. Modules are toggled per-classroom via `ClassroomSettings`.

---

## Layer 2: Application

### Ports

All external dependencies are accessed through port interfaces defined in `src/lib/application/ports/`:

**Repository ports:**

| Port                             | Responsibility                      |
| -------------------------------- | ----------------------------------- |
| `SessionRepository`              | Session CRUD + queries              |
| `PersonRepository`               | People, memberships, profiles       |
| `ClassroomRepository`            | Classrooms, members, settings       |
| `PresenceRepository`             | Sign-in/out, presence lists         |
| `HelpRepository`                 | Help requests, categories           |
| `NinjaRepository`                | Peer expertise domains, assignments |
| `PinRepository`                  | PIN auth, sessions, candidates      |
| `RealtimeNotificationRepository` | Real-time push notifications        |
| `EventStore`                     | Domain event persistence            |

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

### Smartboard

The **smartboard** is a public, unauthenticated display designed for a classroom-mounted screen. It shows real-time operational status — who is present, the help queue, active projects, and chore status — without requiring login. See [01-vision-and-scope.md](01-vision-and-scope.md) for the per-phase smartboard capabilities.

`src/lib/application/smartboard/` contains data providers that compose use cases for these displays. Each implements `SmartboardDataProvider<TDeps, TData>` and aggregates data from multiple use cases into a single response for the `/display/[code]` route.

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

## Realtime

Forge uses a **notification-based** realtime pattern rather than streaming live data over WebSockets. This keeps PII off the wire and reuses existing server-side data loading.

### How It Works

```
Server (use case)                    Client (browser)
       │                                    │
       │  INSERT into realtime_notifications │
       │  (channel, entity_type, entity_id)  │
       ▼                                    │
  ┌──────────┐    Postgres changes     ┌────────────┐
  │ Supabase │ ──────────────────────► │ Supabase   │
  │ Realtime │    (INSERT event)       │ JS Client  │
  └──────────┘                         └─────┬──────┘
                                             │
                                      invalidateAll()
                                             │
                                      SvelteKit re-runs
                                      load functions
```

1. **Publish:** Use cases write a row to `realtime_notifications` with a channel name (e.g., `presence:session:abc123`), entity type, and entity ID. No PII is included — only IDs.
2. **Transport:** Supabase Realtime listens for `INSERT` events on the `realtime_notifications` table via Postgres changes and pushes them to subscribed clients.
3. **React:** The client-side subscription receives the event and calls SvelteKit's `invalidateAll()`, which re-runs all active `load` functions to fetch fresh data through the normal server-side path.

### Client-Side Module (`src/lib/realtime/`)

| File                     | Purpose                                      |
| ------------------------ | -------------------------------------------- |
| `supabase.ts`            | Lazy Supabase client singleton from env vars |
| `channels.ts`            | `ChannelBuilder` — constructs channel names  |
| `types.ts`               | `ConnectionState`, `NotificationRow` types   |
| `subscription.svelte.ts` | Subscription factories with Svelte 5 runes   |

Subscription factories (`createClassroomSubscription`, `createPresenceSubscription`, etc.) use `$effect` internally for lifecycle management — they start channels on mount and clean up on teardown. When called inside a parent `$effect`, the inner effects are scoped to it, so changing parameters (e.g., navigating between classrooms) automatically tears down old subscriptions and creates new ones.

### Design Decisions

- **No PII over the wire.** The notification table carries only IDs. All data hydration happens through authenticated server-side load functions.
- **`invalidateAll()` over granular updates.** Rather than patching client-side state from WebSocket messages, we invalidate SvelteKit's data loading. This is simpler, keeps the server as the single source of truth, and means realtime data goes through the same authorization checks as initial page loads.
- **Framework-coupled.** The `subscription.svelte.ts` module uses Svelte 5 runes and SvelteKit's `invalidateAll`. This is intentional — realtime subscriptions are a UI concern, not domain logic, so framework coupling here is acceptable.
- **Graceful degradation.** If Supabase env vars are absent (e.g., demo mode), `getSupabaseClient()` returns `null` and subscriptions show a `disconnected` state. The app remains fully functional — data just refreshes on navigation instead of automatically.

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
| `/classroom/[classroomId]/ninja`    | Peer expertise management       |
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

## Not Yet Implemented

The following capabilities are defined in the [01-vision-and-scope.md](01-vision-and-scope.md) but do not yet have architecture in the codebase:

| Capability            | V&S Phase | Design Intent                                                                                                                                         |
| --------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Projects**          | Phase 2   | Multi-session project tracking, handoffs between students, artifact documentation. Core to constructionist purpose — see V&S Key Decision #2.         |
| **Chores**            | Phase 5   | Shared responsibility for the learning space. Students participate in maintaining the classroom — this is meta-construction, not mere administration. |
| **Teacher Dashboard** | Phase 6   | Narrative session review. Shows what students worked on and struggled with — not metrics, completion rates, or time-on-task. See V&S Key Decision #9. |
| **Student Home**      | Phase 6   | Clear starting point each session — what to pick up, who needs help, what's due.                                                                      |

When these are implemented, they will follow the same patterns: domain entities + events, use case functions with Result types, port-based infrastructure, and module registration.

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
