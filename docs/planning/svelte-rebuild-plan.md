# Forge-Svelte: Clean Rewrite Implementation Plan

## Context

Forge is a classroom management app (session control, presence tracking, help queue, ninja peer helpers, roster management, PIN auth for shared tablets, smartboard display, realtime updates). It currently runs on Next.js 14 + tRPC + React. We are rebuilding it from scratch as a SvelteKit 2 + Svelte 5 project, following PRINCIPLES.md hexagonal architecture throughout.

The existing codebase at `/Users/andy/projects/forge/` has 179 TS files across 4 layers. The Groupwheel project at `/Users/andy/projects/groupwheel/` is our reference for SvelteKit + Svelte 5 patterns.

**Key architectural difference from Groupwheel:** Forge's composition root is **server-side** (Prisma/PostgreSQL), not client-side (IndexedDB). The environment lives in `$lib/server/`, used only in `+page.server.ts` load functions and form actions. No Svelte context is used for the environment — context is reserved for UI state only.

---

## Phase 1: Project Scaffold & Foundation

Goal: Running SvelteKit app with tooling, Prisma connected, auth configured, first route rendering from DB.

### Step 1.1 — Initialize SvelteKit project

```
pnpm create svelte@latest .   # Skeleton project, TypeScript, ESLint, Prettier
pnpm add -D tailwindcss@^4 @tailwindcss/vite@^4
pnpm add -D vitest@^3 @vitest/browser@^3 vitest-browser-svelte playwright
pnpm add -D prettier-plugin-svelte prettier-plugin-tailwindcss
pnpm add prisma @prisma/client
pnpm add @auth/sveltekit @auth/prisma-adapter
pnpm add bcryptjs @supabase/supabase-js
pnpm add -D @types/bcryptjs
```

**Files to create:**
- `package.json` — pnpm, scripts: dev, build, check, lint, test
- `svelte.config.js` — `adapter-node` (not adapter-auto; Forge needs Node for bcrypt + Prisma), `vitePreprocess()`
- `vite.config.ts` — `tailwindcss()` + `sveltekit()` plugins; Vitest with two projects: `client` (`.svelte.test.ts`, browser/Playwright) and `server` (`.test.ts`, node) — matching Groupwheel pattern
- `tsconfig.json` — strict mode
- `.prettierrc` — matching Groupwheel: singleQuote, no trailing comma, plugins for svelte + tailwindcss
- `vitest-setup-client.ts` — browser test type references

### Step 1.2 — Prisma setup

- Copy `prisma/schema.prisma` from `/Users/andy/projects/forge/prisma/schema.prisma` verbatim
- Create `src/lib/server/prisma.ts` — singleton PrismaClient (standard globalThis pattern)
- Run `pnpm prisma generate`

### Step 1.3 — Result type

- Copy `src/lib/types/result.ts` verbatim from Groupwheel (`status: 'ok'/'err'` convention with ok, err, isOk, isErr, map, mapErr, andThen helpers)
- Create `src/lib/types/index.ts` barrel export

### Step 1.4 — App type declarations

Create `src/app.d.ts` declaring:
- `App.Locals.session` — Auth.js session (Google OAuth)
- `App.Locals.pinSession` — custom PIN session `{ personId, classroomId, displayName }`
- `App.Locals.actor` — unified actor `{ personId, authType: 'google'|'pin', pinClassroomId: string|null }`

### Step 1.5 — Auth setup

**Auth.js for SvelteKit (Google OAuth):**
- `src/lib/server/auth.ts` — SvelteKitAuth with Google provider + PrismaAdapter. Callbacks mirror existing Forge: only allow sign-in if matching Person exists, link googleId, inject personId into session.

**PIN auth (custom):**
- `src/lib/server/pinAuth.ts` — `resolvePinSession(event)`: reads `forge_pin` cookie, queries PinSession table, checks expiry, touches lastActivityAt

**Server hooks:**
- `src/hooks.server.ts` — `sequence(authHandle, pinHandle)`: Auth.js handle first, then custom handle that resolves PIN session and sets unified `event.locals.actor`

### Step 1.6 — ESLint boundary rules

Adapt Groupwheel's eslint.config.js with no-restricted-imports:
- `src/lib/domain/**` — no application, infrastructure, svelte, or prisma imports
- `src/lib/application/**` — no infrastructure, svelte, or prisma imports
- `src/routes/**` + `src/lib/components/**` — no direct repository or prisma imports

### Step 1.7 — Tailwind v4

- `src/app.css` — `@import 'tailwindcss'` + `@theme {}` block with Forge brand colors
- `src/app.html` — standard SvelteKit shell

