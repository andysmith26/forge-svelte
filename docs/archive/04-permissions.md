# Forge Permissions

Who sees what, who can do what. Reference for implementing access control, privacy, and display behavior.

For term definitions, see the **Cross-Document Glossary** in `01-vision-and-scope.md`.

---

## Overview

This document is organized into three sections:

1. **Access Control** — Who can perform which actions on which resources
2. **Privacy Doctrine** — What information is protected and why
3. **Display Policy** — What appears on public displays (Smartboard)

---

## V1 Constraints

- **No volunteer role**: V1 supports only student and teacher roles
- **No progress tracking**: Progress-related permissions are V2
- **No photo data**: Photo capture is V2
- **Single-school identity**: A Person belongs to exactly one School

---

# Part 1: Access Control

This section defines who can perform which actions. Access control is role-based at the classroom level.

## Core Access Principles

1. **Default deny**: No access unless explicitly granted
2. **Role-based at classroom level**: Your role in _this_ classroom determines permissions here
3. **Data scoped to classroom**: You only see data from classrooms where you have membership
4. **Single-school identity**: In V1, a Person belongs to exactly one School
5. **Audit everything sensitive**: Access to student data is logged

## Roles

Two roles in V1, scoped to classroom membership:

| Role        | Who         | Primary Use                                 |
| ----------- | ----------- | ------------------------------------------- |
| **student** | Learners    | Do work, request help, complete chores      |
| **teacher** | Instructors | Manage classroom, see all data, verify work |

**Ninja** is an additive status to student—a ninja has all student permissions plus domain-specific help queue access (including access to uncategorized requests).

**Notes:**

- One person can have different roles in different classrooms (within same school)
- `teacher` is the superuser for a classroom (not system-wide)
- A Person belongs to exactly one School (cross-school identity is V2)

## Permission Matrix: Actions

What each role can **do**:

| Action                                     | Student  | Ninja                  | Teacher |
| ------------------------------------------ | -------- | ---------------------- | ------- |
| **Identity**                               |          |                        |         |
| Edit own profile                           | ✅       | ✅                     | ✅      |
| View others' public profile                | ✅       | ✅                     | ✅      |
| View others' email/legal_name              | ❌       | ❌                     | ✅      |
| Create/manage student accounts             | ❌       | ❌                     | ✅      |
| Assign ninja status                        | ❌       | ❌                     | ✅      |
| **Presence**                               |          |                        |         |
| Sign in/out self                           | ✅       | ✅                     | ✅      |
| Sign in/out others (explicit intervention) | ❌       | ❌                     | ✅      |
| View who's present                         | ✅       | ✅                     | ✅      |
| Create/manage sessions                     | ❌       | ❌                     | ✅      |
| **Projects**                               |          |                        |         |
| View own projects                          | ✅       | ✅                     | ✅      |
| View all classroom projects                | ❌       | ❌                     | ✅      |
| Create projects                            | ❌       | ❌                     | ✅      |
| Add/remove project members                 | ❌       | ❌                     | ✅      |
| Create status updates (own projects)       | ✅       | ✅                     | ✅      |
| View status updates (own projects)         | ✅       | ✅                     | ✅      |
| View all status updates                    | ❌       | ❌                     | ✅      |
| **Help Queue**                             |          |                        |         |
| Request help                               | ✅       | ✅                     | ✅      |
| View own request                           | ✅       | ✅                     | ✅      |
| View queue (summary)                       | ❌       | domain + uncategorized | ✅      |
| View "what I tried"                        | own only | if claimed             | ✅      |
| Claim help request                         | ❌       | domain + uncategorized | ✅      |
| Resolve help request                       | ❌       | if claimed             | ✅      |
| **Chores**                                 |          |                        |         |
| View available chores                      | ✅       | ✅                     | ✅      |
| Claim chore                                | ✅       | ✅                     | ✅      |
| Complete chore                             | ✅       | ✅                     | ✅      |
| Verify chores (peer)                       | ✅       | ✅                     | ✅      |
| Verify chores (teacher)                    | ❌       | ❌                     | ✅      |
| Create/manage chore definitions            | ❌       | ❌                     | ✅      |
| **Dashboard**                              |          |                        |         |
| View teacher dashboard                     | ❌       | ❌                     | ✅      |
| View smartboard displays                   | ✅       | ✅                     | ✅      |

## Permission Matrix: Data Visibility

What each role can **see**:

