# Forge — Architecture

# 1. Architecture Overview

Forge is built on:

- **Event-sourced domain model**
- **Next.js App Router**
- **tRPC API layer**
- **Supabase Postgres + RLS**
- **Supabase Realtime** for presence, help queue, project updates, and chore boards
- **Smartboard**: public read-only derived models

This document describes the runtime structure, real-time model, storage boundaries, and deployment pipeline.

---

# 2. Real-Time Architecture

- Presence, help queue, and Smartboard updates propagate within **≤ 2 seconds**
- Realtime channels are **classroom-scoped** and carry **no PII**
- Payloads contain minimal IDs; clients hydrate details through cached lookups
- If websocket disconnects, system falls back to polling every 10 seconds

---

# 3. Privacy and RLS

- RLS policies ensure students only see data for classrooms where they have active membership
- Anonymous public Smartboard uses _only_ non-sensitive projections
- Presence and help channels avoid transmitting names; only IDs and event types
- Service key stays server-side; client uses anon key only
- Realtime channels exclude PII entirely

---

# 3.1 Server Realtime Infrastructure

The `src/server/realtime/` module provides server-side realtime broadcasting utilities.

## Module Structure

```
src/server/realtime/
├── index.ts        # Re-exports all public APIs
├── channels.ts     # Channel name constants and builders
├── broadcaster.ts  # Server-side broadcast utilities
└── types.ts        # Shared types for realtime payloads
```

## Channel Naming Convention

Channels follow the pattern `{entity}:{scope}:{id}`:

| Channel Pattern                   | Purpose                  | Example                    |
| --------------------------------- | ------------------------ | -------------------------- |
| `presence:session:{sessionId}`    | Sign-in/sign-out events  | `presence:session:abc123`  |
| `session:classroom:{classroomId}` | Session start/end events | `session:classroom:xyz789` |
| `help:session:{sessionId}`        | Help request events      | `help:session:abc123`      |

## ChannelBuilder API

```typescript
import { ChannelBuilder } from '@/server/realtime';

// Build channel names
const presenceChannel = ChannelBuilder.presence(sessionId); // "presence:session:abc123"
const sessionChannel = ChannelBuilder.session(classroomId); // "session:classroom:xyz789"
const helpChannel = ChannelBuilder.help(sessionId); // "help:session:abc123"

// Parse channel names
const parsed = ChannelBuilder.parse('presence:session:abc123');
// { prefix: "presence", scope: "session", id: "abc123" }

// Check channel types
ChannelBuilder.isPresenceChannel(channelName); // boolean
ChannelBuilder.isSessionChannel(channelName); // boolean
ChannelBuilder.isHelpChannel(channelName); // boolean
```

## Broadcaster API

```typescript
import { getBroadcaster, Broadcaster } from '@/server/realtime';

// Get singleton broadcaster instance
const broadcaster = getBroadcaster(realtimeNotificationRepository);

// Broadcast presence change (inserts into realtime_notifications)
await broadcaster.broadcastPresenceChange(sessionId, {
  eventType: 'INSERT',
  entityType: 'sign_in',
  entityId: signInId,
  timestamp: new Date().toISOString()
});

// Broadcast session change
await broadcaster.broadcastSessionChange(classroomId, {
  eventType: 'UPDATE',
  entityType: 'session',
  entityId: sessionId,
  status: 'active',
  timestamp: new Date().toISOString()
});

// Broadcast help request change
await broadcaster.broadcastHelpChange(sessionId, {
  eventType: 'INSERT',
  entityType: 'help_request',
  entityId: helpRequestId,
  timestamp: new Date().toISOString()
});
```

## Notification Payload Types

```typescript
// Base payload (IDs only, no PII)
type RealtimeNotificationPayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  entityType: 'session' | 'sign_in' | 'help_request';
  entityId: string;
  timestamp: string;
};

// Connection state tracking for client hooks
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
```

---

# 4. Project Structure

