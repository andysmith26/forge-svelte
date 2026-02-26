# Forge: Vision and Scope

## What Is Forge?

Forge is a classroom operating system for makerspace-style robotics education.

It is the **situational awareness layer** for a dynamic learning environment—answering, at any moment:

- Who is here?
- What are they working on?
- Who needs help?
- What's blocked?
- What needs attention right now?

Forge is not a gradebook, calendar, or task board.
It is the connective tissue that makes a complex, student-centered classroom function without constant verbal coordination.

---

## The Problem

Makerspace classrooms have operational challenges that traditional classroom software does not address:

1. **Multi-session projects**
   Students work on shared physical builds across different sessions. Work must be handed off reliably between people who are never present at the same time.

2. **Variable pacing**
   Students work at different speeds on different tasks. Whole-class instruction is often inefficient or counterproductive.

3. **Distributed expertise**
   Some students develop deep skill in specific tools or domains. That expertise should be visible and usable by peers.

4. **Blended goals**
   Academic standards coexist with practical skills and life skills. Teachers must manage all of these simultaneously, in real time.

5. **Shared responsibility for space**
   The classroom itself requires upkeep. Maintenance work must be visible, accountable, and normalized.

6. **Help at scale**
   One adult cannot be everywhere. Students need timely help without waiting indefinitely or interrupting others.

Schools currently cobble together spreadsheets, LMS tools, paper sign-in sheets, and verbal coordination.
It works—barely—and at high cognitive cost to the teacher.

---

## Who Is Forge For?

**Primary users**
Middle and high school robotics or makerspace teachers running complex, student-centered classrooms.

**Secondary users**
Students in those classrooms, working independently and collaboratively.

**Future users (V2+)**

- Volunteers and community helpers supporting classroom work under teacher supervision
- Parents with limited visibility into student participation

Forge V1 is explicitly **not** designed for administrators, districts, or system-level reporting.

---

## Minimum Viable Classroom Model (V1 Assumptions)

Forge V1 is designed for a specific classroom reality:

- One teacher
- 10–30 students per session
- One active session at a time
- Shared physical projects persisting across sessions
- School-managed devices (Chromebooks, laptops, tablets)
- A generally stable internet connection (no offline mode)

**Identity Scope:** In V1, a Person belongs to exactly one School. Cross-school identity is not supported.

Forge V1 assumes:

- Students are physically present when signed in (honor system)
- The teacher is the final authority for resolving ambiguity

Forge V1 does **not** attempt to support:

- Fully asynchronous classes
- Remote or hybrid participation
- Multiple teachers co-running a session
- Cross-classroom or cross-school coordination
- Profile photos or avatars
- Volunteer coordination (V2)

---

## Design Principles

### 1. Student Empowerment

Students drive their own work. They control visible progress, initiate help, and take responsibility for contributions.

### 2. Human Connection First

Software facilitates relationships; it does not replace them. Peer-to-peer help and teacher-student dialogue are supported, not automated away.

### 3. Meet Students Where They Are

Capacity varies. Struggle is normal. Multiple entry points and paces are expected.

### 4. Growth Without Stress

Challenge is opt-in escalation, not forced pressure. Failure is treated as learning, not punishment.

### 5. Capacity-Aware Participation

Students participate according to their current energy, skill, and readiness. The system adapts without judgment.

### 6. Operational Visibility Without Evaluation

Forge allows operational visibility, even when it incidentally reveals effort, but avoids evaluative scoring, ranking, or achievement-based comparison. Contributions are visible for coordination purposes, but the system does not rank, score, or compare students.

### 7. Trust by Default

Design for trust and transparency. Address misuse as a cultural issue first, not a surveillance problem.

### 8. Teacher Interventions Are Explicit and Labeled

When teachers correct or override student actions, those interventions are recorded as distinct, labeled events. Teacher corrections supplement the record; they do not overwrite or erase student events.

### 9. Constructionist Learning Alignment

Forge aligns with the learning constraints in `PRINCIPLES_LEARNING.md`:

- Learning happens through making and sharing artifacts, not content delivery.
- The student remains the primary agent; Forge supports choices without prescribing sequence.
- Debugging and productive struggle are learning events; the system should surface context, not auto-resolve thinking work.
- Operational visibility supports teacher judgment without reducing students to scores or compliance metrics.

---

## System Architecture: Event-Sourced with Projections

Forge is an **event-sourced system**. This is a hard requirement for V1. All state changes occur through append-only domain events. Current state is derived by replaying or projecting those events.

