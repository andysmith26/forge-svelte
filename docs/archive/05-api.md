# Forge API Design

All tRPC procedures for V1.

---

## Overview

- **Protocol:** tRPC (type-safe RPC)
- **Transport:** HTTP (Next.js API routes)
- **Auth:** Session-based (NextAuth.js)
- **Real-time:** Supabase Realtime subscriptions

---

## V1 Constraints

The following are explicitly **not** in V1:

- **Photo/media upload**: No media router; status updates and chores are text-only
- **Progress tracking**: No progress router; standards and evidence are V2
- **Volunteer accounts**: No volunteer-specific endpoints

V1 scope follows `01-vision-and-scope.md`.

---

## Router Structure

```

src/server/routers/
├── _app.ts
├── auth.ts
├── classroom.ts
├── session.ts
├── presence.ts
├── project.ts
├── help.ts
├── chore.ts
├── ninja.ts
└── display.ts

```

---

## Real-Time Subscriptions

| Subscription              | Input           | Output                      |
| ------------------------- | --------------- | --------------------------- |
| presence.onPresenceChange | { sessionId }   | { type, person, timestamp } |
| help.onQueueChange        | { classroomId } | { type, request }           |
| project.onStatusUpdate    | { projectId }   | { update, subsystem }       |
| chore.onChoreChange       | { classroomId } | { type, instance }          |
| display.onPresenceChange  | { code }        | PresenceEvent               |
| display.onQueueChange     | { code }        | QueueEvent                  |

### Real-Time Guarantees

Changes propagate to all connected clients within **2 seconds** under normal network conditions for:

- Presence board
- Help queue
- Smartboard displays

---

## Endpoint Summary

| Router    | Queries | Mutations | Subscriptions |
| --------- | ------- | --------- | ------------- |
| auth      | 1       | 3         | 0             |
| classroom | 4       | 7         | 0             |
| session   | 4       | 5         | 0             |
| presence  | 4       | 4         | 1             |
| project   | 11      | 9         | 1             |
| help      | 5       | 7         | 1             |
| chore     | 9       | 7         | 1             |
| ninja     | 6       | 2         | 0             |
| display   | 5       | 0         | 2             |
| **Total** | **49**  | **44**    | **6**         |

---

## auth

```

auth.getSession          : query    → Session | null
auth.signInWithPin       : mutation → { classroomCode, pin } → Session
auth.signOut             : mutation → void
auth.refreshSession      : mutation → Session

```

Google OAuth handled by NextAuth.js, not tRPC.

---

## classroom

```

classroom.get            : query → { id } → Classroom
classroom.getBySlug      : query → { schoolSlug, classroomSlug } → Classroom
classroom.list           : query → Classroom[]
classroom.create         : mutation → { name, schoolId, ... } → Classroom
classroom.update         : mutation → { id, ... } → Classroom
classroom.archive        : mutation → { id } → void

classroom.members.list       : query → { classroomId } → Person[]
classroom.members.add        : mutation → { classroomId, email, role } → Membership
classroom.members.addBulk    : mutation → { classroomId, members[] } → Membership[]
classroom.members.updateRole : mutation → { classroomId, personId, role } → Membership
classroom.members.remove     : mutation → { classroomId, personId } → void
classroom.members.getInviteLink : query → { classroomId } → string

```

---

## session

```

session.getCurrent       : query    → { classroomId } → Session | null
session.get              : query    → { id } → Session
session.list             : query    → { classroomId, from?, to? } → Session[]
session.create           : mutation → { classroomId, name?, date, startTime, endTime } → Session
session.start            : mutation → { id } → Session
session.end              : mutation → { id } → Session
session.update           : mutation → { id, ... } → Session
session.cancel           : mutation → { id } → Session

```

---

## presence

```

presence.signIn          : mutation → { sessionId } → SignIn
presence.signOut         : mutation → { sessionId } → SignIn
presence.signInOther     : mutation → { sessionId, personId } → SignIn
presence.signOutOther    : mutation → { sessionId, personId } → SignIn

presence.getMyStatus     : query → { sessionId } → SignIn | null
presence.listPresent     : query → { sessionId } → Person[]
presence.listForSession  : query → { sessionId } → SignIn[]

presence.onPresenceChange : subscription → { sessionId } → SignInEvent

```

---

## project

```

project.get              : query → { id } → Project
project.list             : query → { classroomId } → Project[]
project.listAll          : query → { classroomId } → Project[]
project.create           : mutation → { classroomId, name, description? } → Project
project.update           : mutation → { id, ... } → Project
project.archive          : mutation → { id } → void

project.members.list      : query → { projectId } → ProjectMembership[]
project.members.add       : mutation → { projectId, personId, role? } → ProjectMembership
project.members.remove    : mutation → { projectId, personId } → void
project.members.updateRole: mutation → { projectId, personId, role } → ProjectMembership

project.subsystems.list   : query    → { projectId } → Subsystem[]
project.subsystems.create : mutation → { projectId, name, description? } → Subsystem
project.subsystems.update : mutation → { id, ... } → Subsystem
project.subsystems.archive: mutation → { id } → void

project.statusUpdates.list       : query    → { subsystemId, limit?, cursor? } → StatusUpdate[]
project.statusUpdates.listRecent : query    → { projectId, since? } → StatusUpdate[]
project.statusUpdates.listUnseen : query    → { projectId } → StatusUpdate[]
project.statusUpdates.get        : query    → { id } → StatusUpdate
project.statusUpdates.create     : mutation → { subsystemId, whatIDid, whatsNext?, blockers?, questions? } → StatusUpdate
project.statusUpdates.markViewed : mutation → { ids[] } → void
project.statusUpdates.listWithBlockers : query → { classroomId } → StatusUpdate[]

project.onStatusUpdate : subscription → { projectId } → StatusUpdate

```