```

forge/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (app)/
│   │   │   ├── classroom/[id]/
│   │   │   │   ├── page.tsx             # Overview/dashboard
│   │   │   │   ├── presence/            # Dedicated presence view
│   │   │   │   ├── help/                # Help queue management
│   │   │   │   ├── projects/            # Project board (V2)
│   │   │   │   ├── chores/              # Chore board (V2)
│   │   │   │   └── progress/            # V2-only in functionality
│   │   │   └── settings/
│   │   ├── display/
│   │   │   └── [code]/
│   │   └── api/trpc/
│   ├── domain/
│   │   ├── entities/
│   │   ├── errors/
│   │   ├── events/
│   │   ├── repositories/
│   │   └── types/
│   ├── services/
│   ├── data/
│   │   ├── prisma/
│   │   └── repositories/
│   ├── server/
│   │   ├── routers/
│   │   ├── middleware/
│   │   ├── schemas/
│   │   ├── realtime/
│   │   └── trpc.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── presence/
│   │   ├── projects/
│   │   ├── help/
│   │   ├── chores/
│   │   └── progress/                   # V2-only in functionality
│   ├── hooks/
│   │   └── realtime/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── errors.ts
│   │   └── supabase.ts
│   └── types/
├── public/
├── **tests**/
└── package.json

```

---

# 5. App Routes (V1)

```

/ (home)
/auth/**
/classroom/[id]
/classroom/[id]/presence
/classroom/[id]/help
/classroom/[id]/projects
/classroom/[id]/chores
/display/[code]

```

The following route exists structurally but is **non-functional in V1**:

```

/classroom/[id]/progress   # V2 only

```

---

# 6. Domain Architecture

Forge uses a **Ports and Adapters** approach.

## 6.1 Domain Layer (Pure)

- Entities: Person, Classroom, Session, SignIn, HelpRequest, NinjaDomain, NinjaAssignment, Membership
- Domain events: append-only, immutable
- No database access
- No framework imports
- All write-side logic expressed as `DomainEvent`s

### Entity Design Principles

Domain entities in `src/domain/entities/` follow these principles:

1. **No Prisma imports** - Entities are plain TypeScript classes
2. **Immutable by default** - All properties are `readonly`, mutations return new instances
3. **Validation in constructors** - Invariants are enforced at creation time via `create()`
4. **Factory methods for hydration** - `fromRecord()` creates entities from database records
5. **Domain methods** - Business logic is encapsulated (e.g., `session.canStart()`, `signIn.canSignOut()`)

### Entity Structure

```typescript
export class SessionEntity {
  private constructor(private readonly props: SessionProps) {}

  // Getters expose immutable properties
  get id(): string { return this.props.id; }
  get status(): SessionStatus { return this.props.status; }

  // Factory method with validation
  static create(props: SessionProps): SessionEntity {
    SessionEntity.validateTimes(props.startTime, props.endTime);
    return new SessionEntity(props);
  }

  // Factory method for database hydration (no validation)
  static fromRecord(record: SessionProps): SessionEntity {
    return new SessionEntity(record);
  }

  // State machine methods
  canStart(): boolean { return this.status === "scheduled"; }
  canEnd(): boolean { return this.status === "active"; }

  // State transitions return new instances
  start(startedAt: Date = new Date()): SessionEntity {
    if (!this.canStart()) throw new ConflictError(...);
    return new SessionEntity({ ...this.props, status: "active", actualStartAt: startedAt });
  }
}
```

### Available Entities

| Entity                  | Key Invariants                              | State Machine                |
| ----------------------- | ------------------------------------------- | ---------------------------- |
| `PersonEntity`          | displayName required, email format          | active ↔ inactive            |
| `SessionEntity`         | startTime < endTime, valid sessionType      | scheduled → active → ended   |
| `SignInEntity`          | valid session + person reference            | signed_in → signed_out       |
| `HelpRequestEntity`     | description required, valid urgency         | pending → claimed → resolved |
| `ClassroomEntity`       | displayCode format, schoolId required       | —                            |
| `MembershipEntity`      | valid role, classroomId + personId required | active ↔ inactive            |
| `NinjaDomainEntity`     | unique name per classroom                   | active ↔ archived            |
| `NinjaAssignmentEntity` | valid person + domain reference             | assigned → revoked           |

