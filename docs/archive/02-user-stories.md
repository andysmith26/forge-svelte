# Forge — User Stories (V1)

This document contains the 36 user stories for Forge V1, organized by implementation phase.

For term definitions and invariants, see the **Cross-Document Glossary** and **Core Invariants** in `01-vision-and-scope.md`.

---

## 0. Cross-Cutting Concepts

### 0.1 Event-Sourced Architecture

Forge is an **event-sourced system**. All mutations occur via append-only domain events.

**Domain events** are the primary source of truth—immutable records of meaningful actions. UI surfaces display **projections**—derived state computed from those events.

Projections are read models that can be rebuilt at any time by replaying events from the DomainEvent table. This architecture ensures:

- Complete audit trail
- No data loss from projection bugs
- Ability to add new projections retroactively

### 0.2 Projections (Read Models)

The following tables are projections, not sources of truth:

| Projection         | Purpose                | Regenerated From         |
| ------------------ | ---------------------- | ------------------------ |
| SignIn             | Current presence state | Presence events          |
| HelpRequest        | Help queue state       | Help events              |
| Project, Subsystem | Project structure      | Project events           |
| StatusUpdate       | Handoff content        | `ProjectUpdateSubmitted` |
| ChoreInstance      | Chore task state       | Chore events             |
| NinjaAssignment    | Ninja status           | Ninja events             |

### 0.3 Sessions as Time Containers

Sessions are **purely temporal boundaries** that scope presence and help requests.

**Sessions bound:**

- Presence (sign-in/sign-out)
- Help requests (created during active session)

**Sessions do NOT bound:**

- Project definitions and membership (persist across sessions)
- Project status updates (`session_id` is informational only)
- Chore definitions (persist across sessions)
- Chore instances (`session_id` is optional and informational)

### 0.4 Activity

An "activity" is any event showing engagement:

- Sign-in, sign-out
- Help request actions
- Chore actions
- Project updates

### 0.5 Real-Time Definition

**Real-time** means changes propagate to all connected clients within **2 seconds** under normal network conditions.

Real-time is guaranteed for:

| View                   | Guarantee   |
| ---------------------- | ----------- |
| Presence board         | ≤ 2 seconds |
| Help queue (all views) | ≤ 2 seconds |
| Smartboard displays    | ≤ 2 seconds |

Everything else updates on navigation or pull-to-refresh.

### 0.6 Operational Freshness vs. Progress Tracking

Forge tracks **operational freshness**—time since last activity—to support classroom coordination. It does **not** track mastery, achievement, or skill progress in V1.

**Operational signals:**

- Inactivity flags (student present but no recent activity)
- Project freshness colors (time since last status update)
- Help queue wait times

These are coordination aids, not evaluations. A "stale" project may be intentionally paused.

### 0.7 Privacy Principle

Forge allows operational visibility, even when it incidentally reveals effort, but avoids evaluative scoring, ranking, or achievement-based comparison.

Smartboard displays show operational information (presence, wait times, freshness) without evaluative content.

### 0.8 Teacher Interventions

Teacher interventions are explicit and labeled. When teachers act on behalf of students:

- Event payloads include `byTeacher: true`
- Original student events are preserved unchanged
- Corrections are additive (new events), not modifications

### 0.9 V1 Constraints

The following are explicitly **not** in V1:

- Photo/image capture or upload
- Profile photos or avatars
- Volunteer accounts
- Progress signals and skill tracking
- Cross-school identity (a Person belongs to exactly one School)

Stories affected by these constraints are noted inline.

---

## Phase 1: Foundation (Identity, Auth, Sessions)

Phase 1 establishes who can use the system and how classroom time is bounded. Nothing else works without this foundation.

**Dependencies:** None
**Enables:** All subsequent phases

---

### 1.1 Account Creation (Teacher)

**Story**
As a teacher, I want to create student accounts so they can use the system.

**Acceptance Criteria**

