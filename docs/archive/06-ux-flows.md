# Forge — UX Flows

This document defines V1 flows and notes V2-only extensions.

- No photo/image capture in V1
- No volunteer role in V1 (helpers in V1 = **student ninjas**)
- No progress tracking in V1
- API urgency model = `normal | urgent` (UI may use richer phrasing)

---

# 1. Global UX Principles

- Real-time updates for presence, help queue, and Smartboard views (≤ 2 seconds)
- Text-only status updates and verification in V1
- Ninjas are students with additional help-queue visibility and actions
- Smartboard is public, read-only

---

# 2. Session Flow

## 2.1 Teacher Starts a Session

1. Teacher selects a classroom
2. Teacher taps **Start Session**
3. System creates a new Session (temporal boundary)
4. Presence board and help queue reset for this session

## 2.2 Student Enters and Signs In

1. Student opens app → Home
2. System detects active session
3. Student taps **Sign In**
4. Presence board updates in real-time

## 2.3 Student Signs Out

1. Student taps **Sign Out**
2. Presence board updates
3. Session continues for others

---

# 3. Presence Board

## 3.1 What Students See

- List of who is currently present
- Their own presence status (“You’re here”)
- No email, no PII beyond display_name and pronouns

## 3.2 What Teachers See

- All present students
- Ninjas on duty
- Anyone signed in by teacher intervention (flagged `byTeacher`)

---

# 4. Help Queue UX

## 4.1 Student Creates Help Request

1. Student taps **Request Help**
2. UI asks:
   - **What’s the issue?** (description)
   - **What have you tried?** (required, min length enforced)
   - **Urgency**
     - UI labels: _Question_, _Check My Work_, _Blocked_
     - API maps to:
       - Question → `normal`
       - Check My Work → `normal`
       - Blocked → `urgent`
3. Student submits → request appears in queue

## 4.2 Student Views Own Request

- Can see: category, description, what-I-tried, status, who claimed it

## 4.3 Ninja View of Help Queue

- Sees requests for domains in which they are assigned
- Also sees requests with **uncategorized** category (`null`), as required by INV-2
- Cannot see requests for other domains
- Can claim/resolve only within allowed domains

## 4.4 Teacher View of Help Queue

- Sees all requests
- Can claim/unclaim/resolve
- Teacher actions include `byTeacher: true` in event payloads

---

# 5. Projects & Handoffs

## 5.1 Create Project (Teacher)

1. Teacher taps **New Project**
2. Provides Name and optional Description
3. Adds members
4. Creates default “Main” subsystem

## 5.2 Student Writes a Status Update (Text-Only in V1)

1. Student chooses project → subsystem
2. Student taps **Write Update**
3. UI fields:
   - What I Did
   - What’s Next
   - Blockers
   - Questions
4. Student submits → broadcast to members & smartboard

Text-only updates in V1.

---

# 6. Chores

## 6.1 View Available Chores

- Students see chore name, location, recurrence, and size
- No images in V1

## 6.2 Claim Chore

- Student taps **Claim**
- Immediately assigned to that student

## 6.3 Complete Chore

1. Student taps **Complete**
2. Provides (optional) notes
3. If verificationType = `peer`, another student can verify
4. If verificationType = `teacher`, teacher sees it in the verification queue

**V1 restriction:** Text-only verification.

---

# 7. Ninja UX

## 7.1 Becoming a Ninja

- Awarded by teacher
- Additive to role=student

## 7.2 Ninja Home View

- Shows which domain(s) they cover
- Shows help requests within those domains
- Shows uncategorized help requests
- Allows claim/unclaim/resolve for allowed domains

## 7.3 Limits

- Cannot see help requests outside domain except uncategorized
- Cannot perform teacher-level actions

---

# 8. Teacher Dashboard

## 8.1 Core Views

- Presence (real-time)
- Help queue (real-time)
- Project freshness indicators (operational, not progress)
- Chore status (available, claimed, pending verification)

## 8.2 Actions

- Intervene on sign-in/out
- Resolve help requests
- Verify chores
- Manage project membership

---

# 9. Smartboard (Public)

- Presence view
- Help queue view
- Project handoff board (text-only)
- Chore board
- Read-only; refreshed every ≤ 2 seconds
- No sensitive data

---

# 10. Student Home

Shows:

- Active session card
- Current project(s)
- Most recent status updates
- Chore availability
- Help request state (“You are waiting…”)
- No evaluative progress indicators

---

# 11. V2 Extensions

These flows are V2-only.

---

## V2-A: Photo Capture for Status Updates (Deferred)

1. Student taps **Write Update**
2. _(V2)_ Student can attach a photo (camera or upload)
3. Thumbnail displayed; teacher and team see inline
4. Stored in `forge-media/{schoolId}/{classroomId}/status-updates/{uuid}.jpg`
5. Supports multiple photos
6. Smartboard shows thumbnail variants

**Not available in V1:** No UI for photo actions; all status updates are text-only.

---

## V2-B: Photo Verification for Chores (Deferred)

1. Student taps **Complete Chore**
2. _(V2)_ Student attaches photo evidence
3. Photo displayed in verification queue
4. Teacher or peer verifies with image context
5. System stores images with EXIF stripped and generates thumbnails

**Not available in V1:** Text-only verification.

---

## V2-C: Volunteer (Adult) Helper Flow (Deferred)

1. Volunteer logs in with volunteer role
2. Sees limited queue view
3. Helps respond to non-technical student issues
4. Cannot see personal student data beyond request summary
5. Actions logged similarly to teacher interventions

**Not available in V1:** Only teachers and students exist.

---

## V2-D: Progress Tracking Flows (Deferred)

1. Student navigates to **Progress**
2. Views standards list and current status
3. Adds evidence (photos, text)
4. Teacher assesses via rubric
5. Class-wide grid view
6. Smartboard progress heat-map

**Not available in V1:** No progress router.

---

# End of Document