### Core Concepts

**Domain Events (Source of Truth)**
All meaningful actions in the classroom produce immutable domain events:

- sign-ins and sign-outs
- help requests and resolutions
- project updates and handoffs
- chore claims and completions

Events are append-only. They are never modified or deleted.

**Projections (Derived Read Models)**
The following tables are **projections**—convenient read models materialized from domain events:

| Projection      | Derived From Events                                                                                    | Purpose                 |
| --------------- | ------------------------------------------------------------------------------------------------------ | ----------------------- |
| SignIn          | `StudentSignedIn`, `StudentSignedOut`, `SessionEnded`                                                  | Current presence state  |
| HelpRequest     | `HelpRequested`, `HelpRequestUpdated`, `HelpClaimed`, `HelpUnclaimed`, `HelpResolved`, `HelpCancelled` | Help queue state        |
| Project         | `ProjectCreated`, `ProjectMembershipChanged`                                                           | Project metadata        |
| Subsystem       | `ProjectCreated`, `ProjectUpdateSubmitted`                                                             | Project component state |
| StatusUpdate    | `ProjectUpdateSubmitted`                                                                               | Handoff content         |
| ChoreInstance   | `ChoreClaimed`, `ChoreMarkedComplete`, `ChoreVerified`, `ChoreRejected`                                | Chore task state        |
| NinjaAssignment | `NinjaAssigned`, `NinjaRevoked`                                                                        | Ninja status            |

**Regeneration Capability**
The authoritative system state must be reconstructable from the DomainEvent table. Projections can be:

- Rebuilt from scratch by replaying all relevant events
- Updated incrementally as new events arrive
- Validated by comparing current state against a fresh replay

This architecture ensures:

- Complete audit trail of all actions
- No data loss from bugs in projection logic
- Ability to add new projections retroactively

### Event Payloads for Teacher Interventions

When a teacher performs an action on behalf of a student, the event payload includes `byTeacher: true`. This flag:

- Distinguishes teacher corrections from student actions
- Enables filtering in reports and audits
- Preserves the original student events unchanged

Teacher corrections are additive—they append new events rather than modifying existing ones.

---

## Sessions as Time Containers

Sessions are **purely temporal boundaries** for classroom periods. They scope presence and help requests, but do not constrain project or chore persistence.

**Sessions bound:**

- Presence (sign-in/sign-out)
- Help requests (created during active session)

**Sessions do NOT bound:**

- Project definitions and membership
- Project status updates (session_id is informational only)
- Chore definitions
- Chore instances (session_id is optional and informational)

This design reflects classroom reality: projects and chores persist across sessions, while presence and help needs are session-specific.

---

## Operational Freshness vs. Progress Tracking

Forge tracks **operational freshness**—time since last activity—to support classroom coordination. It does **not** track mastery, achievement, or skill progress in V1.

**Operational freshness signals include:**

- Inactivity flags (student present but no recent activity)
- Project freshness colors (time since last status update)
- Help queue wait times

These signals answer operational questions:

- "Who might need a check-in?"
- "Which projects haven't been touched lately?"
- "How long has this student been waiting?"

**These are not progress indicators.** A project showing "yellow" (updated 3–5 sessions ago) is not failing—it may be on planned pause, awaiting parts, or simply lower priority. Freshness signals prompt teacher awareness, not judgment.

---

## Real-Time Behavior

Forge provides **real-time updates** for operationally critical views:

| View                   | Update Latency |
| ---------------------- | -------------- |
| Presence board         | ≤ 2 seconds    |
| Help queue (all views) | ≤ 2 seconds    |
| Smartboard displays    | ≤ 2 seconds    |

"Real-time" means: changes propagate to all connected clients within 2 seconds under normal network conditions.

All other views (project feeds, chore boards, dashboards) update on navigation or manual refresh.

---

## What Forge Is Not

- **Not a surveillance tool**
  It records only what is necessary for coordination and recognition.

- **Not a gamification platform**
  No points, XP, leaderboards, or extrinsic reward systems.

- **Not an LMS replacement**
  Forge does not manage assignments, submissions, grading, or curriculum sequencing.

- **Not a communication platform**
  No built-in chat or messaging. Existing tools already serve that role.

- **Not an evaluative assessment system**
  Forge provides operational visibility without scoring, ranking, or achievement comparison.

---

## V1 Scope Summary

Forge V1 delivers the minimum operational capabilities needed to run a makerspace classroom smoothly.

