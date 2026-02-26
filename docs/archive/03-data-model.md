# Forge Data Model

Complete database schema for V1.

For term definitions and invariants, see the **Cross-Document Glossary** and **Core Invariants** in `01-vision-and-scope.md`.

---

## Design Principles

1. **Event-sourced**: All mutations occur via append-only domain events; projections derive current state
2. **Multi-tenant from day one**: School → Classroom → everything else
3. **Single-school identity**: In V1, a Person belongs to exactly one School
4. **Audit trail**: The DomainEvent table is the authoritative record of all actions
5. **Soft deletes**: Nothing truly deleted; archived/inactive flag instead
6. **Minimal PII**: Only what's necessary
7. **Explicit relationships**: Named and typed, no magic strings
8. **Timestamps everywhere**: created_at, updated_at on every table
9. **Sessions are time containers**: Sessions bound presence and help, not projects or chores

---

## V1 Constraints

The following are explicitly **not** in V1:

- **Photo/image capture**: Handoffs and chore verification are text-only
- **Profile photos/avatars**: No profile images in V1
- **Volunteer accounts**: Teacher and student roles only
- **Progress tracking**: Standards, progress, and evidence are V2
- **Cross-school identity**: A Person belongs to exactly one School

---

## Event-Sourced Architecture

Forge uses an **event-sourced architecture**. The DomainEvent table is the sole source of truth. All other tables are **projections**—derived read models that can be regenerated from events.

### Source of Truth

```
DomainEvent (append-only)
    ↓ events
    ↓ replayed/projected into
    ↓
Projections (derived read models)
```

### Projections Overview

| Table               | Type       | Regenerated From                                                                                       | Purpose                 |
| ------------------- | ---------- | ------------------------------------------------------------------------------------------------------ | ----------------------- |
| DomainEvent         | Source     | N/A                                                                                                    | Authoritative event log |
| School              | Definition | `SchoolCreated`, `SchoolUpdated`                                                                       | Tenant container        |
| Classroom           | Definition | `ClassroomCreated`, `ClassroomUpdated`                                                                 | Classroom metadata      |
| Person              | Projection | `PersonCreated`, `ProfileUpdated`                                                                      | Identity records        |
| ClassroomMembership | Projection | `ClassroomMembershipCreated`, membership events                                                        | Role assignments        |
| Session             | Projection | `SessionCreated`, `SessionStarted`, `SessionEnded`                                                     | Time period state       |
| SignIn              | Projection | `StudentSignedIn`, `StudentSignedOut`, `SessionEnded`                                                  | Presence state          |
| Project             | Projection | `ProjectCreated`, `ProjectMembershipChanged`                                                           | Project metadata        |
| ProjectMembership   | Projection | `ProjectMembershipChanged`                                                                             | Team assignments        |
| Subsystem           | Projection | `ProjectCreated`, project events                                                                       | Project components      |
| StatusUpdate        | Projection | `ProjectUpdateSubmitted`                                                                               | Handoff content         |
| StatusUpdateView    | Projection | View tracking events                                                                                   | Read receipts           |
| HelpCategory        | Definition | `HelpCategoryCreated`, `HelpCategoryUpdated`                                                           | Category metadata       |
| HelpRequest         | Projection | `HelpRequested`, `HelpRequestUpdated`, `HelpClaimed`, `HelpUnclaimed`, `HelpResolved`, `HelpCancelled` | Queue state             |
| NinjaDomain         | Definition | `NinjaDomainCreated`, `NinjaDomainUpdated`                                                             | Domain metadata         |
| NinjaAssignment     | Projection | `NinjaAssigned`, `NinjaRevoked`                                                                        | Ninja status            |
| Chore               | Definition | `ChoreDefined`, `ChoreUpdated`, `ChoreArchived`                                                        | Chore templates         |
| ChoreInstance       | Projection | `ChoreClaimed`, `ChoreMarkedComplete`, `ChoreVerified`, `ChoreRejected`                                | Task state              |
| ChoreVerification   | Projection | `ChoreVerified`, `ChoreRejected`                                                                       | Verification records    |

### Regeneration

Projections can be:

- **Rebuilt from scratch** by replaying all relevant events from DomainEvent
- **Updated incrementally** as new events arrive (normal operation)
- **Validated** by comparing current projection state against a fresh replay

This ensures:

- Complete audit trail of all actions
- No data loss from bugs in projection logic
- Ability to add new projections retroactively

---

## Entity Relationship Overview