| Data                           | Student | Ninja                  | Teacher         |
| ------------------------------ | ------- | ---------------------- | --------------- |
| **Person**                     |         |                        |                 |
| Own full record                | ✅      | ✅                     | ✅              |
| Others' display_name, pronouns | ✅      | ✅                     | ✅              |
| Others' ask_me_about           | ✅      | ✅                     | ✅              |
| Others' email                  | ❌      | ❌                     | ✅              |
| Others' legal_name             | ❌      | ❌                     | ✅              |
| Others' grade_level            | ❌      | ❌                     | ✅              |
| Others' PIN                    | ❌      | ❌                     | ✅ (reset only) |
| **Help Request**               |         |                        |                 |
| Own request (full)             | ✅      | ✅                     | ✅              |
| Queue: name, category, wait    | ❌      | domain + uncategorized | ✅              |
| Queue: description             | ❌      | domain + uncategorized | ✅              |
| Queue: what_i_tried            | ❌      | if claimed             | ✅              |
| Smartboard queue               | ✅      | ✅                     | ✅              |
| **Status Update**              |         |                        |                 |
| Updates on own projects        | ✅      | ✅                     | ✅              |
| Updates on others' projects    | ❌      | ❌                     | ✅              |
| **Chore**                      |         |                        |                 |
| Available chores               | ✅      | ✅                     | ✅              |
| Who claimed what               | ✅      | ✅                     | ✅              |
| **Audit Log**                  |         |                        |                 |
| Any audit records              | ❌      | ❌                     | ✅              |

## Ninja Permissions: Detail

Ninjas are students with additional permissions in specific domains.

**What ninjas can see:**

- Help requests in their assigned domains (pending and claimed)
- **Uncategorized help requests (category_id = null)** regardless of domain assignment—see **INV-2** in glossary
- Full request details when they claim (including "what I tried")
- Who else is ninja in their domain

**What ninjas can do:**

- Claim help requests in their domains
- **Claim uncategorized help requests**
- Resolve help requests they've claimed
- All normal student actions

**What ninjas cannot do:**

- See help requests outside their domains (except uncategorized)
- Any teacher-level actions

**Domain filtering logic:**

- Ninja sees requests where `help_category.ninja_domain_id` matches their `ninja_assignment`
- **Plus all requests with `category_id = null` (uncategorized)**

**Rule (INV-2):** Null category is a first-class value meaning "broadcast to all ninjas." The system must handle `null` category_id as intentional, not as missing data.

## Teacher Interventions

**Invariant (INV-4): Teacher interventions are explicit and labeled.**

When a teacher performs an action on behalf of a student:

1. **Event payloads include `byTeacher: true`**
   - Distinguishes teacher corrections from student actions
   - Enables filtering in reports and audits
   - Preserves accountability

2. **Original student events are preserved unchanged**
   - Corrections are additive (new events), not modifications
   - The event log maintains complete history

3. **Teacher-initiated actions are recorded separately**
   - `SignIn.signed_in_by_id` ≠ `SignIn.person_id` indicates teacher sign-in
   - Help cancellations by teacher include `byTeacher: true`
   - Chore verifications by teacher include `byTeacher: true`

**Implementation**: When a teacher signs in/out a student, cancels their help request, or performs any action on their behalf, the corresponding event must include the `byTeacher: true` flag in its payload.

**V2 consideration**: `CorrectiveActionTaken` events for formal teacher intervention tracking beyond the `byTeacher` flag.

## Cross-Classroom Isolation

**Hard rule:** A person can only access data from classrooms where they have active membership.

**Identity scope (V1):** A Person belongs to exactly one School. Cross-school identity is V2.

**Enforcement:**

- Every query includes `classroom_id` filter
- API validates classroom membership before any data access
- No global search or cross-classroom views

**Multi-classroom scenario (within same school):**

- Teacher with two classrooms sees data from each separately
- Student in two classrooms sees own data in each
- No data bleed-through

## Permission Enforcement Layers

### Layer 1: Database

Row-level security (Postgres RLS) or enforced in queries.

### Layer 2: API

Every endpoint checks:

1. Is user authenticated?
2. Is user a member of this classroom?
3. Does user's role permit this action?
4. Does user have access to this specific record?

### Layer 3: UI

Hide/disable UI elements user can't use. (Defense in depth, not primary control.)

### API Response Codes

| Code             | Meaning                                     |
| ---------------- | ------------------------------------------- |
| 401 Unauthorized | Not logged in                               |
| 403 Forbidden    | Logged in but not permitted                 |
| 404 Not Found    | Resource doesn't exist OR user can't see it |

**Security note:** Use 404 (not 403) when user shouldn't know if resource exists.

## Permission Check Patterns

### Generic Pattern

```typescript
async function checkPermission(user, action, resource) {
  // 1. Get user's membership in resource's classroom
  const membership = await getMembership(user.id, resource.classroomId);
  if (!membership?.isActive) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }

  // 2. Check role-based permission
  if (!ROLE_PERMISSIONS[membership.role].includes(action)) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  // 3. Check resource-specific rules
  if (!(await resourceAccessAllowed(user, action, resource, membership))) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  // 4. Log if sensitive
  if (SENSITIVE_ACTIONS.includes(action)) {
    await auditLog(user, action, resource);
  }

  return true;
}
```

