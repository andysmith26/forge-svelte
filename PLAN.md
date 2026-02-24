# Plan: Rebuild Forge with SvelteKit 2 + Svelte 5

## Research Findings

### Current Forge (Next.js)
- **179 TypeScript files** across 4 layers: Domain → Services → tRPC/Data → React
- **Domain layer** (`src/domain/`): 9 entity classes (class-based, immutable, state machines), 5 error types, event bus + event store, repository port interfaces, domain events with projectors
- **Application layer** (`src/services/`): 9 service classes with constructor DI, authorization, classroom settings
- **Infrastructure layer** (`src/data/`): 9 Prisma repository adapters, event store repo, realtime notification repo
- **UI layer**: 26 React components, 6 command hooks (optimistic updates), 4 realtime subscription hooks, 8 tRPC routers with Zod schemas
- **Auth**: NextAuth.js (Google OAuth + PIN auth for shared devices)
- **Realtime**: Supabase Realtime via database-backed notifications (PII-safe)
- **Database**: PostgreSQL (Supabase) with Prisma ORM, event sourcing pattern

### Groupwheel Reference (SvelteKit 2 + Svelte 5)
- Follows PRINCIPLES.md hexagonal architecture faithfully
- **Domain**: Plain interfaces + factory functions (not classes) for entities
- **Application**: Use cases as standalone functions with `deps` parameter, Result types (`ok`/`err`)
- **Infrastructure**: Composition root (`createInMemoryEnvironment`), multiple adapter tiers (InMemory → IndexedDB → Synced)
- **UI wiring**: Svelte context (`setContext`/`getContext`) to thread environment through component tree
- **Svelte 5 patterns**: `$props()`, `$state()`, `$derived()`, `$effect()`, `{@render children()}`
- **Testing**: Vitest with separate client (browser) and server test projects
- **Config**: `@tailwindcss/vite` v4, `@sveltejs/kit` v2.22, `svelte` v5, `vite` v7

### Key Differences Between Current Forge and PRINCIPLES.md Target

| Aspect | Current Forge | PRINCIPLES.md Target |
|---|---|---|
| Entities | Class-based with private constructor | Either classes or plain interfaces + factories |
| Services | Class-based services (application layer) | Use case functions with `deps` object |
| Error handling | Thrown exceptions (domain errors) | Result types for business errors |
| Composition | Singleton on process (Next.js workaround) | Environment object via Svelte context |
| API layer | tRPC routers + React Query | SvelteKit server routes/actions OR tRPC |
| UI framework | React + hooks | Svelte 5 + runes |
| State | React Query + optimistic hooks | Svelte runes ($state, $derived) + invalidation |

---

## Architecture Constraints Check

**Layers touched**: ALL — this is a complete rewrite.

**PRINCIPLES.md alignment requirements**:
1. Domain layer must be pure TypeScript (no framework imports) ✓ already true
2. Use cases as functions with `deps` injection (not class methods)
3. Result types for business errors (not thrown exceptions)
4. Ports defined in application layer, implemented in infrastructure
5. UI calls use cases through facades/hooks, never repos directly
6. Environment/composition root assembles all dependencies

**Anti-patterns to avoid**:
- Business logic in Svelte components
- Direct Prisma calls from routes
- Framework code in domain layer
- Throwing exceptions for business errors

---

## Approaches

### Approach A: "Clean Rewrite" — New SvelteKit project, port layer by layer

Start a fresh SvelteKit 2 project alongside the existing code. Port each layer bottom-up:

