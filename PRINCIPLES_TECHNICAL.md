# Software Architecture Principles

This document defines shared architectural principles, patterns, and guardrails that apply across all projects. Individual projects implement these principles within their specific technology stacks.

---

## Core Philosophy

### Goals

- Keep **domain rules and invariants explicit** and testable.
- Make **application use cases** the only way to perform meaningful operations.
- Keep **infrastructure (storage, APIs, browser APIs)** replaceable behind ports.
- Keep the **UI thin**, delegating non-trivial logic to use cases.

### Design Values

1. **Clarity over cleverness** — Code should be readable and predictable.
2. **Explicit over implicit** — Dependencies, data flow, and error states should be visible.
3. **Testability by design** — Architecture enables testing at every layer.
4. **Framework independence** — Business logic survives framework changes.

---

## Layered Architecture

We follow a **hexagonal architecture** (ports & adapters) with a domain-centric, use-case-oriented design. All projects should implement these conceptual layers, though exact directory structures may vary.

### Layer Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│         (Routes, Pages, Components, View Logic)             │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│         (Use Cases, Commands, Facades, Orchestration)       │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                           │
│      (Entities, Value Objects, Domain Events, Invariants)   │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
│   (Repositories, External APIs, Storage, Framework Glue)    │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Domain Layer

The domain layer defines core business concepts as pure data + invariants.

### What Belongs Here

- **Domain entities** — Core business objects with identity
- **Value objects** — Immutable objects defined by their attributes
- **Domain events** — Records of meaningful state changes
- **Domain factories** — Functions that create valid entities
- **Domain validators** — Pure validation logic
- **Domain-specific types and enums** — Business vocabulary

### What Does NOT Belong Here

- No framework imports (React, Svelte, Express, etc.)
- No database or ORM imports (Prisma, Drizzle, etc.)
- No HTTP, fetch, or external API calls
- No browser APIs (localStorage, DOM, etc.)
- No repository implementations
- No UI components or stores

### Entity Design Principles

Entity design follows a **complexity gradient**. Start with the simplest representation that works; upgrade when the domain demands it.

#### Level 1: Plain Types + Factory Functions (default)

Most entities are plain TypeScript interfaces with standalone factory functions and pure helper functions. This is the starting point for all entities, and where most will stay permanently.

**Characteristics:**

1. **Interfaces, not classes** — Entities are plain data structures.
2. **Validation in factory functions** — `create{Entity}()` functions enforce invariants at creation time.
3. **Pure helper functions for logic** — Domain operations are standalone functions that take the entity as input, not methods.
4. **Immutable by convention** — Factory functions return new objects; mutations happen through use cases and repositories, not on the entity.

```typescript
// Entity as interface
interface Student {
  id: string;
  firstName: string;
  lastName?: string;
  gradeLevel?: string;
}

// Factory function validates and normalizes
function createStudent(input: CreateStudentInput): Student {
  if (!input.firstName?.trim())
    throw new Error('firstName is required');
  return {
    id: input.id,
    firstName: input.firstName.trim(),
    lastName: input.lastName?.trim(),
    gradeLevel: input.gradeLevel?.trim(),
  };
}

// Domain logic as pure functions
function getStudentDisplayName(student: Student): string {
  return [student.firstName, student.lastName]
    .filter(Boolean)
    .join(' ');
}
```

**Why this is the default:**

- Serialization is trivial — plain objects survive `JSON.parse`, `structuredClone`, and IndexedDB round-trips with no mapping layer.
- Reactive UI frameworks (Svelte, React) track plain object properties natively; class instances with getters require extra wiring.
- Tests can construct data with object literals — no factory call needed for simple assertions.
- Pure functions are composable, tree-shakeable, and free of `this`-binding issues.

#### Level 2: Class-Based Entities (upgrade when needed)

Some entities develop enough complexity that a class with encapsulation earns its weight. This is not a style preference — it's a response to specific domain pressures.

**Characteristics:**

1. **Private constructor** — Construction only through `create()` (validates) or `fromRecord()` (trusted data, skips validation).
2. **Readonly properties via getters** — Direct mutation is structurally impossible.
3. **State machine methods** — `can*()` predicates and transition methods encode lifecycle rules in one place.
4. **Domain event production** — `apply(event)` methods for event-sourced aggregates.

```typescript
class HelpRequest {
  private constructor(private readonly props: HelpRequestProps) {}

  get id(): string { return this.props.id; }
  get status(): HelpRequestStatus { return this.props.status; }

  static create(input: CreateHelpRequestInput): HelpRequest {
    HelpRequest.validate(input);
    return new HelpRequest({ ...input, status: 'waiting' });
  }

  static fromRecord(record: HelpRequestRecord): HelpRequest {
    return new HelpRequest(record);
  }

  canClaim(): boolean { return this.status === 'waiting'; }
  canResolve(): boolean { return this.status === 'claimed'; }

  claim(claimedBy: string): HelpRequest {
    if (!this.canClaim()) throw new InvalidStateTransitionError(...);
    return new HelpRequest({ ...this.props, status: 'claimed', claimedBy });
  }
}
```