### Example: View "What I Tried"

```typescript
function canViewWhatITried(user, helpRequest, membership) {
  // Requester can always see their own
  if (helpRequest.requesterId === user.id) {
    return true;
  }

  // Teacher can see all
  if (membership.role === 'teacher') {
    return true;
  }

  // Claimant can see if they claimed it
  if (helpRequest.claimedById === user.id) {
    return true;
  }

  return false;
}
```

### Example: Create Status Update

```typescript
async function canCreateStatusUpdate(user, subsystem, membership) {
  const project = await getProject(subsystem.projectId);

  // Teacher can update any project
  if (membership.role === 'teacher') {
    return true;
  }

  // Student must be on the project
  if (membership.role === 'student') {
    const projectMembership = await getProjectMembership(user.id, project.id);
    return projectMembership?.isActive ?? false;
  }

  return false;
}
```

### Example: Ninja Queue Filtering (with Uncategorized)

```typescript
async function getHelpQueueForNinja(user, classroomId) {
  // Get ninja's domains
  const assignments = await getNinjaAssignments(user.id);
  const domainIds = assignments.map((a) => a.ninjaDomainId);

  // Get categories linked to those domains
  const categories = await getHelpCategoriesByDomains(classroomId, domainIds);
  const categoryIds = categories.map((c) => c.id);

  // Return requests in those categories OR uncategorized (null)
  // RULE (INV-2): Null category = broadcast to all ninjas
  return await getHelpRequests({
    classroomId,
    status: 'pending',
    OR: [
      { categoryId: { in: categoryIds } },
      { categoryId: null } // Null is first-class, not missing data
    ]
  });
}
```

### Example: Teacher Intervention Sign-In

```typescript
async function teacherSignInStudent(teacher, student, session) {
  // Verify teacher role
  const membership = await getMembership(teacher.id, session.classroomId);
  if (membership.role !== 'teacher') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  // Create event with byTeacher flag (INV-4)
  await createDomainEvent({
    event_type: 'StudentSignedIn',
    entity_type: 'SignIn',
    entity_id: generateId(),
    actor_id: teacher.id,
    payload: {
      person_id: student.id,
      session_id: session.id,
      byTeacher: true // Explicit teacher intervention flag
    }
  });

  // Update SignIn projection
  await upsertSignIn({
    session_id: session.id,
    person_id: student.id,
    signed_in_at: new Date(),
    signed_in_by_id: teacher.id // Records who performed the action
  });
}
```

## Access Control Edge Cases

### Student Leaves Mid-Year

- Membership set to `is_active = false`
- Historical data preserved (via DomainEvent)
- No longer appears in active views
- Teacher can still see historical data

### Student in Multiple Classrooms (Same School)

- Projects are classroom-specific
- No cross-classroom aggregation
- Person record shared across classrooms

### Substitute Teacher

- Add as teacher role temporarily
- Remove when done
- Audit log captures their actions (including `byTeacher` flags)

### Unauthorized Access Attempts

- Return 404 (not 403) to avoid leaking existence
- Log the attempt for review
- Pattern of attempts may indicate issue

---

# Part 2: Privacy Doctrine

This section defines what information is protected and the principles guiding those protections.

## Core Privacy Principle

> **Forge allows operational visibility, even when it incidentally reveals effort, but avoids evaluative scoring, ranking, or achievement-based comparison.**

This principle—**INV-3: Visibility Without Evaluation**—guides all privacy decisions.

## What This Means

| Visible (Operational)               | Not Visible (Evaluative)              |
| ----------------------------------- | ------------------------------------- |
| Who is present (coordination)       | Comparative attendance scores         |
| Help queue wait times (operational) | "Who asks for help most" rankings     |
| Project freshness (coordination)    | Progress scores or achievement levels |
| Chore completion (accountability)   | Comparative contribution rankings     |

Operational signals (presence, wait times, freshness colors) support classroom coordination. They incidentally reveal activity levels but do not evaluate, score, or rank students.

## Student Privacy Protections

**Principle:** Minimize exposure of struggles, failures, and personal details.

### What's Protected

| Data                          | Classification | Who Can Access            |
| ----------------------------- | -------------- | ------------------------- |
| "What I tried"                | Sensitive      | Self, claimant, teacher   |
| Blockers/questions in updates | Moderate       | Project members, teacher  |
| Audit logs                    | Sensitive      | Teacher only              |
| Email, legal_name             | PII            | Teacher only              |
| PIN                           | Secret         | Hashed; teacher can reset |