**V1 Note:** Status updates are text-only. Photo capture is V2.

---

## help

```

help.categories.list     : query    → { classroomId } → HelpCategory[]
help.categories.create   : mutation → { classroomId, name, ninjaDomainId? } → HelpCategory
help.categories.update   : mutation → { id, ... } → HelpCategory
help.categories.delete   : mutation → { id } → void

help.requests.getQueue   : query    → { classroomId } → HelpRequest[]
help.requests.getMine    : query    → { sessionId } → HelpRequest | null
help.requests.get        : query    → { id } → HelpRequest
help.requests.create     : mutation → { sessionId, categoryId?, description, whatITried, urgency } → HelpRequest
help.requests.cancel     : mutation → { id, reason? } → HelpRequest
help.requests.claim      : mutation → { id } → HelpRequest
help.requests.unclaim    : mutation → { id } → HelpRequest
help.requests.resolve    : mutation → { id, notes? } → HelpRequest

help.onQueueChange : subscription → { classroomId } → HelpRequestEvent

```

### Urgency Levels (Aligned with System-Wide Model)

UI may present richer phrasing (e.g., “Blocked,” “Question,” “Check My Work”),  
but API accepts only:

| Value    | Meaning                     |
| -------- | --------------------------- |
| `normal` | Standard question or issue  |
| `urgent` | Blocked and cannot continue |

These mappings are canonical for V1.

---

## chore

```

chore.definitions.list    : query    → { classroomId } → Chore[]
chore.definitions.get     : query    → { id } → Chore
chore.definitions.create  : mutation → { classroomId, name, description, size, recurrence, verificationType, location? } → Chore
chore.definitions.update  : mutation → { id, ... } → Chore
chore.definitions.archive : mutation → { id } → void

chore.instances.listAvailable : query → { classroomId } → ChoreInstance[]
chore.instances.listMine      : query → { classroomId } → ChoreInstance[]
chore.instances.listPendingVerification : query → { classroomId } → ChoreInstance[]
chore.instances.listAll       : query → { classroomId, status? } → ChoreInstance[]
chore.instances.get           : query → { id } → ChoreInstance
chore.instances.create        : mutation → { choreId, dueDate? } → ChoreInstance
chore.instances.claim         : mutation → { id } → ChoreInstance
chore.instances.unclaim       : mutation → { id } → ChoreInstance
chore.instances.complete      : mutation → { id, notes? } → ChoreInstance
chore.instances.verify        : mutation → { id, decision, feedback? } → ChoreVerification

chore.onChoreChange : subscription → { classroomId } → ChoreInstanceEvent

```

### Verification Types

| Value     | Meaning                       |
| --------- | ----------------------------- |
| `self`    | Self-verified                 |
| `peer`    | Requires peer verification    |
| `teacher` | Requires teacher verification |

**V1 Note:** Verification is text-only. Photo verification is V2.

---

## ninja

```

ninja.domains.list    : query    → { classroomId } → NinjaDomain[]
ninja.domains.create  : mutation → { classroomId, name, description? } → NinjaDomain
ninja.domains.update  : mutation → { id, ... } → NinjaDomain
ninja.domains.archive : mutation → { id } → void

ninja.assignments.list   : query    → { classroomId } → NinjaAssignment[]
ninja.assignments.assign : mutation → { classroomId, personId, ninjaDomainId } → NinjaAssignment

```

---

## display (Public, No Auth)

```

display.validateCode    : query → { code } → { valid, classroomId, classroomName }
display.getPresence     : query → { code } → { people[], ninjaOnDuty[] }
display.getHelpQueue    : query → { code } → { requests[] }
display.getProjectStatus: query → { code } → { projects[] }
display.getChoreBoard   : query → { code } → { available[], inProgress[], recentlyCompleted[] }

display.onPresenceChange : subscription → { code } → PresenceEvent
display.onQueueChange    : subscription → { code } → QueueEvent

```

### Security

- No authentication required
- Classroom code is rotatable
- Rate limited
- Returns only display-safe, non-sensitive data
- Read-only

---

## Patterns

### Pagination

```typescript
type PaginatedInput = {
  limit?: number; // default 50, max 100
  cursor?: string;
};

type PaginatedOutput<T> = {
  items: T[];
  nextCursor?: string;
  total?: number;
};
```

### Errors

```typescript
throw new TRPCError({
  code: 'UNAUTHORIZED',
  code: 'FORBIDDEN',
  code: 'NOT_FOUND',
  code: 'BAD_REQUEST',
  code: 'CONFLICT'
});
```

### Validation (Zod)

```
const createHelpRequestInput = z.object({
  sessionId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  whatITried: z.string().min(20).max(1000),
  urgency: z.enum(['normal', 'urgent']),
});

const createStatusUpdateInput = z.object({
  subsystemId: z.string().uuid(),
  whatIDid: z.string().min(20).max(2000),
  whatsNext: z.string().max(1000).optional(),
  blockers: z.string().max(1000).optional(),
  questions: z.string().max(1000).optional(),
});
```

---

## V2 API Additions

```
media.getUploadUrl
media.confirmUpload
media.get
media.getViewUrl
media.delete

progress.standards.list
progress.standards.get
progress.standards.create
progress.standards.update
progress.standards.reorder
progress.standards.archive

progress.tracking.getMine
progress.tracking.getForStudent
progress.tracking.getClassGrid
progress.tracking.get
progress.tracking.updateStatus
progress.tracking.listReadyForAssessment

progress.evidence.list
progress.evidence.add
progress.evidence.remove
```