### Step 1.8 — Composition root (server-side)

`src/lib/server/environment.ts`:
```typescript
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

export function getEnvironment(): AppEnvironment { ... }
```

Module-level singleton — safe for adapter-node. Only imported from `+page.server.ts`, `+layout.server.ts`, and `+server.ts` files.

### Step 1.9 — First route (classroom list)

- `src/routes/+layout.server.ts` — pass auth state to client
- `src/routes/+layout.svelte` — root layout with Tailwind, nav
- `src/routes/+page.server.ts` — load: redirect if no actor, call `listMyClassrooms` use case
- `src/routes/+page.svelte` — render classroom list

This validates the full stack: auth → environment → use case → Result → Svelte render.

---

## Phase 2: Domain Layer Port

**Mostly copy with import path changes** (`@/` → `$lib/`).

### Copy verbatim:
- **8 entity files** from `forge/src/domain/entities/` → `src/lib/domain/entities/`
  - ClassroomEntity, SessionEntity, SignInEntity, HelpRequestEntity, PersonEntity, MembershipEntity, NinjaDomainEntity, NinjaAssignmentEntity
- **Domain types** from `forge/src/domain/types/` → `src/lib/domain/types/`
  - roles, session-status, help-urgency, classroom-settings
- **Domain errors** from `forge/src/domain/errors/` → `src/lib/domain/errors/`
  - ValidationError, NotFoundError, ConflictError, AuthorizationError, FeatureDisabledError
- **Domain events** from `forge/src/domain/events/` → `src/lib/domain/events/`
  - Event type definitions, EventMetadata, ForgeEvent union

### Do NOT copy:
- `event-bus.ts` — not needed in SvelteKit request/response model
- `handlers/` — realtime handled differently (see Phase 4)
- `projectors/` — these are infrastructure (depend on Prisma), moved to Phase 4

### Barrel exports:
- `src/lib/domain/entities/index.ts`
- `src/lib/domain/types/index.ts`
- `src/lib/domain/errors/index.ts`
- `src/lib/domain/events/index.ts`
- `src/lib/domain/index.ts`

---

## Phase 3: Application Layer — Ports & Use Cases

### Step 3.1 — Port interfaces

Move repository interfaces from `forge/src/domain/repositories/` to `src/lib/application/ports/` (per PRINCIPLES.md: ports belong in application layer):

```
src/lib/application/ports/
  ClassroomRepository.ts
  SessionRepository.ts
  PresenceRepository.ts
  HelpRepository.ts
  NinjaRepository.ts
  PersonRepository.ts
  PinRepository.ts
  RealtimeNotificationRepository.ts
  EventStore.ts          ← moved from domain/events
  Clock.ts               ← new: { now(): Date }
  IdGenerator.ts         ← new: { generate(): string }
  index.ts
```

### Step 3.2 — Use case functions

Convert each service method to a standalone function following Groupwheel pattern: `(deps: {...}, input: Input) => Promise<Result<T, E>>`.

**Pattern:**
```typescript
export type StartSessionError =
  | { type: 'SESSION_NOT_FOUND'; sessionId: string }
  | { type: 'INVALID_STATE'; currentStatus: string }
  | { type: 'NOT_AUTHORIZED' };

export async function startSession(
  deps: { sessionRepo: SessionRepository; eventStore: EventStore; clock: Clock },
  input: { sessionId: string; actorId: string }
): Promise<Result<ClassSession, StartSessionError>> { ... }
```

**Authorization approach:** Simple role checks happen in `+page.server.ts` before calling use cases. Complex business rules (e.g. "only claimer or teacher can resolve") stay in use cases — pass `isTeacher: boolean` resolved by the caller.

**Complete use case inventory organized by feature:**

| Directory | Use Cases | Source Service |
|---|---|---|
| `useCases/classroom/` | listMyClassrooms, getClassroom, getClassroomSettings, updateModules | ClassroomSettingsService |
| `useCases/session/` | getPublicCurrentSession, getSession, listSessions, createSession, startSession, endSession, cancelSession | SessionService |
| `useCases/presence/` | signIn, signOut, getSignInStatus, listPresent, listPresentPublic, listSignInsForSession | PresenceService |
| `useCases/help/` | listCategories, createCategory, updateCategory, archiveCategory, requestHelp, cancelHelpRequest, claimHelpRequest, unclaimHelpRequest, resolveHelpRequest, getHelpQueue, getHelpQueuePublic, getMyOpenRequests | HelpService |
| `useCases/ninja/` | listDomains, createDomain, updateDomain, archiveDomain, assignNinja, revokeNinja, getNinjaPresence, getDomainsWithNinjas | NinjaService |
| `useCases/person/` | getProfile, updateProfile, addStudent, bulkImportStudents, updateStudent, removeStudent, listStudents | PersonService |
| `useCases/pin/` | loginWithPin, logoutPin, generatePin, generateAllPins, setPin, removePin, listStudentsWithPins | PinService |