- Teacher can add students individually (name, email, grade).
- Teacher can bulk-import via CSV.
- Duplicate emails are rejected with a clear error.
- Students appear immediately in the class roster.
- A Person belongs to exactly one School (no cross-school identity in V1).

**Edge Cases**

- Student has no email → option to generate placeholder or use parent email.
- Student in multiple classrooms (within same school) → supported.
- Typos in email require editing after import.

**Produces Events**

- `PersonCreated`
- `ClassroomMembershipCreated`

---

### 1.2 Google OAuth Login

**Story**
As a student, I want to log in with my school Google account so I don't need a separate password.

**Acceptance Criteria**

- Google OAuth button present on login page.
- First login matched to a Person record via email (globally unique).
- If no match, clear message: "Ask your teacher to add you."
- Successful login takes student to their Home screen.

**Edge Cases**

- Using personal Gmail instead of school email → no match, clear error.
- School email mismatch with teacher-entered email → no match.
- OAuth failure (network / Google outage) → clear error with retry option.

**Produces Events**

- `UserAuthenticated`

---

### 1.3 PIN Login (Shared Devices)

**Story**
As a student, I want to log in with a PIN on shared tablets so I don't need to type my Google password.

**Acceptance Criteria**

- PIN login option available alongside OAuth.
- PIN is 4–6 digits; system generates or teacher assigns.
- PIN + classroom code uniquely identifies student.
- Auto-logout after 30 minutes of inactivity.
- Maximum PIN session length is 4 hours, even with activity.
- Session ends on browser close.

**Edge Cases**

- Student forgets PIN → teacher can view/reset in roster.
- Duplicate PINs prevented within same classroom.
- Shared tablet left logged in → auto-logout handles this.

**Produces Events**

- `UserAuthenticated`
- `UserAutoLoggedOut` (when inactivity triggers logout)

---

### 1.4 Profile: Name + Pronouns

**Story**
As a student, I want to set my preferred name and pronouns so people address me correctly.

**Acceptance Criteria**

- Editable fields for display name and pronouns.
- Pronouns are free-text (no predefined list).
- Legal name stored separately, visible only to teacher.
- Updated values propagate system-wide on next page load.

**Edge Cases**

- Pronouns left blank → display nothing, do not default.
- Frequent name changes → allowed, no restrictions.
- Display name same as legal name → allowed.

**Produces Events**

- `ProfileUpdated`

---

### 1.5 Profile: "Ask Me About"

**Story**
As a student, I want to list topics I can help with so peers know my expertise.

**Acceptance Criteria**

- Students can add/edit free-text tags (max 5).
- Tags visible on profile and in ninja/helper contexts.
- Not required; can be empty.

**Edge Cases**

- Inappropriate or joke topics → teacher can edit/remove if necessary.
- Many students with same tag → all appear in relevant searches.

**Produces Events**

- `ProfileUpdated`

---

### 1.6 Ninja Assignment (Teacher)

**Story**
As a teacher, I want to assign "ninja" status to students in specific skill domains so they can help peers.

**Acceptance Criteria**

- Teacher can tag a student as ninja in one or more defined domains.
- Domains are teacher-defined per classroom.
- Ninjas appear in help queue filters for their domains.
- Teacher can revoke ninja status at any time.

**Edge Cases**

- Student believes they should be ninja → teacher decides; no self-nomination.
- Student leaves class → ninja status removed automatically.
- Ninja in multiple domains → appears in all relevant filters.

**Produces Events**

- `NinjaAssigned`
- `NinjaRevoked`

**Projection Updated**

- NinjaAssignment

---

### 1.7 Create / Start Session

**Story**
As a teacher, I want to create and start a session so students can sign in.

**Acceptance Criteria**

- Create session with: name (optional), date, start time, end time.
- Only one active session per classroom at a time.
- "Start session now" quick action available.
- Starting a session enables student sign-in.
- Ending a session auto-signs-out all present students.
- Sessions are time containers: they bound presence and help, not projects or chores.

**Edge Cases**