1. **Domain layer** — Copy entities as-is (they're already pure TS). Convert error handling from thrown exceptions to Result types where appropriate.
2. **Application layer** — Rewrite services as use-case functions following Groupwheel pattern (standalone functions with `deps` object, Result return types).
3. **Infrastructure layer** — Keep Prisma + Supabase adapters, restructure into ports/adapters pattern matching Groupwheel layout. Create composition root as environment factory.
4. **API layer** — Replace tRPC with SvelteKit server routes (`+server.ts`) and form actions (`+page.server.ts`). Use load functions for data fetching.
5. **UI layer** — Rebuild all 26 components as Svelte 5 components with runes. Replace React Query optimistic updates with SvelteKit `invalidateAll` + `$state`.
6. **Auth** — Replace NextAuth with SvelteKit-native auth (Lucia, Auth.js for SvelteKit, or custom).
7. **Realtime** — Keep Supabase Realtime, create Svelte-native subscription pattern.

**Files created/modified**: ~150+ new files in SvelteKit structure
**Trade-offs**:
- Implementation effort: **Significant** (full rewrite)
- Best-practice alignment: **Canonical** (follows both PRINCIPLES.md and SvelteKit idioms from the start)
- Maintenance burden: **Simple** (clean architecture, no legacy compromises)

### Approach B: "Hybrid Migration" — Keep tRPC, swap UI framework

Keep tRPC as the API layer (it has a SvelteKit adapter) and the existing service layer. Focus the migration on:

1. **Keep**: Domain layer, services, Prisma repos, tRPC routers, Zod schemas
2. **Replace**: React → Svelte 5 components, React Query → trpc-svelte-query, Next.js → SvelteKit routing
3. **Defer**: Refactoring services to use-case functions, Result types — do this incrementally later

**Files created/modified**: ~80 new Svelte files, tRPC adapter config
**Trade-offs**:
- Implementation effort: **Moderate** (reuse existing backend)
- Best-practice alignment: **Acceptable** (services stay as classes, not aligned with PRINCIPLES.md use-case function pattern)
- Maintenance burden: **Manageable** (but carries forward architectural debt — services as classes, thrown exceptions for errors)

### Approach C: "Incremental Alignment" — SvelteKit with phased refactoring

Start with Approach A's structure but implement in phases:

**Phase 1 — Scaffold + Domain** (get the project running):
- New SvelteKit 2 project with Svelte 5, Tailwind v4, Vitest
- Copy domain entities, convert to Result types
- Create port interfaces, composition root
- Set up Prisma, auth, basic routing
- Implement ONE feature end-to-end (e.g., presence) to validate the architecture

**Phase 2 — Core Features**:
- Port remaining use cases (session, help, ninja, roster, PIN)
- Build SvelteKit server routes and load functions
- Implement Svelte 5 components for each feature

**Phase 3 — Polish**:
- Realtime subscriptions
- Optimistic updates
- Smartboard display
- Tests

**Files created/modified**: Same as Approach A (~150+), but delivered incrementally
**Trade-offs**:
- Implementation effort: **Significant** (same total work as A, but paced)
- Best-practice alignment: **Canonical** (full PRINCIPLES.md alignment)
- Maintenance burden: **Simple** (clean from the start)

---

## Recommendation

**Approach C: Incremental Alignment** — for two decisive reasons:

1. **Validates architecture early**: By doing one feature end-to-end in Phase 1, we prove the SvelteKit + hexagonal architecture works before committing to porting everything. If something doesn't fit (e.g., auth pattern, realtime approach), we discover it on one feature, not ten.

2. **Matches PRINCIPLES.md fully**: Unlike Approach B which carries forward class-based services and thrown exceptions, this approach rebuilds with use-case functions and Result types from day one. Since the whole point is to align with PRINCIPLES.md, a half-migration defeats the purpose.

**What would flip the choice**: If time pressure requires something working in days rather than weeks, Approach B gets a running app faster by reusing tRPC routers and services. But it leaves you with the same architectural patterns you're trying to move away from.

---

## Phase 1 Detailed Plan

### Step 1: Project scaffold
- Initialize SvelteKit 2 project with Svelte 5, TypeScript
- Configure: Tailwind v4 (`@tailwindcss/vite`), Vitest (client + server), Prettier, ESLint
- Set up Prisma with existing schema (copy `prisma/schema.prisma`)
- Configure `$lib` aliases matching Groupwheel structure

### Step 2: Foundation layers
- `src/lib/types/result.ts` — Result type (copy from Groupwheel)
- `src/lib/domain/` — Port existing entities (keep class-based pattern since it's already working and PRINCIPLES.md allows it)
- `src/lib/domain/errors/` — Keep domain errors for programmer errors; add Result types for business errors in use cases
- `src/lib/application/ports/` — Extract repository interfaces from current `src/domain/repositories/`
- `src/lib/application/useCases/` — Convert session service methods to standalone use-case functions

### Step 3: Infrastructure
- `src/lib/infrastructure/repositories/` — Port Prisma adapters
- `src/lib/infrastructure/services/` — Clock, IdGenerator
- `src/lib/infrastructure/environment.ts` — Composition root (server-side)
- `src/lib/server/` — Server-only code (Prisma client, auth config)

### Step 4: Auth
- Evaluate Auth.js for SvelteKit (successor to NextAuth) or Lucia
- Implement Google OAuth + session management
- PIN auth for shared devices

### Step 5: First feature (Presence)
- `src/routes/` — Layout with auth, classroom routes
- `src/routes/classroom/[id]/+page.server.ts` — Load function using use cases
- `src/routes/classroom/[id]/presence/` — Presence management page
- Svelte 5 components for sign-in/sign-out UI
- Validate the full stack works end-to-end

### Step 6: Smartboard display
- `src/routes/display/[code]/` — Public display route (no auth)
- Port smartboard components

### Proposed directory structure:
```
src/
├── lib/
│   ├── domain/                    # Layer 1: Pure business logic
│   │   ├── entities/              # Entity classes (Session, SignIn, Person, etc.)
│   │   ├── events/                # Domain event types
│   │   ├── types/                 # Enums, value objects
│   │   └── index.ts
│   ├── application/               # Layer 2: Use cases + ports
│   │   ├── ports/                 # Repository & service interfaces
│   │   ├── useCases/              # Use case functions
│   │   └── index.ts
│   ├── infrastructure/            # Layer 3: Adapters
│   │   ├── repositories/          # Prisma implementations
│   │   ├── services/              # Clock, IdGenerator, etc.
│   │   ├── auth/                  # Auth adapters
│   │   ├── realtime/              # Supabase realtime
│   │   └── environment.ts         # Composition root
│   ├── server/                    # Server-only (Prisma client, etc.)
│   │   ├── prisma.ts
│   │   └── auth.ts
│   ├── components/                # Svelte 5 components
│   │   ├── ui/                    # Shared UI primitives
│   │   ├── presence/
│   │   ├── help/
│   │   ├── ninja/
│   │   ├── roster/
│   │   └── display/
│   ├── types/                     # Shared types (Result, etc.)
│   └── contexts/                  # Svelte context helpers
├── routes/
│   ├── +layout.svelte             # Root layout
│   ├── +layout.server.ts          # Auth guard
│   ├── +page.svelte               # Home (classroom list)
│   ├── classroom/[id]/
│   │   ├── +layout.server.ts      # Load classroom + session
│   │   ├── +page.svelte           # Dashboard
│   │   ├── presence/+page.svelte
│   │   ├── help/+page.svelte
│   │   ├── settings/+page.svelte
│   │   └── ...
│   ├── display/[code]/            # Public smartboard
│   ├── auth/                      # Sign-in pages
│   └── api/                       # API routes (cron, webhooks)
└── app.d.ts                       # SvelteKit type declarations
```