## 6.2 Application Services

- Convert user actions to domain events
- Coordinate ACL checks with permission system
- Write events to the event store
- Trigger projection updates
- Publish realtime updates

## 6.3 Projections

- Stored in Postgres as query-optimized tables
- Derived from DomainEvent
- Rebuildable at any time

Projections include:

- SignIn
- HelpRequest
- Project + Subsystem
- StatusUpdate
- ChoreInstance
- NinjaAssignment

---

# 7. Event Store

- Single table `DomainEvent`
- Each event has:
  - id (UUID)
  - occurred_at (timestamp)
  - classroom_id
  - actor_id
  - type
  - payload (JSON)
- Events never updated or deleted
- Projections subscribe to event stream

---

# 7.1 Realtime Notifications Table

The `realtime_notifications` table provides PII-safe realtime broadcasts. Instead of subscribing directly to domain tables (which would expose sensitive data), clients subscribe to this lightweight notification table.

## Schema

```sql
CREATE TABLE realtime_notifications (
  id          TEXT PRIMARY KEY,
  channel     TEXT NOT NULL,      -- e.g., "presence:session:abc123"
  event_type  TEXT NOT NULL,      -- INSERT, UPDATE, DELETE
  entity_type TEXT NOT NULL,      -- session, sign_in, help_request
  entity_id   TEXT NOT NULL,      -- Primary key of changed entity
  scope_id    TEXT NOT NULL,      -- Session or classroom ID for filtering
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_realtime_notifications_channel ON realtime_notifications(channel);
CREATE INDEX idx_realtime_notifications_created ON realtime_notifications(created_at);
```

## Flow

1. Server commits domain change (e.g., sign-in)
2. Broadcaster inserts notification into `realtime_notifications`
3. Supabase Realtime broadcasts via Postgres Changes
4. Client receives minimal payload (IDs only, no PII)
5. Client hydrates full data via cached tRPC query refetch

## Cleanup

Old notifications are cleaned up hourly via `/api/cron/cleanup-notifications`. Notifications older than 1 hour are deleted.

---

# 8. Smartboard Architecture

- Powered entirely by projections
- Read-only, no authentication
- Classroom code determines view permissions
- Zero sensitive data (names only, no email, no legal name)
- Event-driven refresh with 2-second window

---

# 9. Command Hooks Architecture

## 9.1 Overview

Command hooks provide optimistic updates for tRPC mutations. In event-sourced terminology, what tRPC calls a "mutation" is really a **command** (an intent to change state). The hooks are named accordingly.

### Consistency Model

1. **Optimistic updates** provide instant UI feedback
2. **Rollback on error** ensures UI doesn't show invalid state
3. **Realtime subscriptions** correct any drift between optimistic and actual state
4. **No invalidation on success** — trust the optimistic update + realtime

## 9.2 Directory Structure

```
src/
├── hooks/
│   └── commands/
│       ├── index.ts                    # Re-exports all command hooks
│       ├── use-presence-commands.ts    # Sign-in/sign-out commands
│       ├── use-session-commands.ts     # Session lifecycle commands
│       ├── use-help-commands.ts        # Help request commands
│       ├── use-profile-commands.ts     # Profile update commands
│       ├── use-student-commands.ts     # Student management commands
│       └── use-ninja-commands.ts       # Ninja domain/assignment commands
├── components/
│   └── ui/
│       └── toast.tsx                   # Toast notification system
```

## 9.3 Hook API Pattern

Each command hook follows this pattern:

```typescript
export function useXxxCommands(contextId: string) {
  const utils = trpc.useUtils();
  const { showError, showSuccess } = useToast();

  const mutation = trpc.xxx.doSomething.useMutation({
    onMutate: async (input) => {
      // 1. Cancel outgoing queries
      await utils.xxx.getData.cancel({ contextId });

      // 2. Snapshot previous state
      const previous = utils.xxx.getData.getData({ contextId });

      // 3. Apply optimistic update
      utils.xxx.getData.setData({ contextId }, (old) => /* transform */);

      // 4. Return context for rollback
      return { previous };
    },
    onError: (err, _vars, context) => {
      // Rollback on error
      if (context?.previous !== undefined) {
        utils.xxx.getData.setData({ contextId }, context.previous);
      }
      utils.xxx.getData.invalidate({ contextId });
      showError(err.message || "Operation failed");
    },
    onSuccess: () => {
      // Trust optimistic update + realtime for consistency
    },
  });

  return {
    doSomething: (input) => mutation.mutate({ contextId, ...input }),
    isPending: mutation.isPending,
  };
}
```

## 9.4 Per-Item Pending State

For list operations, track pending state per item:

```typescript
const [pending, setPending] = useState<Set<string>>(new Set());

const mutation = trpc.xxx.mutate.useMutation({
  onMutate: ({ itemId }) => {
    setPending((prev) => new Set(prev).add(itemId));
    // ... optimistic update
  },
  onSuccess: (_data, { itemId }) => {
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  },
  onError: (_err, { itemId }) => {
    // Same cleanup in onError
  }
});

return {
  isPendingFor: (id: string) => pending.has(id)
};
```

## 9.5 Available Hooks

| Hook                                     | Context             | Operations                                                          |
| ---------------------------------------- | ------------------- | ------------------------------------------------------------------- |
| `usePresenceCommands`                    | sessionId, students | signIn, signOut, isPendingFor                                       |
| `useSignInCommand` / `useSignOutCommand` | sessionId           | Self sign-in/out                                                    |
| `useSessionCommands`                     | classroomId         | create, start, end                                                  |
| `useHelpCommands`                        | sessionId           | createRequest, cancelRequest                                        |
| `useProfileCommands`                     | —                   | updateProfile                                                       |
| `useStudentCommands`                     | classroomId         | addStudent, updateStudent, removeStudent, bulkImport                |
| `useNinjaCommands`                       | classroomId         | createDomain, updateDomain, archiveDomain, assignNinja, revokeNinja |

## 9.6 Toast Notifications

All command hooks use the centralized toast system:

```typescript
import { useToast } from '@/components/ui/toast';

const { showError, showSuccess } = useToast();
```

`ToastProvider` is included in the root layout.

---

# 10. Deployment Pipeline

```

GitHub (main) → Vercel Build → Production
↓
PR branch → Preview Deploy

```

- Database migrations auto-run on deploy
- Environment variables set via Vercel
- Supabase connections handled server-side

---

# 11. V2 Extensions

The following sections describe V2-only capabilities.

---

## V2-A: File Storage

### Requirements

- Store photos from handoffs and chores
- Serve images quickly
- Control access (no public URLs)

### Implementation

Supabase Storage with signed URLs:

```

Bucket: forge-media/
{school_id}/
{classroom_id}/
status-updates/{uuid}.jpg
chores/{uuid}.jpg
profiles/{uuid}.jpg

```

### Upload Flow

```

1. Client requests signed upload URL from API
2. API generates short-lived signed URL
3. Client uploads directly to storage
4. Client sends file path to API
5. API creates Media record

```

### Image Processing

- Resize on upload (max 1200px wide)
- Generate thumbnail (200px)
- Strip EXIF data

---

## V2-B: Progress Directory Structure

The `progress/` directories under `app/` and `components/` are V2-only and cover:

- Standards list UI
- Evidence upload
- Student progress dashboards
- Class grid views
- Teacher evaluation tools

None are active in V1.