### V1 Capabilities (In Priority Order)

| Phase | Capability            | Purpose                                          |
| ----- | --------------------- | ------------------------------------------------ |
| 1     | Identity & Auth       | Know who people are; enable login                |
| 1     | Sessions              | Bound classroom time periods (presence and help) |
| 2     | Presence              | Know who is here right now                       |
| 2     | Smartboard (Presence) | Shared visibility into who's here                |
| 3     | Help Queue            | Route help efficiently via ninjas                |
| 3     | Smartboard (Help)     | Public help queue display                        |
| 4     | Projects & Handoffs   | Enable multi-session physical work               |
| 4     | Smartboard (Projects) | Project status visibility                        |
| 5     | Chores                | Share responsibility for the space               |
| 5     | Smartboard (Chores)   | Chore board visibility                           |
| 6     | Teacher Dashboard     | Central attention management                     |
| 6     | Student Home          | Clear starting point each session                |

### V1 Constraints

- **No photo capture**: Handoffs and chore verification are text-only in V1
- **No volunteers**: Volunteer accounts and permissions are V2
- **No progress tracking**: Mastery, achievement, and skill tracking are V2
- **Single-school identity**: A Person belongs to exactly one School

### Explicitly Excluded from V1

- Photo/image upload (handoffs, chores, evidence)
- Volunteer accounts and coordination
- Progress signals and skill tracking
- Parent-facing views
- Administrator dashboards
- Integrated chat or comments
- Formal grading or reporting
- SEL check-in workflows
- Cross-school identity

---

## Smartboard Mode (V1)

Smartboard views are **read-only**, public, and unauthenticated.

They provide shared visibility into:

- Presence
- Help queue
- Project status
- Chores

Smartboard views are designed as **derived read models** with no sensitive data.

**Privacy in public display:** Smartboard shows operational information (who is here, who needs help, what projects exist) without evaluative content. Wait times and freshness colors are operational signals that incidentally reveal activity levels, but they do not score or rank students.

The system architecture explicitly anticipates a future **editable Smartboard mode** (V2+), where the board becomes a shared focal point for discussion and real-time updates—but V1 does not include interactive controls.

---

## V2 and Beyond

Features explicitly deferred to V2+:

| Feature                      | Rationale for Deferral                                                    |
| ---------------------------- | ------------------------------------------------------------------------- |
| Photo capture                | Device compatibility complexity; text-only handoffs prove the model first |
| Volunteer accounts           | Permission model needs V1 learnings; adds auth complexity                 |
| Progress signals             | Risk of LMS creep; focus on operational features first                    |
| Interactive Smartboard       | Read-only proves the concept; interaction adds complexity                 |
| Parent dashboards            | Privacy implications; V1 is teacher/student only                          |
| Offline mode                 | Requires significant architecture changes                                 |
| Cross-school identity        | Single-school model is simpler; multi-school is V2+                       |
| CorrectiveActionTaken events | Formal teacher intervention tracking beyond byTeacher flag                |

---

## Success Looks Like

**For teachers**

- "I know what's happening without asking."
- "Students get help faster than when I was the only helper."
- "Project handoffs actually work."
- "I spend less time managing and more time teaching."

**For students**

- "I know what I should be working on."
- "I can get help without waiting forever."
- "I can see what my team did before I arrived."
- "I feel like I belong here."

**For the classroom**

- Fewer stalled projects
- Shared responsibility is visible
- Expertise is distributed
- The space feels calm, organized, and purposeful

---

## Constraints

### Privacy & Safety

Forge V1 intentionally collects a limited set of PII:

- Name (including preferred name)
- Pronouns (optional)
- School email (authentication only)

Forge does **not** collect:

- Photos or images (V1)
- Behavioral analytics
- Time-on-task metrics
- Location tracking
- Comparative performance scores

**Privacy principle:** Forge allows operational visibility, even when it incidentally reveals effort, but avoids evaluative scoring, ranking, or achievement-based comparison.

Visibility is role- and context-dependent (e.g., Smartboard vs authenticated views).

### Technical

- Event-sourced architecture with projection-based read models
- Web app (responsive)
- Real-time where specified (≤ 2 second propagation)
- Google OAuth + PIN authentication
- No offline mode in V1

### Operational

- Single developer initially
- Must be useful on day one
- Iterative rollout based on real classroom use
- No monetization pressure in V1

---

## Non-Goals for V1 (Hard No's)