- Teacher forgets to create session → can start ad-hoc.
- Back-to-back sessions → previous must end before new one starts.
- Session spans midnight → allowed but unusual.

**Produces Events**

- `SessionCreated`
- `SessionStarted`
- `SessionEnded`

---

## Phase 2: Presence

Phase 2 answers the core question: "Who is here right now?" This is the first real-time feature and the foundation for all operational awareness.

**Dependencies:** Phase 1 (Identity, Sessions)
**Enables:** Help Queue, Projects, Chores, Dashboards

---

### 2.1 Student Sign-In

**Story**
As a student, I want to sign in when I arrive so the teacher knows I'm here.

**Acceptance Criteria**

- Sign-in button available only when a session is active.
- Signed-in students appear immediately (≤ 2 sec) on presence board.
- Student cannot request help or claim chores unless signed in.
- Sign-in records timestamp.

**Edge Cases**

- Student signs in from home → allowed in V1 (honor system).
- Teacher manually signs in student → supported, recorded with `byTeacher: true`.
- Double sign-in attempt → ignored, student remains signed in.

**Produces Events**

- `StudentSignedIn`

**Projection Updated**

- SignIn

---

### 2.2 Student Sign-Out

**Story**
As a student, I want to sign out when I leave so my status is accurate.

**Acceptance Criteria**

- Sign-out button always visible when signed in.
- Prompts if student has unresolved help request (confirm or cancel request).
- Timestamp recorded.
- Student removed from presence board within 2 seconds.

**Edge Cases**

- Student leaves without signing out → auto sign-out at session end.
- Student signs out with claimed chore → chore returns to available pool.

**Produces Events**

- `StudentSignedOut`

**Projection Updated**

- SignIn

---

### 2.3 Teacher Sign-In/Out Other

**Story**
As a teacher, I want to sign students in or out so I can correct the presence board.

**Acceptance Criteria**

- Teacher can sign in any roster student.
- Teacher can sign out any present student.
- Both actions take effect immediately (≤ 2 sec).
- Teacher corrections are explicit: events include `byTeacher: true` in payload.
- Original student events (if any) are preserved unchanged.

**Edge Cases**

- Signing out student with active help request → request is cancelled (with `byTeacher: true`).
- Signing in student already signed in → no-op.

**Produces Events**

- `StudentSignedIn` (with `byTeacher: true`)
- `StudentSignedOut` (with `byTeacher: true`)

**Projection Updated**

- SignIn

---

### 2.4 Presence Board

**Story**
As a user, I want to see who is currently present so I know who's in the room.

**Acceptance Criteria**

- Shows: name, pronouns, sign-in time, ninja badge (if applicable).
- Real-time updates (≤ 2 sec).
- Sorted alphabetically by default; teacher can toggle to sign-in order.
- Count of present students displayed.
- Smartboard-friendly layout available.

**Edge Cases**

- Zero students present → friendly empty state ("No one signed in yet").
- 30+ students → scrollable, no pagination.

**Derived From (Projection)**

- SignIn (materialized from `StudentSignedIn`, `StudentSignedOut`, `SessionEnded`)

---

## Phase 3: Help Queue

Phase 3 enables peer-to-peer help through the ninja system. This directly addresses "Who needs help?" and distributes the support load beyond the teacher.

**Dependencies:** Phase 2 (Presence), 1.6 (Ninja Assignment)
**Enables:** Teacher Dashboard attention management

---

### 3.1 Request Help

**Story**
As a student, I want to request help when I'm stuck so someone can assist me.

**Acceptance Criteria**

- Must be signed in to request help.
- Required fields: category (from teacher-defined list), brief description of what's tried.
- Optional: urgency level (blocked / question / check work).
- One active request per student (can edit, not duplicate).
- Confirmation shows current queue position.
- Help requests are scoped to the active session.

**Edge Cases**

- Already have open request → prompt to edit instead of creating new.
- Category list empty → allow uncategorized request (category_id = null).
- **Rule (INV-2):** Uncategorized requests (null category) are visible to teacher and all ninjas. Null means "general broadcast," not missing data.

