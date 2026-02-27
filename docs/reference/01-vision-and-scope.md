# Forge: Vision and Scope

## What Is Forge?

Forge is a classroom operating system for makerspace-style robotics education.

Children learn by building things. Not by receiving explanations, completing worksheets, or accumulating points — by constructing artifacts they care about and can show to someone else. This is the central claim of the constructionist tradition (Piaget, Papert, Stager), and it is the foundation Forge is built on.

But construction doesn't happen automatically. It requires an environment where students can sustain focus across sessions, get help without losing momentum, hand off physical work to teammates who weren't there yesterday, and know what needs doing without waiting for the teacher to tell them. These are logistics problems — but they are logistics in service of construction. Every operational feature in Forge exists because it removes a barrier to students making things.

Forge is the **situational awareness layer** for that environment — answering, at any moment:

- Who is here?
- What are they building?
- Who needs help?
- What's blocked?
- What needs attention right now?

Forge is not a gradebook, curriculum platform, or task manager. It is the connective tissue that makes a complex, student-centered classroom function without constant verbal coordination — so that students can spend their time constructing, not waiting.

---

## Learning Philosophy

Forge's design is grounded in the constructionist learning tradition of Piaget, Papert, and Stager. The full set of 15 learning principles is documented in [`PRINCIPLES_LEARNING.md`](../../PRINCIPLES_LEARNING.md). Those principles are constraints, not suggestions — if a feature violates them, it doesn't belong in Forge.

From those principles, four operating commitments guide every design decision:

### Students Are the Agents

The locus of control stays with the learner. Students do the thinking — they articulate what they're struggling with, hypothesize about what's wrong, declare their own expertise, and own their artifacts. When Forge asks a student for input, the purpose is to keep the cognitive work with the student, not to collect data for the system. _(Principles 2, 7, 13)_

### Logistics Serve Construction

Every operational feature — presence tracking, help queue, project handoffs, chore management — is justified only by how it enables students to build things. If a feature optimizes classroom management without supporting construction, it doesn't belong. Some logistics also create opportunities for meta-learning: students who triage help requests, maintain shared spaces, or declare expertise are constructing knowledge about how learning communities work. _(Principles 1, 4, 11)_

### Visibility Without Evaluation

Forge shows what's happening for coordination purposes — who is present, who needs help, which projects haven't been updated recently. It never scores, ranks, or compares students. Freshness signals and wait times are operational prompts for teacher awareness, not judgments. A project showing "stale" may be on planned pause. A student who hasn't signed in recently may have good reasons. The system provides information; adults interpret it through their knowledge of the child. _(Principles 9, 10, 15)_

### Adults Design Environments, Not Curricula

Teacher-facing features help adults observe what students are making and struggling with, curate challenges, and ask good questions. They do not monitor compliance, pace delivery, or reduce children to numbers. A teacher's session review shows a narrative of what happened — not time-on-task metrics or completion rates. The tool should reward a teacher's knowledge of individual students, not replace it. _(Principles 8, 9, 10)_

---

## The Problem

Makerspace classrooms face challenges that traditional classroom software ignores — and each of these challenges is, at root, a barrier to sustained construction:

1. **Extended construction requires session continuity**
   Students work on shared physical builds across multiple sessions. Deep learning requires extended, uninterrupted engagement — projects that unfold over days or weeks, not tasks that complete in minutes. Work must be handed off reliably between people who are never present at the same time, so that construction can continue without starting over. _(Principle 11)_

2. **Students construct at different speeds**
   Variable pacing is not a problem to solve — it's the natural consequence of children following their own questions. Whole-class instruction is often counterproductive when students are at different stages of different projects. The environment must support this diversity without forcing a single sequence. _(Principle 13)_

3. **Expertise is distributed and should be student-declared**
   Some students develop deep skill in specific tools or domains. That expertise should be visible and usable by peers — but it should be self-declared ("ask me about soldering"), not awarded from above as a badge. When students identify and share their own competence, they're constructing knowledge about their capabilities and about how communities share skill. _(Principles 2, 6)_

4. **Help must keep the cognitive work with the student**
   One adult cannot be everywhere. Students need timely help — but the help process itself is a learning opportunity. When a student articulates what they tried, hypothesizes about what's wrong, and explains the problem to a peer or teacher, they're debugging. Debugging is the pedagogy. The help system should facilitate this thinking, not bypass it. _(Principles 2, 7)_

5. **Shared responsibility for the learning space**
   The classroom itself requires upkeep. When students participate in maintaining shared spaces, they're constructing knowledge about how communities function — negotiating fairness, developing reliability, understanding collective ownership. This is real learning, not mere administration. _(Principle 8)_