```
School
  └── Classroom
        ├── Person (via ClassroomMembership)
        ├── Session
        │     └── SignIn (session-scoped)
        │     └── HelpRequest (session-scoped)
        ├── Project (NOT session-scoped)
        │     ├── ProjectMembership
        │     └── Subsystem
        │           └── StatusUpdate (session_id informational)
        │                 └── StatusUpdateView
        ├── HelpCategory
        │     └── NinjaDomain (linked)
        ├── NinjaDomain
        │     └── NinjaAssignment
        ├── Chore (NOT session-scoped)
        │     └── ChoreInstance (session_id optional/informational)
        │           └── ChoreVerification
        └── DomainEvent (source of truth)
```

---

## Domain Events (Source of Truth)

The DomainEvent table is the authoritative record of all mutations. All projections are derived from this table.

### DomainEvent

```
DomainEvent
├── id                  : uuid, primary key
├── school_id           : uuid → School
├── classroom_id        : uuid → Classroom, nullable
├── session_id          : uuid → Session, nullable (informational)
├── event_type          : string, required
├── entity_type         : string, required
├── entity_id           : uuid, required
├── actor_id            : uuid → Person, nullable
├── payload             : jsonb, required
├── created_at          : timestamp

INDEX(school_id, created_at)
INDEX(classroom_id, created_at)
INDEX(entity_type, entity_id)
INDEX(event_type)
```

**Append-only**: Events are never modified or deleted.

### Event Types

| Category | Event Types                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------ |
| Identity | `PersonCreated`, `ProfileUpdated`, `ClassroomMembershipCreated`                                                          |
| Session  | `SessionCreated`, `SessionStarted`, `SessionEnded`                                                                       |
| Presence | `StudentSignedIn`, `StudentSignedOut`                                                                                    |
| Help     | `HelpRequested`, `HelpRequestUpdated`, `HelpClaimed`, `HelpUnclaimed`, `HelpResolved`, `HelpCancelled`                   |
| Project  | `ProjectCreated`, `ProjectMembershipChanged`, `ProjectUpdateSubmitted`                                                   |
| Chore    | `ChoreDefined`, `ChoreUpdated`, `ChoreArchived`, `ChoreClaimed`, `ChoreMarkedComplete`, `ChoreVerified`, `ChoreRejected` |
| Ninja    | `NinjaAssigned`, `NinjaRevoked`                                                                                          |
| Auth     | `UserAuthenticated`, `UserAutoLoggedOut`                                                                                 |

### Teacher Intervention Flag

When a teacher performs an action on behalf of a student, the event payload **must** include `byTeacher: true`:

```json
{
  "event_type": "StudentSignedIn",
  "payload": {
    "person_id": "...",
    "session_id": "...",
    "byTeacher": true
  }
}
```

**Invariant**: Teacher interventions are explicit and labeled. Corrections do not overwrite student events—they append new events with the `byTeacher` flag.

---

## Core Entities

### School

```
School
├── id                  : uuid, primary key
├── name                : string, required
├── slug                : string, unique, url-safe
├── timezone            : string, IANA timezone
├── settings            : jsonb
├── is_active           : boolean, default true
├── created_at          : timestamp
└── updated_at          : timestamp
```

### Classroom

```
Classroom
├── id                  : uuid, primary key
├── school_id           : uuid → School
├── name                : string, required
├── slug                : string, unique within school
├── description         : text, optional
├── display_code        : string, unique, 6 chars (smartboard access)
├── settings            : jsonb
├── is_active           : boolean, default true
├── created_at          : timestamp
└── updated_at          : timestamp
```

### Person

**Identity Scope**: In V1, a Person belongs to exactly one School.

```
Person
├── id                  : uuid, primary key
├── school_id           : uuid → School (required, single-school identity)
├── email               : string, unique globally, nullable
├── legal_name          : string, required
├── display_name        : string, required
├── pronouns            : string, optional
├── grade_level         : string, optional
├── pin_hash            : string, optional (bcrypt)
├── google_id           : string, unique, nullable
├── ask_me_about        : text[]
├── is_active           : boolean, default true
├── last_login_at       : timestamp, nullable
├── created_at          : timestamp
└── updated_at          : timestamp

UNIQUE(email) WHERE email IS NOT NULL
```

**Projection**: Derived from `PersonCreated`, `ProfileUpdated` events.

### ClassroomMembership