### Audit Logging for Sensitive Access

- Log when teacher views student data
- Log when anyone views "what I tried"

## Freshness Signals Are Not Judgments

**Invariant (INV-1):** Session is both a boundary and a unit of recency, but never a unit of evaluation.

Freshness signals (project colors, inactivity flags) are operational aids:

- A "yellow" project is not failing—it may be on planned pause
- An inactivity flag prompts a check-in, not a judgment
- Wait times show who needs help next, not who is "needy"

Teachers interpret these signals with context. The system provides data; it does not evaluate.

## Help Request Privacy

The "what I tried" field is sensitive because it reveals student struggle:

- **Visible to:** Self, teacher, ninja who claimed
- **Not visible to:** Other students, Smartboard, unclaimed ninjas
- **Never shown on public displays**

This protects students from peer judgment while enabling effective help.

---

# Part 3: Display Policy

This section defines what appears on Smartboard and other public displays.

## Smartboard Overview

Smartboard is a **public, read-only display** for classroom visibility. It operates separately from authenticated user views.

**Access method:**

- URL with classroom display code: `forge.app/display/ABC123`
- No login required
- Read-only, auto-refreshing

## What Smartboard Shows

Smartboard displays **operational information only**:

| Panel          | Shows                         | Does NOT Show                |
| -------------- | ----------------------------- | ---------------------------- |
| Presence       | Names, ninja badges           | -                            |
| Help Queue     | Names, categories, wait times | "What I tried", descriptions |
| Project Status | Names, status, last update    | Blocker details, questions   |
| Chore Board    | Available, claimed, completed | -                            |

## What Smartboard Never Shows

- "What I tried" on help requests
- Blocker/question details from status updates
- Any teacher dashboard content
- Any sensitive student information
- Evaluative scores or rankings

## Privacy on Public Display

**Principle:** Smartboard displays operational information that incidentally reveals activity (wait times, freshness) but does not evaluate or compare students.

This aligns with **INV-3**: visibility without evaluation.

Examples:

- ✅ Help queue shows wait times (operational)
- ❌ Help queue does not show "longest waiter this week" (evaluative)
- ✅ Project board shows freshness colors (operational)
- ❌ Project board does not show "most active team" (evaluative)

## Why Smartboard Is Separate from Teacher Login

**Security rationale:**

- Teacher logged in on smartboard = risk of sensitive data visible publicly
- Smartboard is physically public, must only show public-safe data
- Simpler threat model

**Implementation:** Smartboard uses display codes, not user sessions.

## Uncategorized Requests on Smartboard

Per **INV-2**, null category means "general broadcast." On Smartboard:

- Uncategorized help requests appear in the queue
- They show name, "Uncategorized" label, and wait time
- They do NOT show "what I tried"

---

# V2 Permission Additions

## Volunteer Role (V2)

New role: `volunteer`

**What volunteers can see:**

- Who's present (names)
- Help queue (names, categories, wait times—not "what I tried" until claimed)
- Project status (high-level, for context)
- Chore board (to understand room activity)

**What volunteers can do:**

- Sign in/out themselves
- Claim and resolve help requests
- Verify chores requiring teacher verification

**What volunteers cannot do:**

- See detailed struggles ("what I tried" unless they claimed)
- Create or modify any classroom content
- Request help
- Claim or complete chores

## Progress Tracking (V2)

| Data                | Student | Ninja | Volunteer | Teacher |
| ------------------- | ------- | ----- | --------- | ------- |
| Own progress        | ✅      | ✅    | ❌        | ✅      |
| Others' progress    | ❌      | ❌    | ❌        | ✅      |
| Class progress grid | ❌      | ❌    | ❌        | ✅      |

| Action                                | Student | Ninja | Volunteer | Teacher |
| ------------------------------------- | ------- | ----- | --------- | ------- |
| View own progress                     | ✅      | ✅    | ❌        | ✅      |
| Update own status (except proficient) | ✅      | ✅    | ❌        | ✅      |
| Add evidence to own progress          | ✅      | ✅    | ❌        | ✅      |
| View others' progress                 | ❌      | ❌    | ❌        | ✅      |
| Mark student proficient               | ❌      | ❌    | ❌        | ✅      |
| Create/manage standards               | ❌      | ❌    | ❌        | ✅      |

## Parent View (V2)

- New role: `parent`
- Can only see their linked child's curated data
- Teacher approves what's visible
- No access to other students

## Cross-School Identity (V2)

- Person can belong to multiple schools
- Permissions remain scoped to classroom within each school
- No cross-school data aggregation

## CorrectiveActionTaken Events (V2)

- Formal teacher intervention records beyond `byTeacher` flag
- Structured corrective action tracking
- May include intervention reason, follow-up notes