6. **Blended goals without reductionism**
   Academic standards coexist with practical skills and community skills. Teachers must hold all of these simultaneously, in real time — without reducing any of them to a number on a dashboard. _(Principles 9, 15)_

Schools currently cobble together spreadsheets, LMS tools, paper sign-in sheets, and verbal coordination. It works — barely — at high cognitive cost to the teacher, and with no support for the construction that matters most.

---

## Who Is Forge For?

**Primary agents**
Students in makerspace and robotics classrooms, working independently and collaboratively to build things. They are the ones doing the learning; the system exists to support their agency.

**Primary facilitators**
Middle and high school robotics or makerspace teachers designing and running these environments.

**Future users (V2+)**

- Volunteers and community helpers supporting classroom work under teacher supervision
- Parents with limited visibility into what students are building

Forge V1 is explicitly **not** designed for administrators, districts, or system-level reporting.

---

## V1 Classroom Model

Forge V1 is designed for a specific classroom reality:

- One teacher
- 10–30 students per session
- One active session at a time
- Shared physical projects persisting across sessions
- School-managed devices (Chromebooks, laptops, tablets)
- A generally stable internet connection (no offline mode)

**Identity:** In V1, a Person belongs to exactly one School. Cross-school identity is not supported.

**Assumptions:**

- Students are physically present when signed in (honor system)
- The teacher is the final authority for resolving ambiguity

**Not supported in V1:**

- Fully asynchronous classes
- Remote or hybrid participation
- Multiple teachers co-running a session
- Cross-classroom or cross-school coordination
- Volunteer coordination (V2)

---

## V1 Scope

Forge V1 delivers the minimum operational capabilities needed to support construction in a makerspace classroom. Scope is prioritized by how directly each capability enables students to build things.

### V1 Capabilities (In Priority Order)

| Phase | Capability            | Why It Matters for Construction                    |
| ----- | --------------------- | -------------------------------------------------- |
| 1     | Identity & Auth       | Know who people are; enable login                  |
| 1     | Sessions              | Bound classroom time periods                       |
| 2     | Projects & Handoffs   | Students produce, document, and hand off artifacts |
| 2     | Smartboard (Projects) | Shared visibility into what's being built          |
| 3     | Presence              | Know who is here and available                     |
| 3     | Smartboard (Presence) | Shared visibility into who's working               |
| 4     | Help Queue            | Route help while keeping thinking with the student |
| 4     | Smartboard (Help)     | Public help queue display                          |
| 5     | Chores                | Share responsibility for the learning space        |
| 5     | Smartboard (Chores)   | Chore board visibility                             |
| 6     | Teacher Dashboard     | Narrative session review and attention management  |
| 6     | Student Home          | Clear starting point each session                  |

**Key scope changes from the original vision (informed by [learning principles evaluation](learning-principles-evaluation.md)):**

- **Projects elevated to Phase 2.** This is the most important gap in the original scope. Students need to produce and showcase artifacts — that's the core of constructionist learning. Projects are not a nice-to-have; they are the reason the rest of the system exists. _(Principle 4)_

- **Help request flow deepened.** The help form includes a "what do you think is happening?" hypothesis field alongside "what I tried." This keeps the diagnostic thinking with the student — debugging is the pedagogy. _(Principles 2, 7)_

- **Peer expertise reframed.** The ninja badge system is replaced by student-self-declared "ask me about" expertise. Students identify their own areas of competence rather than receiving a teacher-assigned status. This is meta-learning about community, not gamification. _(Principle 12)_

- **Help urgency made optional.** Pre-categorized urgency levels (blocked/question/check*work) are available but not required. Teachers should triage based on their knowledge of the child, not a software-assigned tag. *(Principles 2, 10)\_

- **Teacher session review designed as narrative.** The teacher dashboard shows what students worked on and what they struggled with — not average wait times, completion rates, or time-on-task metrics. _(Principle 9)_

### Module System

Forge is a modular classroom OS. **Modules** are the unit of capability that teachers enable or disable per classroom.

#### Philosophy

Not every classroom needs every feature on day one. A teacher starting with Forge should be able to begin with a clean, minimal experience — just Presence — and progressively enable capabilities as the class is ready. Modules are the mechanism for this controlled rollout. Disabled modules are invisible to students: no partial states, no "coming soon" badges, no cognitive overhead from features that aren't in use yet.

#### Progressive Rollout

A typical rollout might look like:

| Week | Module enabled | Why now                                                                                                    |
| ---- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| 1    | Presence       | Establish the rhythm of signing in. Students learn the tool exists.                                        |
| 2    | Profile        | Students customize how they appear — display name, pronouns, "ask me about" topics. Agency from the start. |
| 3    | Chores         | Establish shared responsibility for the learning space early.                                              |
| 4+   | Projects       | When multi-session builds begin, add project tracking and handoffs.                                        |
| 5+   | Help           | Introduce the help queue once students are building and need peer support.                                 |