```
ClassroomMembership
├── id                  : uuid, primary key
├── classroom_id        : uuid → Classroom
├── person_id           : uuid → Person
├── role                : enum (student, teacher)
├── is_active           : boolean, default true
├── joined_at           : timestamp
├── left_at             : timestamp, nullable
├── created_at          : timestamp
└── updated_at          : timestamp

UNIQUE(classroom_id, person_id)
```

**Projection**: Derived from `ClassroomMembershipCreated` and membership events.

---

## Sessions & Presence

### Sessions as Time Containers

Sessions are **purely temporal boundaries**. They scope:

- **Presence** (sign-in/sign-out)
- **Help requests** (created during active session)

Sessions do **NOT** scope:

- Project definitions and membership
- Project status updates (`session_id` is informational only)
- Chore definitions
- Chore instances (`session_id` is optional and informational)

### Session

```
Session
├── id                  : uuid, primary key
├── classroom_id        : uuid → Classroom
├── name                : string, optional
├── scheduled_date      : date, required
├── start_time          : time, required
├── end_time            : time, required
├── actual_start_at     : timestamp, nullable
├── actual_end_at       : timestamp, nullable
├── status              : enum (scheduled, active, ended, cancelled)
├── created_at          : timestamp
└── updated_at          : timestamp
```

**Projection**: Derived from `SessionCreated`, `SessionStarted`, `SessionEnded` events.

### SignIn

```
SignIn
├── id                  : uuid, primary key
├── session_id          : uuid → Session (required, session-scoped)
├── person_id           : uuid → Person
├── signed_in_at        : timestamp, required
├── signed_out_at       : timestamp, nullable
├── signed_in_by_id     : uuid → Person (for byTeacher tracking)
├── signed_out_by_id    : uuid → Person, nullable
├── signout_type        : enum (self, manual, auto), nullable
├── created_at          : timestamp
└── updated_at          : timestamp

UNIQUE(session_id, person_id)
```

**Projection**: Derived from `StudentSignedIn`, `StudentSignedOut`, `SessionEnded` events.

**Teacher Intervention**: When `signed_in_by_id` ≠ `person_id`, or event has `byTeacher: true`, this was a teacher intervention.

---

## Projects & Handoffs

Projects persist across sessions. They are **NOT** session-scoped.

### Project

```
Project
├── id                  : uuid, primary key
├── classroom_id        : uuid → Classroom
├── name                : string, required
├── description         : text, optional
├── status              : enum (active, paused, completed, archived)
├── created_by_id       : uuid → Person
├── created_at          : timestamp
└── updated_at          : timestamp
```

**Projection**: Derived from `ProjectCreated`, `ProjectMembershipChanged` events.

**Status note**: Project status is an operational/coordination state, not an evaluation or progress metric.

### ProjectMembership

```
ProjectMembership
├── id                  : uuid, primary key
├── project_id          : uuid → Project
├── person_id           : uuid → Person
├── role                : string, optional
├── joined_at           : timestamp
├── left_at             : timestamp, nullable
├── is_active           : boolean, default true
├── created_at          : timestamp
└── updated_at          : timestamp

UNIQUE(project_id, person_id) WHERE is_active = true
```

**Projection**: Derived from `ProjectMembershipChanged` events.

### Subsystem

```
Subsystem
├── id                  : uuid, primary key
├── project_id          : uuid → Project
├── name                : string, required
├── description         : text, optional
├── display_order       : integer
├── status              : enum (not_started, in_progress, blocked, completed)
├── is_active           : boolean, default true
├── created_at          : timestamp
└── updated_at          : timestamp
```

**Projection**: Derived from project-related events.

**Status note**: Subsystem status is operational, not a mastery or achievement signal.

### StatusUpdate

Text-only handoffs for V1. Photo capture deferred to V2.

```
StatusUpdate
├── id                  : uuid, primary key
├── subsystem_id        : uuid → Subsystem
├── author_id           : uuid → Person
├── session_id          : uuid → Session, nullable (INFORMATIONAL ONLY)
├── what_i_did          : text, required (min 20 chars)
├── whats_next          : text, optional
├── blockers            : text, optional
├── questions           : text, optional
├── created_at          : timestamp
└── updated_at          : timestamp

INDEX(subsystem_id, created_at DESC)
```

**Note on session_id**: This field is **informational only**. It records which session the update was submitted during, but status updates persist across sessions and are not deleted when a session ends.

**Projection**: Derived from `ProjectUpdateSubmitted` events.

### StatusUpdateView