**Produces Events**

- `HelpRequested`
- `HelpRequestUpdated`

**Projection Updated**

- HelpRequest

---

### 3.2 Queue Position (Student View)

**Story**
As a student, I want to see my place in line so I know how long I might wait.

**Acceptance Criteria**

- Real-time position updates (≤ 2 sec).
- Shows who claimed the request (name only) once claimed.
- Shows "You're next" when position is 1.

**Edge Cases**

- Rapid queue movement → position updates smoothly.
- Helper unclaims → student notified, position recalculated.

**Derived From (Projection)**

- HelpRequest (materialized from help events)

---

### 3.3 Cancel Help Request

**Story**
As a student, I want to cancel my help request if I figure it out myself.

**Acceptance Criteria**

- Cancel button always visible on active request.
- Immediate removal from queue (≤ 2 sec).
- Optional: reason for cancellation (solved it / no longer needed / other).

**Edge Cases**

- Helper already claimed → helper notified of cancellation.
- Cancel during session end → processed before auto-signout.

**Produces Events**

- `HelpCancelled`

**Projection Updated**

- HelpRequest

---

### 3.4 View Help Queue (Teacher)

**Story**
As a teacher, I want to see all pending help requests so I can manage the room.

**Acceptance Criteria**

- Shows all requests sorted by: urgency (blocked first, then question, then check work), then wait time.
- Each entry shows: student name, category, wait time, "what I tried" (expandable).
- Real-time updates (≤ 2 sec).
- Teacher can claim, reassign, or resolve any request.
- Wait times are operational signals; they show who has been waiting longest, not a performance metric.

**Edge Cases**

- Zero requests → friendly empty state ("No one needs help right now").
- Many requests → scrollable list, no pagination.

**Derived From (Projection)**

- HelpRequest (all help-related events)

---

### 3.5 View Help Queue (Ninja)

**Story**
As a ninja, I want to see help requests in my domains so I can help my peers.

**Acceptance Criteria**

- Auto-filtered to show requests matching ninja's assigned domains.
- **Uncategorized requests (category_id = null) are visible to all ninjas** in addition to domain-matched requests.
- Same display format as teacher view.
- Ninja can claim requests in their domains or uncategorized requests.
- Real-time updates (≤ 2 sec).

**Edge Cases**

- Request spans multiple domains → visible to all relevant ninjas.
- Ninja with no matching requests → "No requests in your areas right now."

**Rule (INV-2): Null Category Semantics**

Null category is a first-class value meaning "general broadcast." When `category_id = null`:

- The request is visible to ALL ninjas regardless of domain assignment
- This is intentional semantics, not missing data
- Ensures no help request is orphaned

Teachers may optionally create a "General" category for explicit general requests, but the system must always handle null gracefully.

**Derived From (Projection)**

- HelpRequest (filtered by ninja domains + uncategorized)

---

### 3.6 Claim Help Request

**Story**
As a helper (teacher or ninja), I want to claim a request so the student knows help is coming.

**Acceptance Criteria**

- Claim button visible on unclaimed requests.
- First claim wins (optimistic UI with conflict resolution).
- Student sees "[Name] is coming to help" immediately (≤ 2 sec).
- Helper can unclaim if unable to help.

**Edge Cases**

- Two people claim simultaneously → first write wins, second sees "already claimed."
- Helper claims but doesn't arrive → teacher can reassign after X minutes (configurable).

**Produces Events**

- `HelpClaimed`
- `HelpUnclaimed`

**Projection Updated**

- HelpRequest

---

### 3.7 Resolve Help Request

**Story**
As a helper, I want to mark a request as resolved so the queue stays accurate.

**Acceptance Criteria**

- Resolve button visible on claimed requests.
- Optional: brief resolution note.
- Request archived with full history in DomainEvent table.
- Student's help status clears immediately.

**Edge Cases**