### Step 3.3 — Authorization helpers

`src/lib/application/useCases/checkAuthorization.ts` — `requireMember()`, `requireTeacher()`, `requireSignedIn()` returning Result types. Used by server routes before calling use cases.

---

## Phase 4: Infrastructure Layer

### Step 4.1 — Prisma repository adapters

Copy from `forge/src/data/repositories/` → `src/lib/infrastructure/repositories/` with changes:
- Import ports from `$lib/application/ports/`
- Inject PrismaClient via constructor (not global import)
- Remove request-context caching (SvelteKit handles per-request isolation)

Files: PrismaClassroomRepository, PrismaSessionRepository, PrismaPresenceRepository, PrismaHelpRepository, PrismaNinjaRepository, PrismaPersonRepository, PrismaPinRepository, PrismaRealtimeNotificationRepository, PrismaEventStore

### Step 4.2 — Event store with integrated realtime

No EventBus. `PrismaEventStore.appendAndEmit()` writes both DomainEvent and RealtimeNotification rows in a single Prisma transaction. Projectors run within the same transaction.

### Step 4.3 — Projectors

Move from `forge/src/domain/events/projectors/` to `src/lib/infrastructure/events/projectors/` (correct layer — they depend on Prisma):
- SessionProjector, SignInProjector, HelpRequestProjector, ProjectorRegistry

### Step 4.4 — Infrastructure services

- `src/lib/infrastructure/services/SystemClock.ts` — `{ now: () => new Date() }`
- `src/lib/infrastructure/services/UuidIdGenerator.ts` — `{ generate: () => randomUUID() }`

---

## Phase 5: Feature Routes & UI (incremental)

Each feature follows the same SvelteKit pattern:
1. `+layout.server.ts` or `+page.server.ts` — load() for reads, actions for mutations
2. `+page.svelte` — Svelte 5 component with `$props()`, submits via `<form method="POST">`
3. Components in `src/lib/components/{feature}/`

### Route structure:

```
src/routes/
  +layout.svelte              # Root layout (nav, Tailwind)
  +layout.server.ts           # Auth state
  +page.svelte                # Home — classroom list
  +page.server.ts
  auth/
    signin/+page.svelte       # Google sign-in
    error/+page.svelte
  pin/
    +page.svelte              # PIN login form
    +page.server.ts
  classroom/[classroomId]/
    +layout.server.ts         # Load classroom + active session + membership check
    +layout.svelte            # Classroom nav (presence, help, settings tabs)
    +page.svelte              # Dashboard (session control, profile, quick actions)
    +page.server.ts
    presence/
      +page.svelte            # Sign-in/out, presence board
      +page.server.ts         # load: listPresent; actions: signIn, signOut, signInOther, signOutOther
    help/
      +page.svelte            # Help queue (teacher), request help (student), ninja queue
      +page.server.ts         # load: getHelpQueue, listCategories; actions: requestHelp, claim, resolve, etc.
    settings/
      +page.svelte            # Module toggles
      +page.server.ts
    roster/
      +page.svelte            # Student list, add/import, PIN management
      +page.server.ts
    ninja/
      +page.svelte            # Domain management, ninja assignments
      +page.server.ts
  display/[code]/
    +page.svelte              # Public smartboard (no auth)
    +page.server.ts           # load: getByDisplayCode, listPresentPublic, getHelpQueuePublic
  api/
    pin/login/+server.ts      # POST: PIN login
    pin/logout/+server.ts     # POST: PIN logout
    cron/cleanup/+server.ts   # Event + notification cleanup
```

### Build order (by feature, each end-to-end):
1. **Home + classroom list** (validates full stack)
2. **Classroom layout + dashboard** (session control)
3. **Presence** (sign-in/out, presence board)
4. **Help queue** (request, claim, resolve — most complex feature)
5. **Ninja management**
6. **Roster + student management**
7. **PIN auth**
8. **Smartboard display**
9. **Settings**

### Component directory:

```
src/lib/components/
  ui/                         # Shared primitives (Button, Alert, Spinner, etc.)
  classroom/                  # ClassroomCard, ClassroomNav
  session/                    # SessionControl, SessionStatus
  presence/                   # PresenceBoard, PresenceStatus, SignInButton
  help/                       # HelpQueue, RequestHelpForm, MyHelpStatus
  ninja/                      # NinjaDomainManager, NinjaAssignmentManager
  roster/                     # StudentRoster, AddStudentForm, CsvImport, PinManagement
  display/                    # SmartboardPresence, SmartboardHelpQueue
  profile/                    # ProfileEditor
```