```
StatusUpdateView
├── id                  : uuid, primary key
├── status_update_id    : uuid → StatusUpdate
├── person_id           : uuid → Person
├── viewed_at           : timestamp
├── created_at          : timestamp

UNIQUE(status_update_id, person_id)
```

---

## Help Queue

Help requests are session-scoped. They belong to the active session.

### HelpCategory

```
HelpCategory
├── id                  : uuid, primary key
├── classroom_id        : uuid → Classroom
├── name                : string, required
├── description         : text, optional
├── ninja_domain_id     : uuid → NinjaDomain, nullable
├── display_order       : integer
├── is_active           : boolean, default true
├── created_at          : timestamp
└── updated_at          : timestamp
```

**Rule (INV-2): Null Category Semantics**

Null category is a first-class value, not missing data. When `category_id = null` on a HelpRequest:

- The request means "general broadcast"
- It is visible to ALL ninjas regardless of domain
- This ensures no request is orphaned

Teachers may optionally create a "General" category for explicit general requests, but the system must always handle null gracefully as intentional semantics.

### HelpRequest

```
HelpRequest
├── id                  : uuid, primary key
├── classroom_id        : uuid → Classroom
├── session_id          : uuid → Session (required, session-scoped)
├── requester_id        : uuid → Person
├── category_id         : uuid → HelpCategory, nullable
├── description         : text, required
├── what_i_tried        : text, required
├── urgency             : enum (blocked, question, check_work)
├── status              : enum (pending, claimed, resolved, cancelled)
├── claimed_by_id       : uuid → Person, nullable
├── claimed_at          : timestamp, nullable
├── resolved_at         : timestamp, nullable
├── cancelled_at        : timestamp, nullable
├── resolution_notes    : text, optional
├── cancellation_reason : text, optional
├── created_at          : timestamp
└── updated_at          : timestamp

INDEX(classroom_id, status, created_at)
INDEX(session_id, status)
```

**Visibility for Uncategorized Requests (INV-2)**: When `category_id` is null, the help request must be visible to:

- The teacher
- **All ninjas** (regardless of their assigned domains)

Per INV-2, null category means "general broadcast"—it is intentional semantics, not missing data. This ensures no request is orphaned.

**Projection**: Derived from `HelpRequested`, `HelpRequestUpdated`, `HelpClaimed`, `HelpUnclaimed`, `HelpResolved`, `HelpCancelled` events.

---

## Ninja System

### NinjaDomain

```
NinjaDomain
├── id                  : uuid, primary key
├── classroom_id        : uuid → Classroom
├── name                : string, required
├── description         : text, optional
├── display_order       : integer
├── is_active           : boolean, default true
├── created_at          : timestamp
└── updated_at          : timestamp
```

### NinjaAssignment

```
NinjaAssignment
├── id                  : uuid, primary key
├── person_id           : uuid → Person
├── ninja_domain_id     : uuid → NinjaDomain
├── assigned_by_id      : uuid → Person
├── is_active           : boolean, default true
├── assigned_at         : timestamp
├── revoked_at          : timestamp, nullable
├── created_at          : timestamp
└── updated_at          : timestamp

UNIQUE(person_id, ninja_domain_id) WHERE is_active = true
```

**Projection**: Derived from `NinjaAssigned`, `NinjaRevoked` events.

---

## Chores

Chore definitions persist across sessions. They are **NOT** session-scoped.

### Chore

Verification types for V1: self, peer, teacher (no photo verification).

```
Chore
├── id                  : uuid, primary key
├── classroom_id        : uuid → Classroom
├── name                : string, required
├── description         : text, required
├── size                : enum (small, medium, large)
├── estimated_minutes   : integer, optional
├── recurrence          : enum (one_time, daily, weekly)
├── verification_type   : enum (self, peer, teacher)
├── location            : string, optional
├── is_active           : boolean, default true
├── created_by_id       : uuid → Person
├── created_at          : timestamp
└── updated_at          : timestamp
```

### ChoreInstance

```
ChoreInstance
├── id                  : uuid, primary key
├── chore_id            : uuid → Chore
├── session_id          : uuid → Session, nullable (OPTIONAL, INFORMATIONAL)
├── status              : enum (available, claimed, completed, verified, redo_requested, archived)
├── due_date            : date, optional
├── claimed_by_id       : uuid → Person, nullable
├── claimed_at          : timestamp, nullable
├── completed_at        : timestamp, nullable
├── completion_notes    : text, optional
├── created_at          : timestamp
└── updated_at          : timestamp
```

