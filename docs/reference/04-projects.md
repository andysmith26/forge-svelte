# Forge Projects Module — Feature Specification

This spec defines the Projects module for Forge. It is grounded in [02-learning-principles.md](02-learning-principles.md) and constrained by [01-vision-and-scope.md](01-vision-and-scope.md). It supersedes the archived user stories (4.1–4.6) and data model where they conflict with the learning principles — specifically around student agency, project ownership, and the absence of evaluative status fields.

---

## Context

Projects is Phase 2 in the V1 scope — the most important unimplemented feature. The vision doc is explicit: "Students producing artifacts is the core purpose, not an add-on." Every other module (presence, help, chores) exists to support the fact that students are building things. Projects makes that building legible.

The specific problem Projects solves: **physical builds persist across sessions, but the people who work on them do not.** A student who worked on the robot arm on Tuesday may not be present on Thursday. The student who shows up Thursday needs to know what happened — what was accomplished, what broke, what should happen next — or they start over, redo work, or sit idle. This is the handoff problem.

---

## 1. Purpose

Projects is a **continuity layer** — it ensures construction can continue across time and across people by making the state of physical work legible to anyone who needs to pick it up.

Every feature is justified by one question: **does this help a student continue building something?**

_Grounding: Principles 1 (construction), 4 (artifacts), 11 (time for immersion), 14 (technology earns its place)._

---

## 2. Core Concepts

### Project

A named, shared physical build that persists across sessions. A robot, a circuit, a mechanical arm, a coded controller — something students are making together over days or weeks.

A Project belongs to a Classroom. It has a name, an optional description, and zero or more members. It carries **no due date, no status field, no percentage complete**. Its only temporal signal is operational freshness — how recently someone wrote a handoff.

A Project is not an assignment. It is not handed out, graded, or evaluated through Forge. It is a named container for a physical thing that needs coordination.

### Subsystem

An optional subdivision of a Project. If a robot has a chassis, an arm, and a control program, those might be three subsystems. Subsystems help handoffs be specific ("I worked on the arm") rather than vague ("I worked on the robot"). They are **labels, not task lists**.

- Defined by project members at any time
- No required structure — zero subsystems is perfectly valid
- No status field on subsystems (the archived data model had `not_started/in_progress/blocked/completed` — this is removed as evaluative)

### Handoff

The fundamental unit of project documentation. A structured text entry a student writes when they finish working. It answers two questions:

1. **What did I do?** — what was accomplished, attempted, or discovered
2. **What should happen next?** — what the next person should know

Handoffs are messages from one builder to the next builder. They are not status reports submitted to a teacher.

### "What's New"

The view a student sees when they open a project they haven't looked at recently. Shows all handoffs since that student's last contribution or last "mark as read." This is the answer to "what happened while I was gone?"

---

## 3. Lifecycle

### Creation

A Project can be created by **any classroom member** — student or teacher. The creator names it, optionally describes it, and becomes the first member.