The teacher controls this timeline entirely from the Settings page. There is no prescribed sequence — some classrooms may enable Help before Profile, or skip Chores altogether.

#### Core Modules (V1)

| Module   | Purpose                                                 |
| -------- | ------------------------------------------------------- |
| Presence | Track who is here during class sessions                 |
| Profile  | Students customize their identity and self-presentation |
| Help     | Peer help queue with ninja specializations              |
| Projects | Multi-session project tracking and handoffs             |
| Chores   | Classroom task management and shared responsibility     |

Core modules ship with Forge and are maintained by the core team. Each module declares its own routes, navigation items, and optional smartboard panels.

#### Community Modules (V2 Vision)

In V2, teachers or students will be able to build **add-on modules** that plug into the same system. Community modules would:

- Package as self-contained route groups with their own domain logic
- Register via a standard module definition interface
- Receive sandboxed data access — a per-classroom JSON data store, not direct access to core entities like Person or HelpRequest
- Require teacher approval to install in a classroom
- Adhere to Forge's constructionist principles — no gamification, no surveillance, no scoring

Examples might include: a materials inventory tracker, a peer review board, a tool certification checklist, or a custom display for a specific robotics competition.

Distribution would start as file-system-based (drop a folder in) and eventually move to a simple community registry.

### V1 Constraints

- **No photo capture:** Handoffs and chore verification are text-only in V1
- **No volunteers:** Volunteer accounts and permissions are V2
- **No progress tracking:** Mastery, achievement, and skill tracking are V2
- **Single-school identity:** A Person belongs to exactly one School

### Explicitly Excluded from V1

- Photo/image upload
- Volunteer accounts and coordination
- Progress signals and skill tracking
- Parent-facing views
- Administrator dashboards
- Integrated chat or comments
- Formal grading or reporting
- SEL check-in workflows
- Cross-school identity
- Student reflection/journal (V2 — construction activity, but projects come first)
- Interactive/student-controlled smartboard (V2 — valuable but adds complexity)

---

## Architecture

Forge is an **event-sourced system**. All state changes occur through append-only domain events. Current state is derived by replaying or projecting those events into read models.

**Why this matters:**

- **Complete audit trail.** Every action is recorded. Teacher interventions are labeled (`byTeacher: true`) and never overwrite student events.
- **No data loss.** Bugs in how we display data can be fixed without losing the underlying record. Projections can be rebuilt from events at any time.
- **Evolvable views.** New ways of looking at classroom data can be added retroactively by writing new projections over existing events.

**Sessions are time containers.** Sessions bound presence and help requests. They do not constrain project or chore persistence. Projects and chores live across sessions — because construction doesn't stop when the bell rings.

**Real-time where it matters.** Presence, help queue, and smartboard views update within 2 seconds. Everything else updates on navigation or refresh.

---

## What Forge Is Not

- **Not a curriculum delivery system.** Forge does not present content, enforce sequences, or determine what students should learn next. Sequence is the learner's job. _(Principle 13)_

- **Not a tool that does the thinking for students.** If the software is making the interesting decisions — choosing priorities, evaluating quality, auto-correcting errors — it has stolen the cognitive work that _is_ the learning. _(Principle 2)_

- **Not a surveillance tool.** It records only what is necessary for coordination and recognition. _(Principle 15)_

- **Not a gamification platform.** No points, XP, leaderboards, badges, or extrinsic reward systems. If the work isn't interesting enough without rewards, the work is wrong. _(Principle 12)_

- **Not an LMS replacement.** Forge does not manage assignments, submissions, grading, or curriculum sequencing.

- **Not a communication platform.** No built-in chat or messaging. Existing tools already serve that role.

- **Not a compliance dashboard.** No scores, completion rates, or time-on-task as primary indicators. Show teachers what kids made and what they struggled with. _(Principle 9)_

- **Not a digitization of what works on paper.** If a feature can be accomplished with a paper chart on the wall, it needs a stronger justification than convenience. Technology is justified when it gives students powers they cannot otherwise have. _(Principle 14)_

---

## Core Invariants

These invariants are non-negotiable. All documents in this specification adhere to them.

### INV-1: Construction Is the Purpose

> **"Every feature exists to support students building things."**

Operational features (presence, help, handoffs, chores) are justified by how they enable construction. If a feature optimizes management without supporting what students are making, it doesn't belong.

### INV-2: Session Scope

> **"Session is a boundary and a unit of recency, but never a unit of evaluation."**