- Student still confused → they can submit a new request.
- Resolve without claiming first → auto-claims then resolves.

**Produces Events**

- `HelpResolved`

**Projection Updated**

- HelpRequest

---

### 3.8 Help Queue Smartboard View

**Story**
As a class, we want to see the help queue on the smartboard so everyone knows who needs help.

**Acceptance Criteria**

- Shows: student name, category, wait time.
- Does NOT show "what I tried" (privacy).
- Highlights requests waiting > 5 minutes (yellow) or > 10 minutes (red).
- Real-time updates (≤ 2 sec).
- Large, readable text.
- Wait time colors are operational freshness signals, not evaluations.

**Edge Cases**

- Empty queue → shows "No one waiting for help."
- Many requests → shows top 10 with "+N more" indicator.

**Derived View** (Real-time projection, public, no auth required)

---

## Phase 4: Projects & Handoffs

Phase 4 enables multi-session project work by making handoffs reliable. This answers "What are they working on?" and "What happened while I was gone?"

**Dependencies:** Phase 2 (Presence)
**V1 Constraint:** No photo capture; handoffs are text-only

---

### 4.1 Create Project (Teacher)

**Story**
As a teacher, I want to create projects and assign teams so students can collaborate.

**Acceptance Criteria**

- Create project with: name, description (optional).
- Define subsystems/components (optional, e.g., "Chassis", "Arm", "Code").
- Assign students to project (can be added/removed later).
- Projects visible only to assigned students and teacher.
- Projects persist across sessions (not session-scoped).

**Edge Cases**

- Large teams (10+) → supported but UI may need scrolling.
- Student removed from project → loses access, history preserved in events.
- Empty project (no students) → allowed for setup purposes.

**Produces Events**

- `ProjectCreated`
- `ProjectMembershipChanged`

**Projection Updated**

- Project, ProjectMembership, Subsystem

---

### 4.2 My Projects (Student)

**Story**
As a student, I want to see my current projects so I know what I'm working on.

**Acceptance Criteria**

- Shows all projects student is assigned to.
- Each project shows: name, last update time, unread indicator.
- Sorted by most recent activity.
- Tap to open project detail.
- Project list persists across sessions.

**Edge Cases**

- Student on many projects (5+) → all shown, scrollable.
- Student on zero projects → "You're not assigned to any projects yet."

**Derived From (Projection)**

- Project, ProjectMembership, StatusUpdate

---

### 4.3 Submit Handoff / Status Update

**Story**
As a student finishing work, I want to document what I did so the next person knows where to start.

**Acceptance Criteria**

- Text description of work completed (required, min 20 characters).
- Optional fields:
  - Subsystem(s) worked on (multi-select if defined)
  - Blockers encountered
  - What should happen next
  - Questions for teammates
- Update appears in project timeline immediately.
- `session_id` is recorded for informational purposes but does not restrict visibility or persistence.

**Edge Cases**

- Student worked on multiple subsystems → can select multiple.
- Very long update → character limit of 2000, with warning at 1800.
- Update while signed out → blocked; must be signed in.
- Updates persist indefinitely (not deleted when session ends).

**V1 Note:** Photo capture deferred to V2. Text-only handoffs for now.

**Produces Events**

- `ProjectUpdateSubmitted`

**Projection Updated**

- StatusUpdate

---

### 4.4 "What's New" (Student)

**Story**
As a student starting a session, I want to see what happened since my last update so I can continue effectively.

**Acceptance Criteria**

- Shows all updates since student's last contribution to this project.
- Highlights blockers and questions prominently.
- "Mark as read" action to dismiss (tracked per student).
- Badge on project card shows unread count.

**Edge Cases**

- First-time project member → show last 5 updates.
- No updates since last visit → "You're all caught up."
- Many updates → scrollable, most recent first.

**Derived From (Projection)**

- StatusUpdate, StatusUpdateView

---

### 4.5 Project Activity Feed (Teacher)

**Story**
As a teacher, I want to see all recent project activity so I can spot blockers and engagement patterns.