#### When to Upgrade from Level 1 to Level 2

Upgrade is driven by concrete signals, not intuition. Look for these:

| Signal                                  | What it looks like                                                                                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Scattered state guards**              | You're writing the same `if (status === 'draft')` check in 3+ use cases. The entity has a state machine that should be centralized.                                                      |
| **Event sourcing**                      | The entity must produce domain events and reconstruct from event replay. `apply(event)` belongs on the entity.                                                                           |
| **Mutation would violate an invariant** | Direct property assignment could break an audit trail, corrupt a snapshot, or bypass a required state transition. Encapsulation prevents this structurally.                              |
| **Dual construction paths**             | You need `create()` with full validation for untrusted input and `fromRecord()` without validation for trusted storage. Two factory functions work but a class makes the intent clearer. |

**If none of these signals are present, stay at Level 1.** Most entities — Student, Group, Pool, Staff — are data containers with no lifecycle. Wrapping them in classes adds ceremony with no modeling benefit.

---

## Layer 2: Application Layer

The application layer orchestrates domain objects to implement **use cases**.

### Ports (Interfaces)

Ports define how the application layer talks to the outside world.

**Repository ports** — Interfaces for data persistence:

- `findById(id): Promise<Entity | null>`
- `save(entity): Promise<void>`
- `delete(id): Promise<void>`

**Service ports** — Interfaces for external capabilities:

- `IdGenerator` — Generate unique identifiers
- `Clock` — Get current time
- `EventPublisher` — Publish domain events
- `NotificationService` — Send notifications

Ports are small TypeScript interfaces:

- **Defined** in the application layer
- **Implemented** in the infrastructure layer

### Use Cases

Use cases encode the **verbs** of the system. They are the only sanctioned way to perform meaningful operations.

**Use case characteristics:**

1. **Functions, not classes** — Each use case is a single function.
2. **Dependency injection** — Dependencies arrive via a `deps` object of ports.
3. **Plain data in/out** — Inputs and outputs are plain data objects.
4. **Result types for errors** — Business errors are values (`Result<T, E>`), not thrown exceptions.
5. **No framework code** — No Svelte, React, HTTP, or browser APIs.

```typescript
// Example use case
export async function submitOrder(
  deps: {
    orderRepo: OrderRepository;
    inventoryService: InventoryService;
    eventPublisher: EventPublisher;
    clock: Clock;
  },
  input: SubmitOrderInput,
): Promise<Result<Order, SubmitOrderError>> {
  // 1. Validate input
  if (!input.items.length) {
    return err({ type: 'empty_order' });
  }

  // 2. Check business rules
  const available = await deps.inventoryService.checkAvailability(
    input.items,
  );
  if (!available) {
    return err({ type: 'insufficient_inventory' });
  }

  // 3. Create domain object
  const order = OrderEntity.create({
    id: deps.idGenerator.generate(),
    items: input.items,
    createdAt: deps.clock.now(),
  });

  // 4. Persist
  await deps.orderRepo.save(order);

  // 5. Publish events
  await deps.eventPublisher.publish(
    OrderSubmitted.create({ orderId: order.id }),
  );

  return ok(order);
}
```

### Use Case Composition

Use cases may call other use cases when:

- The dependency is conceptually hierarchical
- It avoids redundant validation or duplication

**Rules for composition:**