Sessions bound presence and help requests. They provide temporal context for operational freshness. Sessions never serve as units of grading, scoring, or comparative evaluation.

### INV-3: Null Category Semantics

> **"Null category ≠ unknown; it means 'general broadcast'."**

When a help request has `category_id = null`, the request is visible to all available helpers regardless of domain. Null category is a first-class value meaning "broadcast to everyone who can help."

### INV-4: Visibility Without Evaluation

> **"Show what's happening; never score, rank, or compare."**

Forge displays operational information without evaluating students. Visibility serves coordination; it does not produce judgments.

### INV-5: Interventions Are Explicit

> **"Teacher actions supplement the record; they never overwrite it."**

When teachers act on behalf of students, those actions are labeled (`byTeacher: true`) and recorded as separate events. Teacher corrections are additive.

---

## Success Looks Like

**For students**

- "I made something I'm proud of."
- "I can show someone what I built."
- "I picked up right where I left off."
- "I figured out what was wrong by explaining it."
- "I got help without losing my train of thought."
- "I feel like I belong here."

**For teachers**

- "I know what students are building without asking."
- "I can see who's struggling and what they've tried."
- "Students get help faster than when I was the only helper."
- "Project handoffs actually work."
- "I spend less time managing and more time alongside students."

**For the classroom**

- Fewer stalled projects
- Shared responsibility is visible and student-owned
- Expertise is distributed and self-declared
- The space feels calm, organized, and purposeful
- Students are building things, not waiting for instructions

---

## V2 and Beyond

Features explicitly deferred to V2+:

| Feature                         | Rationale for Deferral                                                           |
| ------------------------------- | -------------------------------------------------------------------------------- |
| Photo capture                   | Device complexity; text-only handoffs prove the model first                      |
| Volunteer accounts              | Permission model needs V1 learnings                                              |
| Student reflection/journal      | Valuable construction activity, but projects come first                          |
| Student-controlled smartboard   | Read-only proves the concept; student control adds complexity                    |
| Project gallery / showcase view | Extends projects with public presentation; V1 establishes the foundation         |
| Parent dashboards               | Privacy implications; V1 is teacher/student only                                 |
| Offline mode                    | Requires significant architecture changes                                        |
| Cross-school identity           | Single-school model is simpler                                                   |
| Community/add-on module system  | Core module system must prove the model first; sandbox design needs V1 learnings |

---

## Key Decisions

1. **Constructionist philosophy as foundation.** Forge is built on Piaget/Papert/Stager. Every feature is evaluated against [`PRINCIPLES_LEARNING.md`](../../PRINCIPLES_LEARNING.md).

2. **Projects elevated to Phase 2.** Students producing artifacts is the core purpose, not an add-on.

3. **Event-sourced architecture.** Domain events are the sole source of truth. All state is derived via projections.

4. **Sessions are time containers only.** Sessions scope presence and help, not projects or chores.

5. **Visibility without evaluation.** Freshness signals and wait times support coordination without scoring or ranking.

6. **Teacher interventions are explicit.** Corrections are additive, labeled, and never overwrite student events.

7. **Help keeps thinking with the student.** The help flow requires students to articulate hypotheses, not just describe symptoms.

8. **Peer expertise is self-declared.** Students identify their own "ask me about" areas rather than receiving teacher-assigned badges.

9. **Teacher review is narrative, not metrics.** Show what students made and struggled with, not numbers.

10. **No gamification, ever.** No points, badges, streaks, or leaderboards.

11. **Multi-tenant from day one.**

12. **No integrated chat.**

13. **Technology must earn its place.** If paper works, don't digitize it.

---

## Privacy & Safety

Forge V1 collects a limited set of PII:

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

---

## Glossary

### Session

A time-bounded classroom period. Sessions bound presence and help requests. They do not bound projects, status updates, chores, or chore instances. The `session_id` field on some entities is informational — it records when something happened but does not constrain visibility or lifecycle.

### Operational Freshness

Time-since-last-activity, used for classroom coordination. Answers questions like "Who might need a check-in?" or "Which projects haven't been touched lately?" These are not progress indicators — freshness prompts teacher awareness, not judgment.

### Intervention

A teacher action performed on behalf of a student. Interventions include `byTeacher: true` in the event payload, are recorded as new events, and preserve original student events unchanged.

### Artifact

Something a student made — a program, a robot, a circuit, a design, a documented build. The tangible output of construction. Forge exists to support the creation, documentation, and handoff of artifacts.

### Construction

The act of building knowledge by making things. In Forge's context, this includes direct construction (building projects), logistics that enable construction (help flows, handoffs), and meta-construction (students participating in managing their learning community).