**Acceptance Criteria**

- Shows updates from all projects, most recent first.
- Filterable by: specific project, has blockers, time range.
- Each entry shows: student, project, subsystem, timestamp, blocker flag.
- Expandable to see full update text.
- Activity feed shows operational freshness (time since activity), not progress scores.

**Edge Cases**

- Many updates → paginated (20 per page).
- No updates today → "No project activity today."

**Derived From (Projection)**

- StatusUpdate (across all classroom projects)

---

### 4.6 Project Status Board (Smartboard)

**Story**
As a class, we want to see project status on the smartboard so everyone knows what's happening.

**Acceptance Criteria**

- Shows all active projects with: name, subsystems (if any), last update timestamp.
- Color-coded freshness (operational signals, not progress indicators):
  - Green: updated within 2 sessions
  - Yellow: updated 3–5 sessions ago
  - Red: no update in 5+ sessions
- Large, readable text.

**Privacy Note**

Freshness colors indicate time since last activity for coordination purposes. They do not evaluate quality or progress. A "red" project may be intentionally paused or awaiting resources.

**Edge Cases**

- Project with no updates → shows "Not started" in gray.
- Many projects → grid layout, scrolls if needed.

**Derived View** (Projection, public, no auth required)

---

## Phase 5: Chores

Phase 5 makes shared responsibility for the classroom space visible and accountable. This normalizes maintenance work and distributes it fairly.

**Dependencies:** Phase 2 (Presence)
**V1 Constraint:** No photo verification; chores use self or peer verification only

---

### 5.1 Define Chores (Teacher)

**Story**
As a teacher, I want to define classroom chores so students can help maintain the space.

**Acceptance Criteria**

- Create chore with: name, description, estimated time (S/M/L).
- Set recurrence: one-time, daily, weekly.
- Set verification type: self-verified, peer-verified, teacher-verified.
- Chores can be edited or archived (not deleted).
- Chore definitions persist across sessions (not session-scoped).

**Edge Cases**

- Chore requires special training → teacher can restrict who sees it (V2 feature, not V1).
- Many chores → organized by area or category.

**V1 Note:** Photo verification deferred to V2. Only self/peer/teacher verification available.

**Produces Events**

- `ChoreDefined`
- `ChoreUpdated`
- `ChoreArchived`

---

### 5.2 Browse Available Chores

**Story**
As a student, I want to browse chores I can do so I can contribute to the classroom.

**Acceptance Criteria**

- Shows all unclaimed, non-archived chores.
- Filter by: size (S/M/L), area (if defined).
- Each chore shows: name, description preview, estimated time, verification type.
- Claim button visible on each.
- Chore availability persists across sessions.

**Edge Cases**

- Zero available chores → "All chores are claimed or done. Check back later!"
- Student already has claimed chore → still can browse (no limit in V1).

**Derived From (Projection)**

- Chore, ChoreInstance

---

### 5.3 Claim Chore

**Story**
As a student, I want to claim a chore so others know I'm handling it.

**Acceptance Criteria**

- Claim button on available chores.
- Claimed chores removed from "available" pool immediately.
- Chore appears in student's "My Chores" list.
- Claim timestamp recorded.
- `session_id` on ChoreInstance is optional and informational.

**Edge Cases**

- Student claims many chores → allowed, but teacher can see and intervene.
- Two students claim same chore simultaneously → first wins, second sees "already claimed."

**Produces Events**

- `ChoreClaimed`

**Projection Updated**

- ChoreInstance

---

### 5.4 Complete Chore

**Story**
As a student, I want to mark a chore as complete so I get credit and it's off my list.

**Acceptance Criteria**

- "Mark complete" button on claimed chores.
- If self-verified → immediately marked complete.
- If peer-verified → moves to "needs verification" state.
- If teacher-verified → moves to "needs verification" state.
- Completion timestamp recorded.

**Edge Cases**