- Avoid circular dependencies across use cases
- If the logic is pure transformation (no I/O), prefer domain factories
- If it requires coordination across multiple repositories, use a use case
- Each use case accepts only the ports it needs (don't pass entire "env" objects)

---

## Layer 3: Infrastructure Layer

The infrastructure layer provides **adapters** that implement ports.

### What Belongs Here

- Repository implementations (in-memory, database, API-backed)
- Service implementations (clock, ID generator, external APIs)
- Framework-specific adapters (auth, storage, network)
- Composition root / environment factories

### What Does NOT Belong Here

- Business logic
- Domain rules
- Use case orchestration
- UI components

### Adapter Patterns

Adapters implement ports and may have their own dependencies:

```typescript
// Example adapter
class PrismaOrderRepository implements OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<OrderEntity | null> {
    const record = await this.prisma.order.findUnique({
      where: { id },
    });
    return record ? OrderEntity.fromRecord(record) : null;
  }

  async save(order: OrderEntity): Promise<void> {
    await this.prisma.order.upsert({
      where: { id: order.id },
      create: this.toRecord(order),
      update: this.toRecord(order),
    });
  }
}
```

### Environment / Composition Root

A composition root assembles all dependencies:

```typescript
interface AppEnvironment {
  orderRepo: OrderRepository;
  inventoryService: InventoryService;
  eventPublisher: EventPublisher;
  idGenerator: IdGenerator;
  clock: Clock;
}

function createEnvironment(): AppEnvironment {
  const prisma = new PrismaClient();
  return {
    orderRepo: new PrismaOrderRepository(prisma),
    inventoryService: new ApiInventoryService(),
    eventPublisher: new SupabaseEventPublisher(),
    idGenerator: new UuidIdGenerator(),
    clock: new SystemClock(),
  };
}
```

---

## Layer 4: UI Layer

The UI layer contains routes, pages, and components.

### What Belongs Here

- Route definitions and navigation
- Page components and layouts
- UI components and design system
- View state management
- User interaction handling
- Presentation logic (formatting, display)

### What Does NOT Belong Here

- Business logic
- Domain validation
- Direct database queries
- Direct repository access (beyond trivial reads)

### Key Patterns

**UI calls use cases through facades or hooks:**

```typescript
// Via facade
const result = await facade.submitOrder(env, { items });

// Via custom hook
const { submitOrder, isPending } = useOrderCommands();
submitOrder({ items });
```

**UI does not construct repositories:**

```typescript
// ❌ Wrong
const orderRepo = new PrismaOrderRepository(prisma);
const order = await orderRepo.findById(id);

// ✅ Correct
const order = await trpc.order.getById.query({ id });
```

---

## Result Types and Error Handling

### The Result Pattern

Use `Result<T, E>` types to represent operations that can fail:

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

function isOk<T, E>(
  result: Result<T, E>,
): result is { ok: true; value: T } {
  return result.ok;
}

function isErr<T, E>(
  result: Result<T, E>,
): result is { ok: false; error: E } {
  return !result.ok;
}
```

### When to Use Results vs Exceptions

| Situation                 | Use                       |
| ------------------------- | ------------------------- |
| Business rule violation   | Result type               |
| Invalid input from user   | Result type               |
| Expected error conditions | Result type               |
| Programmer error (bug)    | Throw exception           |
| Infrastructure failure    | Throw exception (or wrap) |
| Unrecoverable state       | Throw exception           |

### Error Type Design

Define discriminated union types for business errors:

```typescript
type SubmitOrderError =
  | { type: 'empty_order' }
  | { type: 'insufficient_inventory'; items: string[] }
  | { type: 'customer_not_found'; customerId: string }
  | { type: 'payment_declined'; reason: string };
```

---

## Dependency Rules

Dependencies flow inward: UI → Application → Domain ← Infrastructure.

### Allowed Imports by Layer

| Layer                 | May Import From                   |
| --------------------- | --------------------------------- |
| Domain                | Only other domain modules         |
| Application Ports     | Domain (for types)                |
| Application Use Cases | Domain, Ports, other Use Cases    |
| Infrastructure        | Domain, Ports (never use cases)   |
| UI                    | Facades/hooks, Domain (for types) |

### Forbidden Imports

| From           | May NOT Import                  |
| -------------- | ------------------------------- |
| Domain         | Application, Infrastructure, UI |
| Ports          | Use Cases, Infrastructure, UI   |
| Use Cases      | Infrastructure, UI              |
| Infrastructure | Use Cases, UI                   |

---

## Event Sourcing (Optional Pattern)

Some projects use event sourcing where all state changes are domain events.

### Core Concepts

**Domain Events (Source of Truth)**

- All meaningful actions produce immutable domain events
- Events are append-only—never modified or deleted
- Events capture intent and context

**Projections (Derived Read Models)**

- Current state is derived by replaying or projecting events
- Projections are query-optimized tables
- Projections can be rebuilt from events at any time

### Event Design

```typescript
interface DomainEvent {
  id: string;
  occurredAt: Date;
  aggregateId: string;
  type: string;
  payload: Record<string, unknown>;
}

// Example events
type OrderEvent =
  | { type: 'OrderSubmitted'; orderId: string; items: Item[] }
  | { type: 'OrderConfirmed'; orderId: string; confirmedAt: Date }
  | { type: 'OrderShipped'; orderId: string; trackingNumber: string };
```

---

## Testing Philosophy

### Test Code Exceptions

Test files and test utilities may intentionally violate layer boundaries for setup and verification. These exceptions are tightly scoped.

**Allowed in test code:**

- Importing infrastructure implementations for state manipulation
- Using domain factories with specific IDs for assertions
- Injecting mock implementations of ports
- Accessing repositories directly to seed data

**Not allowed (even in tests):**

- Production code importing from test utilities
- Cross-layer mixing in production paths

### Test Utilities Location

Test utilities belong in a dedicated location (`src/test-utils/`, `__tests__/helpers/`, etc.):

- **Fixtures** — Pre-built test data with deterministic IDs
- **Factories** — Functions to create test instances
- **Mocks** — Mock implementations of ports

**Critical rule:** Test utilities must NEVER be imported by production code.

### Testing Each Layer

| Layer          | Test Type         | What to Test                                         |
| -------------- | ----------------- | ---------------------------------------------------- |
| Domain         | Unit tests        | Invariants, state transitions, calculations          |
| Use Cases      | Integration tests | Business logic, orchestration, error paths           |
| Infrastructure | Integration tests | Data persistence, external API integration           |
| UI             | Component tests   | Rendering, user interactions, integration with hooks |

---

## Naming Conventions

Consistent naming improves navigability and reduces cognitive load.

| Concept              | Pattern                         | Example                         |
| -------------------- | ------------------------------- | ------------------------------- |
| Domain entity        | Singular noun, PascalCase       | `Order`, `Customer`, `Product`  |
| Domain factory       | `create{Entity}`                | `createOrder`, `createCustomer` |
| Use case function    | Verb phrase, camelCase          | `submitOrder`, `cancelOrder`    |
| Repository interface | `{Entity}Repository`            | `OrderRepository`               |
| Repository impl      | `{Storage}{Entity}Repository`   | `PrismaOrderRepository`         |
| Service interface    | Noun or capability              | `InventoryService`, `Clock`     |
| Result error         | Descriptive discriminated union | `SubmitOrderError`              |

**Avoid:**

- Suffixes like `UseCase` on function names (`submitOrder` not `submitOrderUseCase`)
- Generic names like `Manager`, `Handler`, `Processor` without context
- Abbreviations that aren't universally understood

---

## Anti-Patterns

### What NOT to Do

1. **Business logic in UI components**
   - Validation, calculations, and rules belong in domain or use cases

2. **Direct repository calls from UI**
   - Use facades or hooks that wrap use cases

3. **Infrastructure imports in use cases**
   - Use cases depend only on port interfaces

4. **Duplicating domain validation**
   - Validate once in the domain layer; trust it elsewhere

5. **Passing entire environments to use cases**
   - Extract only the needed ports

6. **"Helper" modules that blur boundaries**
   - If it touches multiple layers, it's probably an anti-pattern

7. **Throwing exceptions for business errors**
   - Use Result types for expected failures

8. **Test utilities in production code**
   - Test helpers are for tests only

9. **Framework code in domain layer**
   - Domain is pure TypeScript

10. **Circular dependencies between use cases**
    - If A calls B and B calls A, redesign

---

## Self-Review Checklist

Use this checklist before merging changes:

**Architecture:**

- [ ] Does new domain logic live in the domain layer?
- [ ] Does every user-visible behavior correspond to a use case?
- [ ] Do use cases return Result types for business errors?

**Dependencies:**

- [ ] Do use cases avoid importing infrastructure?
- [ ] Does the domain avoid importing application or infrastructure?
- [ ] Does UI avoid direct repository access?

**Testing:**

- [ ] Are test utilities only imported by test files?
- [ ] Do tests verify both success and error paths?

**Naming:**

- [ ] Are names consistent with conventions?
- [ ] Are files named after their main export?

---

## Optimistic Updates Pattern

For responsive UIs, implement optimistic updates:

1. **Cancel outgoing queries** — Prevent race conditions
2. **Snapshot previous state** — Enable rollback
3. **Apply optimistic update** — Show expected result immediately
4. **Return rollback context** — Prepare for error handling
5. **Rollback on error** — Restore previous state
6. **Trust realtime for consistency** — Let subscriptions correct drift

```typescript
const mutation = useMutation({
  onMutate: async (input) => {
    await queryClient.cancelQueries(['orders']);
    const previous = queryClient.getQueryData(['orders']);
    queryClient.setQueryData(['orders'], (old) => /* optimistic update */);
    return { previous };
  },
  onError: (err, input, context) => {
    queryClient.setQueryData(['orders'], context?.previous);
  },
});
```

---

## Real-Time Considerations

For applications with real-time requirements:

### Privacy in Realtime

- Realtime channels carry minimal IDs, not PII
- Clients hydrate full data through authenticated queries
- Public channels (like displays) use only non-sensitive projections

### Fallback Patterns

- Primary: WebSocket subscriptions
- Fallback: Polling on disconnect
- Recovery: Full refetch on reconnect

---

## Document Maintenance

This document should be:

- Referenced when making architectural decisions
- Updated when patterns evolve
- Used as onboarding material for new contributors

Project-specific architecture documents complement these principles with:

- Technology stack details
- Directory structure
- Runtime configuration
- Deployment pipelines