---

## Phase 6: Realtime

Keep Supabase Realtime via `realtime_notifications` table (PII-safe).

### Client-side pattern:
- `src/lib/realtime/` — Svelte 5 reactive wrappers using `$effect()` for subscription lifecycle
- Subscribe to Supabase postgres_changes on `realtime_notifications` table
- On notification: call `invalidateAll()` to re-run SvelteKit load functions
- Three channel types: `presence:session:{id}`, `session:classroom:{id}`, `help:session:{id}`

### Connection resilience:
- Track connection state with `$state()`
- Exponential backoff reconnect (port from existing `use-connection-state.ts`)
- Full refetch on reconnect

---

## Implementation Sessions (Phase 1 only)

Execute these sequentially, verifying each before moving to the next.

### Session 1: Project scaffold (Step 1.1 + 1.7)
- Initialize SvelteKit project, install deps, configure vite/ts/prettier/vitest
- Match Groupwheel configs at `/Users/andy/projects/groupwheel/`
- Use adapter-node
- Create app.css with Tailwind v4, app.html
- **Verify:** `pnpm dev` starts, `pnpm check` passes

### Session 2: Prisma + Result type + app.d.ts (Steps 1.2, 1.3, 1.4)
- Copy Prisma schema from Forge, create server prisma singleton
- Copy Result type from Groupwheel
- Create app.d.ts with Locals types (session, pinSession, actor)
- **Verify:** `pnpm prisma generate` succeeds, `pnpm check` passes

### Session 3: Auth setup (Step 1.5)
- @auth/sveltekit with Google OAuth + PrismaAdapter
- Port callback logic from `/Users/andy/projects/forge/src/lib/auth.ts`
- Custom PIN auth hook
- hooks.server.ts with sequence()
- **Verify:** `pnpm check` passes, `pnpm build` succeeds

### Session 4: Composition root + ESLint (Steps 1.6, 1.8)
- Stub port interfaces in src/lib/application/ports/
- AppEnvironment interface + getEnvironment() factory
- ESLint boundary rules
- **Verify:** `pnpm lint` passes, `pnpm check` passes

### Session 5: First route (Step 1.9)
- Root layout + auth guard
- listMyClassrooms use case + stub PrismaClassroomRepository
- Home page rendering classroom list
- **Verify:** `pnpm dev` — page loads from DB, auth redirect works, `pnpm build` succeeds

---

## Verification Plan

1. **Phase 1**: `pnpm dev` starts, `/` renders classroom list from DB, auth redirects work
2. **Phase 2**: `pnpm check` passes (TypeScript compiles), domain unit tests pass
3. **Phase 3**: Use case unit tests pass with in-memory/mock repos
4. **Phase 4**: Integration tests against real Prisma DB pass
5. **Phase 5**: Each feature route loads and form actions work (manual + component tests)
6. **Phase 6**: Realtime subscriptions update UI on external DB changes

### Key test commands:
```
pnpm check              # TypeScript compilation
pnpm lint               # ESLint boundary rules
pnpm test               # All vitest (server + client)
pnpm prisma generate    # Prisma client generation
pnpm build              # Full production build
```

---

## Files from existing codebase to reference

| What | Source Path |
|---|---|
| Prisma schema | `/Users/andy/projects/forge/prisma/schema.prisma` |
| Domain entities | `/Users/andy/projects/forge/src/domain/entities/` |
| Domain types | `/Users/andy/projects/forge/src/domain/types/` |
| Domain errors | `/Users/andy/projects/forge/src/domain/errors/` |
| Domain events | `/Users/andy/projects/forge/src/domain/events/events.ts` |
| Repository interfaces | `/Users/andy/projects/forge/src/domain/repositories/` |
| Prisma repo adapters | `/Users/andy/projects/forge/src/data/repositories/` |
| Services (→ use cases) | `/Users/andy/projects/forge/src/services/` |
| Projectors | `/Users/andy/projects/forge/src/domain/events/projectors/` |
| Auth config | `/Users/andy/projects/forge/src/lib/auth.ts` |
| Result type | `/Users/andy/projects/groupwheel/src/lib/types/result.ts` |
| Vitest config | `/Users/andy/projects/groupwheel/vite.config.ts` |
| Prettier config | `/Users/andy/projects/groupwheel/.prettierrc` |
| ESLint boundaries | `/Users/andy/projects/groupwheel/eslint.config.js` |