- Student marks complete but didn't actually do it → trust-based; teacher can revert.
- Complete while signed out → blocked; must be signed in.

**V1 Note:** Photo verification deferred to V2.

**Produces Events**

- `ChoreMarkedComplete`

**Projection Updated**

- ChoreInstance

---

### 5.5 Verify Chore (Peer or Teacher)

**Story**
As a verifier, I want to approve or reject completed chores so quality is maintained.

**Acceptance Criteria**

- Verifier sees list of chores awaiting their verification.
- Approve → status changes to "Verified," completer notified.
- Reject → status changes to "Redo required," feedback required, completer notified.
- Verifier cannot verify their own chore.
- Teacher verification events include `byTeacher: true`.

**Edge Cases**

- No one available to verify → teacher can always verify.
- Verification pending for a long time → highlighted in teacher view.

**Produces Events**

- `ChoreVerified`
- `ChoreRejected`

**Projection Updated**

- ChoreInstance, ChoreVerification

---

### 5.6 Redo Requested

**Story**
As a student, I want to see why my chore was rejected so I can fix it.

**Acceptance Criteria**

- Rejected chore shows in "My Chores" with "Redo required" status.
- Feedback from verifier visible.
- Student can re-complete (goes back to verification flow).

**Edge Cases**

- Multiple rejections → all feedback visible in history (full event trail in DomainEvent).
- Student disputes rejection → talk to teacher (no in-system dispute flow).

**Derived From (Projection)**

- ChoreInstance, ChoreVerification

---

### 5.7 Chore Board (Smartboard)

**Story**
As a class, we want to see the chore board on the smartboard so everyone knows what needs doing.

**Acceptance Criteria**

- Three columns: Available, In Progress, Recently Completed.
- In Progress shows who claimed each chore.
- Recently Completed shows who did it (last 24 hours).
- Large, readable text.
- Chore board is operational visibility—it shows classroom maintenance status, not individual performance scores.

**Edge Cases**

- Many chores in one column → shows top items with "+N more."
- All chores done → celebratory empty state ("Classroom is ship-shape!").

**Derived View** (Projection, public, no auth required)

---

## Phase 6: Dashboards & Home

Phase 6 brings everything together into coherent views for teachers and students. These are derived views that surface attention-worthy information from all other phases.

**Dependencies:** Phases 1–5
**Enables:** Full operational awareness

---

### 6.1 Teacher Dashboard

**Story**
As a teacher, I want a central view of everything needing attention so I can manage the room effectively.

**Acceptance Criteria**

- At-a-glance counts: students present, help requests pending, chores awaiting verification.
- Attention flags (operational freshness signals, not performance scores):
  - Students with no activity for 15+ minutes (configurable)
  - Help requests waiting 10+ minutes
  - Chore verifications pending 24+ hours
  - Projects with blockers
- Each flag links to relevant detail view.
- Refresh on navigation; manual refresh button.

**Edge Cases**

- Zero flags → "Everything looks good!"
- Many flags → prioritized list, most urgent first.

**Derived From (Projection)**

- All event streams via projections

---

### 6.2 Inactivity Flags

**Story**
As a teacher, I want soft alerts about student inactivity so I can check in with them.

**Acceptance Criteria**

- Highlight students present but with no activity for X minutes (default: 15).
- "Activity" includes: sign-in, help request, chore claim/complete, project update.
- Clicking flag shows student's last activity.
- Teacher can dismiss flag (snooze for this session).
- Flags are operational freshness signals, not evaluations. They prompt awareness, not judgment.

**Edge Cases**

- Student quietly reading or thinking → teacher uses judgment; flag is informational only.
- Student just signed in → grace period before flag possible (5 minutes).

**Derived From (Projection)**

- All student activity events via projections

---

### 6.3 Student Home

**Story**
As a student, I want a clear starting point each session so I know what to do.

**Acceptance Criteria**

- Shows:
  - Sign-in status (with sign-in/out button)
  - Active help request (if any) with queue position
  - Claimed chores (if any) with status
  - My projects with unread indicators