The following will not be added during V1, even if requested:

- Points, XP, badges, or leaderboards
- Built-in chat or messaging
- Automated behavior scoring
- Parent dashboards
- District or admin reporting
- Photo or image uploads
- Volunteer accounts
- Mastery or skill tracking
- Achievement comparisons

Requests in these areas are signals for future exploration, not backlog items.

---

## Key Decisions Made

1. **Event-sourced system design**
   Domain events are the sole source of truth. All state is derived via projections that can be regenerated from events.

2. **Sessions are time containers only**
   Sessions scope presence and help, not projects or chores.

3. **Operational visibility without evaluation**
   Freshness signals and wait times support coordination without scoring or ranking students.

4. **Teacher interventions are explicit**
   Teacher actions include `byTeacher: true` in event payloads. Corrections are additive, not overwrites.

5. **Single-school identity in V1**
   A Person belongs to exactly one School.

6. **Smartboard read-only in V1**
   Editable Smartboard is explicitly scoped for later.

7. **No photo capture in V1**
   Text-only handoffs and verification prove the workflow before adding media complexity.

8. **No volunteers in V1**
   Focus on teacher-student dynamics first.

9. **No progress signals in V1**
   Avoid LMS creep; operational features take priority.

10. **No admin or district users in V1**

11. **Build fresh**
    Existing tools do not fit K–12 makerspace needs.

12. **Multi-tenant from day one**

13. **Supabase + Postgres + real-time**

14. **No integrated chat**

15. **No payments or billing**

---

## Core Invariants

These invariants are non-negotiable rules that shape the entire system. All documents in this specification adhere to them.

### INV-1: Session Scope

> **"Session is both a boundary and a unit of recency, but never a unit of evaluation."**

Sessions bound presence and help requests. They provide temporal context for operational freshness signals. But sessions never serve as units of grading, scoring, or comparative evaluation. A student's work is not judged by session; sessions are purely organizational.

### INV-2: Null Category Semantics

> **"Null category ≠ unknown; it means 'general broadcast'."**

When a help request has `category_id = null`, this is not an error or missing data. It is a deliberate semantic: the request is visible to all ninjas regardless of domain. Null category is a first-class value meaning "broadcast to everyone who can help."

### INV-3: Visibility Without Evaluation

Forge displays operational information (who is here, who needs help, what's stale) without evaluating or ranking students. Visibility serves coordination; it does not produce scores, comparisons, or judgments.

### INV-4: Interventions Are Explicit

When teachers act on behalf of students, those actions are labeled (`byTeacher: true`) and recorded as separate events. Teacher corrections supplement the record; they never overwrite or erase student events.

---

## Cross-Document Glossary

The following terms have precise meanings across all Forge specification documents. Refer to this glossary when these terms appear.

### Session

A **session** is a time-bounded classroom period (e.g., one class meeting). Sessions are purely temporal boundaries.

- **Sessions bound:** Presence (sign-in/sign-out), help requests
- **Sessions do NOT bound:** Projects, status updates, chores, chore instances

The `session_id` field on some entities (StatusUpdate, ChoreInstance) is **informational only**—it records when something happened but does not constrain visibility or lifecycle.

See **INV-1** above.

### Operational Freshness

**Operational freshness** is time-since-last-activity, used for classroom coordination. It answers questions like "Who might need a check-in?" or "Which projects haven't been touched lately?"

Freshness signals include:

- Inactivity flags (student present but no recent activity)
- Project freshness colors (time since last status update)
- Help queue wait times

**These are not progress indicators.** A "stale" project may be intentionally paused. Freshness prompts teacher awareness, not judgment.

### Intervention

An **intervention** is a teacher action performed on behalf of a student. All interventions:

- Include `byTeacher: true` in the event payload
- Are recorded as new events (not modifications)
- Preserve the original student events unchanged

V2 may introduce formal `CorrectiveActionTaken` events for structured intervention tracking.

### Visibility vs. Evaluation

**Visibility** is showing information for coordination purposes. **Evaluation** is scoring, ranking, or judging.

Forge provides visibility without evaluation:

- ✅ Showing who is present (visibility for coordination)
- ❌ Ranking students by attendance (evaluation)
- ✅ Showing project freshness colors (visibility for coordination)
- ❌ Scoring projects by activity level (evaluation)

This distinction is captured in the privacy principle: _"Forge allows operational visibility, even when it incidentally reveals effort, but avoids evaluative scoring, ranking, or achievement-based comparison."_