**Note on session_id**: This field is **optional and informational**. Chore instances persist across sessions. If populated, it indicates which session the chore was claimed during, but this does not affect visibility or lifecycle.

**Projection**: Derived from `ChoreClaimed`, `ChoreMarkedComplete`, `ChoreVerified`, `ChoreRejected` events.

### ChoreVerification

```
ChoreVerification
├── id                  : uuid, primary key
├── chore_instance_id   : uuid → ChoreInstance
├── verifier_id         : uuid → Person
├── decision            : enum (approved, redo_requested)
├── feedback            : text, optional
├── verified_at         : timestamp
├── created_at          : timestamp
```

**Projection**: Derived from `ChoreVerified`, `ChoreRejected` events.

---

## System

### AuditLog

```
AuditLog
├── id                  : uuid, primary key
├── school_id           : uuid → School
├── classroom_id        : uuid → Classroom, nullable
├── actor_id            : uuid → Person, nullable
├── action              : string, required
├── entity_type         : string, required
├── entity_id           : uuid, required
├── old_values          : jsonb, nullable
├── new_values          : jsonb, nullable
├── metadata            : jsonb, optional
├── ip_address          : string, nullable
├── user_agent          : string, nullable
├── created_at          : timestamp
```

### SystemSetting

```
SystemSetting
├── id                  : uuid, primary key
├── scope               : enum (system, school, classroom)
├── scope_id            : uuid, nullable
├── key                 : string, required
├── value               : jsonb, required
├── created_at          : timestamp
└── updated_at          : timestamp

UNIQUE(scope, scope_id, key)
```

---

## Enums Summary

| Enum                  | Values                                                            |
| --------------------- | ----------------------------------------------------------------- |
| membership_role       | student, teacher                                                  |
| session_status        | scheduled, active, ended, cancelled                               |
| signout_type          | self, manual, auto                                                |
| project_status        | active, paused, completed, archived                               |
| subsystem_status      | not_started, in_progress, blocked, completed                      |
| urgency_level         | blocked, question, check_work                                     |
| help_status           | pending, claimed, resolved, cancelled                             |
| chore_size            | small, medium, large                                              |
| chore_recurrence      | one_time, daily, weekly                                           |
| verification_type     | self, peer, teacher                                               |
| chore_instance_status | available, claimed, completed, verified, redo_requested, archived |
| verification_decision | approved, redo_requested                                          |
| setting_scope         | system, school, classroom                                         |

---

## Key Invariants

These invariants are enforced across the data model. For full definitions, see **Core Invariants** in `01-vision-and-scope.md`.

### INV-1: Session Scope

> **"Session is both a boundary and a unit of recency, but never a unit of evaluation."**

- Sessions are time containers only
- Sessions scope presence and help requests
- Sessions do NOT scope projects, status updates, chores, or chore instances
- `session_id` on StatusUpdate and ChoreInstance is informational only
- Sessions never serve as units of grading, scoring, or comparison

### INV-2: Null Category Semantics

> **"Null category ≠ unknown; it means 'general broadcast'."**

- When `category_id` is null, the request is visible to teacher + ALL ninjas
- Null is intentional semantics, not missing data
- System must handle null category as a first-class value

### INV-3: Visibility Without Evaluation

- Operational freshness (time since last activity) supports coordination
- Freshness signals are not progress indicators or scores
- No evaluative ranking or scoring in data model

### INV-4: Interventions Are Explicit

- Teacher actions on behalf of students include `byTeacher: true` in event payload
- Teacher corrections are additive (new events), not modifications of existing events
- Original student events are preserved unchanged

### Event Sourcing

- DomainEvent is append-only; events are never modified or deleted
- All projections can be rebuilt by replaying events
- Projection state must match a fresh replay of events

### Identity

- A Person belongs to exactly one School (V1 constraint)
- Email is globally unique (when present)

---

## V2 Additions

The following entities are deferred to V2:

### Volunteer Support (V2)

- Add `volunteer` to membership_role enum
- Volunteer permissions and visibility rules

### Progress Tracking (V2)

- Standard (teacher-defined skills/standards)
- Progress (student progress on standards)
- Evidence (proof of proficiency)

### Photo Capture (V2)

- Media table for file storage
- photo_url on StatusUpdate
- completion_photo on ChoreInstance
- Photo verification type for chores

### Cross-School Identity (V2)

- Remove single-school constraint on Person
- Add cross-school identity linking

### CorrectiveActionTaken (V2)

- Formal teacher intervention records beyond `byTeacher` flag
- Structured corrective action tracking