- Suggested actions when nothing is active:
  - "Pick a chore to help out"
  - "Check your project updates"

**Edge Cases**

- Student with no projects, no chores, not signed in → guide to get started.
- Everything active at once → prioritized display (help request first, then chores, then projects).

**Derived From (Projection)**

- SignIn, HelpRequest, ChoreInstance, StatusUpdate for this student

---

### 6.4 Smartboard View (Unified)

**Story**
As a class, we want a unified smartboard view so we have shared situational awareness.

**Acceptance Criteria**

- Configurable panels: Presence, Help Queue, Project Status, Chore Board.
- Teacher selects which panels to show (1–4).
- Each panel is the same as its standalone smartboard view.
- Auto-advances/cycles through panels if desired (configurable).
- Functions without login (accessed via classroom display code).
- All displayed information is operational (coordination-focused), not evaluative.

**Edge Cases**

- Smartboard left on overnight → safe, no sensitive data, no session required.
- Display code shared publicly → only shows public info anyway.

**Derived View** (Projections, public, no auth required, real-time where applicable)

---

## V2 Features (Not in Scope)

The following stories are explicitly deferred to V2:

### Volunteers (V2)

- Add volunteer accounts with limited access
- Volunteer can see presence, help queue, project status
- Volunteer cannot see private notes or progress data

### Progress Signals (V2)

- Define standards/skills
- Student self-progress tracking
- Request assessment workflow
- Class progress grid
- Evidence attachments (including photos)

### Photo Capture (V2)

- Photo capture for handoffs
- Photo verification for chores
- Photo evidence for progress

### Interactive Smartboard (V2)

- Touch interactions on smartboard
- Teacher can modify state from smartboard

### Cross-School Identity (V2)

- Person can belong to multiple schools
- Unified identity across schools

### CorrectiveActionTaken Events (V2)

- Formal teacher intervention events beyond `byTeacher` flag
- Structured corrective action records

---

## Story Summary

| Phase | Stories | Focus                                |
| ----- | ------- | ------------------------------------ |
| 1     | 1.1–1.7 | Foundation: Identity, Auth, Sessions |
| 2     | 2.1–2.4 | Presence: Who is here?               |
| 3     | 3.1–3.8 | Help Queue: Who needs help?          |
| 4     | 4.1–4.6 | Projects: What are they working on?  |
| 5     | 5.1–5.7 | Chores: Shared responsibility        |
| 6     | 6.1–6.4 | Dashboards: Attention management     |

**Total V1 Stories: 36**

---

## Dependency Graph

```
Phase 1: Foundation
    │
    ├── 1.1 Account Creation
    ├── 1.2 Google OAuth
    ├── 1.3 PIN Login
    ├── 1.4 Profile: Name/Pronouns
    ├── 1.5 Profile: Ask Me About
    ├── 1.6 Ninja Assignment ──────────────┐
    └── 1.7 Sessions                       │
            │                              │
            ▼                              │
Phase 2: Presence                          │
    │                                      │
    ├── 2.1 Sign-In                        │
    ├── 2.2 Sign-Out                       │
    ├── 2.3 Teacher Sign-In/Out            │
    └── 2.4 Presence Board                 │
            │                              │
            ├──────────────────────────────┤
            │                              │
            ▼                              ▼
Phase 3: Help Queue              (requires ninjas)
    │
    ├── 3.1–3.8 Help stories
    │
    ▼
Phase 4: Projects ◄──────────── (parallel with Phase 3)
    │
    ├── 4.1–4.6 Project stories
    │
    ▼
Phase 5: Chores ◄────────────── (parallel with Phase 4)
    │
    ├── 5.1–5.7 Chore stories
    │
    ▼
Phase 6: Dashboards
    │
    └── 6.1–6.4 Dashboard stories (aggregates all above)
```

Phases 3, 4, and 5 can be built in parallel after Phase 2 is complete. Phase 6 should come last as it aggregates data from all other phases.