**Why students can create projects:** Students own their builds. A student who starts building something should name it and invite teammates without waiting for the teacher. _(Principle 2: the child is the agent; Principle 13: sequence is the learner's job.)_

> **Departure from archived spec:** Story 4.1 had teacher-only creation. This reverses that to align with the learning principles. Teachers can still create projects (for competition teams, class challenges), but it is not the only path.

### Evolution

Projects evolve through handoffs. There is no status field to update, no phase to advance through, no checklist to complete. The project's story is its timeline of handoffs.

> **Departure from archived spec:** The archived data model had `status: active | paused | completed | archived`. The `active/paused/completed` states are removed — they are evaluative status fields that the system has no business tracking. Only **archiving** remains as a visibility action (see below).

### Archiving

When a build is finished (or abandoned, or paused), the project simply stops receiving handoffs. Its freshness signal goes cold.

- A **teacher** can archive a project to remove it from active lists. Archiving is reversible.
- A **student** can hide a project from their personal view without affecting other members.
- Archiving is a visibility action, not a judgment.
- **No deletion.** Projects are never deleted. Event history is permanent.

---

## 4. Membership

### Who can be a member

Any student in the classroom. Teachers are **not** project members — they have visibility into all projects by role, but don't join projects or write handoffs as members. (A teacher writing a handoff does so as an intervention, marked `byTeacher: true`.)

### Joining

1. **Invitation by an existing member.** Any current member can add another classroom student. The added student does not need to accept — they appear in the member list and the project appears in their list.
2. **Self-join.** Any student can browse non-archived projects and join one. This supports discovery: a student sees an interesting project and wants to contribute.
3. **Teacher adds student.** An intervention (`byTeacher: true`) for forming teams.

### Leaving

- A student can leave at any time. Their handoffs remain in the timeline.
- A teacher can remove a student (`byTeacher: true`). Rare.

### Constraints

- A student can be a member of **multiple projects** simultaneously. No limit.
- A project can have **zero members** temporarily. Not auto-archived.
- Membership changes are recorded as events.

---

## 5. Handoffs

Handoffs are the reason Projects exists. Everything else is scaffolding for reliable handoffs.

### When to write

Forge **invites but never mandates**. No automatic prompt at sign-out, no required frequency, no minimum cadence.

The system offers a gentle, dismissible prompt at natural moments:

- At sign-out, if the student has active projects and hasn't written a handoff this session: _"Want to leave a note for your teammates?"_
- When reading "What's New," the UI offers a natural place to respond.

> **Rationale:** Enforced documentation turns a continuity tool into a compliance tool. If handoffs aren't happening, that's a social problem for the team to debug, not a software problem to enforce. _(Principle 7: debugging is the pedagogy.)_

### Structure

| Field       | Required | Max length   | Purpose                                          |
| ----------- | -------- | ------------ | ------------------------------------------------ |
| What I did  | Yes      | 2000 chars   | What was accomplished, attempted, discovered     |
| What's next | No       | 1000 chars   | What the next person should do or know           |
| Subsystems  | No       | Multi-select | Which parts of the build were involved           |
| Blockers    | No       | 1000 chars   | Things that can't proceed without external input |
| Questions   | No       | 1000 chars   | Things the author wants teammates to think about |

"What I did" has a 20-character minimum — enough to prevent blanks but low enough for _"Tightened the bolts on the left wheel mount"_.

### Authorship

Handoffs are written by the student who did the work. A teacher can write one on a student's behalf (intervention, `byTeacher: true`), but this should be rare. The cognitive work of articulating what happened is itself valuable. _(Principle 2.)_

### Immutability

Handoffs are **append-only**. Once written, they cannot be edited or deleted by anyone. Corrections are follow-up entries. Teacher annotations are separate entries marked `byTeacher: true`.

**Rationale:** Trust in the timeline matters more than fixing typos. If handoffs could be edited after the fact, the next person could never be sure they're reading what was actually communicated.

### Reading handoffs ("What's New")

When a student opens a project:

- Shows all handoffs since their last contribution or last "mark as read"
- Chronological order, oldest first (follow the narrative forward)
- Blockers and questions are visually prominent
- "Mark as read" clears the unread state without writing a handoff
- First-time members see the last 5 handoffs as context

### Session context

Each handoff records a `sessionId` — **informational only**. Handoffs are not session-scoped. A handoff from Session 47 is visible in Session 48 and beyond. The `sessionId` enables the teacher dashboard's "what happened this session" narrative view.

---

## 6. Status and Visibility

### Project visibility

| Viewer             | What they see                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| **Members**        | Full project: name, description, all handoffs, subsystems, "What's New"                         |
| **Teachers**       | All projects in the classroom with full detail                                                  |
| **Other students** | Project names and members (browseable list for self-join). No handoff content unless they join. |

All projects are browseable by default. Members can make a project **members-only** (hides it from the browse list) for cases like competition robots with strategy concerns.

### Freshness signals

Based on time since the last handoff, measured in **sessions** (not calendar days):

| Signal      | Condition                       | Visual |
| ----------- | ------------------------------- | ------ |
| Active      | Handoff within last 2 sessions  | Green  |
| Quiet       | 3–5 sessions since last handoff | Yellow |
| Stale       | 5+ sessions since last handoff  | Red    |
| No handoffs | Project has no handoffs yet     | Gray   |

**These are not progress indicators.** A stale project may be on planned pause, waiting for parts, or simply finished but not archived. Freshness tells the teacher "this might be worth checking on" — not "this team isn't working hard enough." _(Principles 9, 15.)_

> **Why sessions, not days:** A classroom that meets Monday/Wednesday/Friday should see a project updated last Friday as "1 session ago" on Monday, not "3 days stale."

### "Currently working on" connection

The Person entity's `currentlyWorkingOn` field (free-text, visible on smartboard/presence) can be manually set to match a project name. The system **suggests** project names as quick-fill options but **never auto-populates**.

**Rationale:** "Currently working on" is a student-authored statement of intent. A student might be on three projects but focusing on one thing today. Auto-populating removes agency over self-presentation. _(Principle 2.)_

### Unread indicators

A project card in "My Projects" shows an unread badge with a count when there are unseen handoffs. This is the primary "your teammates wrote something — go read it" signal.

---

## 7. Teacher Role

The teacher is an **observer and environment designer**, not a manager or evaluator.

### Teachers see

- All projects in their classroom with member lists and freshness signals
- All handoffs across all projects (full timeline)
- An activity feed: recent handoffs across all projects, filterable by project, student, "has blockers," or time range
- A blocker summary: which projects have unresolved blockers mentioned in handoffs

### Teachers do

- Create projects when needed (competition teams, class challenges)
- Add or remove students from projects (`byTeacher: true`)
- Add **teacher notes** to a timeline — separate entries, not edits to student handoffs. E.g., "I ordered the parts you need" or "Talk to me about the wiring approach."
- Archive or unarchive projects

### Teachers do NOT

- Score, rate, or evaluate handoffs
- See analytics on handoff frequency, word count, or "engagement"
- Assign tasks within projects
- Set deadlines or milestones
- Approve or reject handoffs
- See "time spent on project" metrics

---

## 8. Rules and Invariants

### PRJ-1: Projects are not session-scoped

Projects, memberships, handoffs, and subsystems persist across sessions. A `sessionId` on a handoff is informational metadata only. _(From vision INV-2.)_

### PRJ-2: Handoffs are immutable

Once written, a handoff cannot be edited or deleted by any actor. Corrections are new entries. Teacher annotations are separate entries. _(From architecture: event store is append-only.)_

### PRJ-3: Students own their projects

Students create, name, add members, define subsystems, and write handoffs. Teachers can do all of these as interventions (`byTeacher: true`), but student actions are the default path. No teacher approval required. _(Principle 2.)_

### PRJ-4: No evaluation through Projects

No scores, grades, rubrics, completion percentages, or quality ratings. Freshness signals are operational, not evaluative. Handoff content is never analyzed or compared. _(Principles 9, 12, 15.)_

### PRJ-5: Visibility without surveillance

Information is surfaced for coordination, not judgment. A project with no recent handoffs is "quiet," not "behind." _(Principle 9.)_

### PRJ-6: Interventions are explicit and additive

Teacher actions include `byTeacher: true`. They supplement the record, never overwrite. _(Vision INV-5.)_

### PRJ-7: No enforced workflow

The system invites handoffs at natural moments but never mandates them. No minimum frequency, no required fields beyond "what I did." _(Principles 2, 7, 13.)_

### PRJ-8: Module gating

All Projects functionality is gated behind the `projects` module being enabled. When disabled, no routes, navigation, or smartboard panels are accessible.

---

## 9. What Projects Is NOT

- **Not a task manager.** No task lists, assignees, due dates, or kanban columns.
- **Not an assignment tracker.** Teachers don't "assign" projects through Forge. No rubrics, deadlines, or grading.
- **Not a project management tool.** No Gantt charts, sprints, story points, or velocity.
- **Not a journal or reflection tool.** Handoffs are operational messages to the next builder, not self-assessments. _(Student reflection is V2.)_
- **Not a portfolio or showcase.** Projects are working documents. _(Gallery/showcase is V2.)_
- **Not a communication platform.** Handoffs are one-directional. Not chat, not threads.
- **Not a surveillance tool.** A student who writes nothing has used the system correctly — they just haven't communicated with their teammates.

---

## 10. Interactions with Other Modules

### Presence

- A student must be signed in to write a handoff (documenting work done while physically present)
- Sign-out flow optionally prompts for a handoff if the student has active projects and hasn't written one this session

### Profile

- "Currently working on" offers project names as quick-fill suggestions, never auto-fills
- "Ask me about" topics may overlap with project subsystems — no formal connection

### Help Queue

- A help request's `topic` may reference a project by name (free text, no formal link in V1)
- Blockers in handoffs are not auto-converted to help requests

### Smartboard

- Deferred to a separate spec. When implemented: project names, member counts, and freshness signals. No handoff content on the public display.

### Teacher Dashboard (Phase 6)

- Aggregates project freshness and blocker mentions alongside presence and help data

---

## 11. Domain Events

| Event                     | Trigger                  | Key payload                                          |
| ------------------------- | ------------------------ | ---------------------------------------------------- |
| `PROJECT_CREATED`         | New project              | projectId, classroomId, name, createdBy, byTeacher   |
| `PROJECT_UPDATED`         | Name/description changed | projectId, changedFields, updatedBy, byTeacher       |
| `PROJECT_ARCHIVED`        | Project archived         | projectId, archivedBy, byTeacher                     |
| `PROJECT_UNARCHIVED`      | Project restored         | projectId, unarchivedBy, byTeacher                   |
| `PROJECT_MEMBER_ADDED`    | Student joins/added      | projectId, personId, addedBy, byTeacher              |
| `PROJECT_MEMBER_REMOVED`  | Student leaves/removed   | projectId, personId, removedBy, byTeacher            |
| `PROJECT_SUBSYSTEM_ADDED` | Subsystem defined        | projectId, subsystemId, name, addedBy                |
| `HANDOFF_SUBMITTED`       | Handoff written          | handoffId, projectId, sessionId, authorId, byTeacher |

All events carry standard `EventMetadata` (eventId, occurredAt, correlationId, version).

---

## 12. Data Model

> This revises the archived data model ([`../archive/03-data-model.md`](../archive/03-data-model.md)) to align with the learning principles. Key changes: no `status` enum on Project or Subsystem, no `role` on ProjectMembership, handoffs are project-level (not subsystem-level).

### Project

```
Project
├── id                  : uuid, primary key
├── classroom_id        : uuid → Classroom
├── name                : string, required, max 100 chars
├── description         : text, optional, max 500 chars
├── is_archived         : boolean, default false
├── visibility          : enum (browseable, members_only), default browseable
├── created_by_id       : uuid → Person
├── created_at          : timestamp
└── updated_at          : timestamp

INDEX(classroom_id, is_archived)
```

**Changes from archived model:** Removed `status` enum (`active/paused/completed/archived`). Replaced with simple `is_archived` boolean. The other statuses were evaluative.

### ProjectMembership

```
ProjectMembership
├── id                  : uuid, primary key
├── project_id          : uuid → Project
├── person_id           : uuid → Person
├── is_active           : boolean, default true
├── joined_at           : timestamp
├── left_at             : timestamp, nullable
├── created_at          : timestamp
└── updated_at          : timestamp

UNIQUE(project_id, person_id) WHERE is_active = true
```

**Changes from archived model:** Removed `role` field. No roles within projects — all members are equal contributors.

### Subsystem

```
Subsystem
├── id                  : uuid, primary key
├── project_id          : uuid → Project
├── name                : string, required, max 60 chars
├── display_order       : integer
├── is_active           : boolean, default true
├── created_at          : timestamp
└── updated_at          : timestamp
```

**Changes from archived model:** Removed `status` enum (`not_started/in_progress/blocked/completed`), removed `description`. Subsystems are labels for handoff specificity, not trackable work items.

### Handoff

```
Handoff
├── id                  : uuid, primary key
├── project_id          : uuid → Project
├── author_id           : uuid → Person
├── session_id          : uuid → Session, nullable (INFORMATIONAL ONLY)
├── what_i_did          : text, required, min 20 chars, max 2000 chars
├── whats_next          : text, optional, max 1000 chars
├── blockers            : text, optional, max 1000 chars
├── questions           : text, optional, max 1000 chars
├── created_at          : timestamp

INDEX(project_id, created_at DESC)
```

**Changes from archived model:** Renamed from `StatusUpdate` to `Handoff` (clearer intent). Moved from subsystem-level to project-level — a handoff is about the project, with optional subsystem tags via the join table below. This makes handoffs more natural for projects without subsystems.

### HandoffSubsystem (join table)

```
HandoffSubsystem
├── handoff_id          : uuid → Handoff
├── subsystem_id        : uuid → Subsystem

PRIMARY KEY(handoff_id, subsystem_id)
```

Multi-select: a handoff can reference zero or more subsystems.

### HandoffReadStatus

```
HandoffReadStatus
├── id                  : uuid, primary key
├── project_id          : uuid → Project
├── person_id           : uuid → Person
├── last_read_at        : timestamp

UNIQUE(project_id, person_id)
```

**Changes from archived model:** Simplified from per-handoff `StatusUpdateView` to per-project `HandoffReadStatus`. Rather than tracking which specific handoffs were viewed, we track the timestamp of the student's last read. Any handoff created after `last_read_at` is unread. This is simpler and sufficient for "What's New."

---

## 13. Key Departures from Archived Spec

| Archived spec                                                    | This spec                                      | Rationale                                    |
| ---------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Teacher-only project creation (4.1)                              | Any member can create                          | Principle 2: child is the agent              |
| `project_status: active\|paused\|completed\|archived`            | `is_archived` boolean only                     | No evaluative status fields (Principle 9)    |
| `subsystem_status: not_started\|in_progress\|blocked\|completed` | No status on subsystems                        | Subsystems are labels, not trackable items   |
| `role` on ProjectMembership                                      | No roles                                       | All members are equal contributors           |
| StatusUpdate belongs to Subsystem                                | Handoff belongs to Project, tags Subsystems    | More natural for projects without subsystems |
| Per-update read tracking (StatusUpdateView)                      | Per-project read timestamp (HandoffReadStatus) | Simpler, sufficient for "What's New"         |
| Projects visible only to assigned students                       | Browseable by default with self-join           | Supports discovery and student agency        |
