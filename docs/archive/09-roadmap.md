# Forge — Roadmap

# 1. Roadmap Philosophy

Forge ships in phases that follow real classroom utility:

1. Start with operational foundations
2. Add collaboration scaffolding
3. Add distributed responsibility (chores)
4. Add situational awareness (teacher dashboard)
5. Only then consider extensions like photos, volunteers, progress, parents

V1 aims for _minimum viable classroom operation_ with an event-sourced backbone.

---

# 2. Phase Structure for V1

## **Phase 1 — Identity & Authentication**

- Student login (PIN + Google OAuth)
- Teacher login
- Single-school identity
- Classroom membership management

## **Phase 2 — Sessions & Presence**

- Start/end session
- Student sign-in/out
- Presence board (real-time)
- Smartboard presence view

## **Phase 3 — Help Queue**

- Students create help requests (text only)
- Ninjas (students with domain assignments) see domain-specific requests
- Unassigned (null-category) requests visible to all ninjas (INV-2)
- Teacher can see full queue
- Real-time updates across all views
- API urgency model: `normal | urgent`
  - UI maps _Blocked → urgent_
  - UI maps _Question/Check My Work → normal_

## **Phase 4 — Projects & Handoffs**

- Teachers create projects and subsystems
- Students write text-only status updates
- Project freshness indicators (operational only)
- Smartboard project board (read-only)

## **Phase 5 — Chores**

- Chore definitions
- Instances (available, claimed, pending verification)
- Verification types: `self | peer | teacher`
- No photo verification in V1
- Smartboard chores view

## **Phase 6 — Teacher Dashboard**

- Activity timeline
- Help queue overview
- Project freshness overview
- Chore verification queue
- Intervention indicators
- No evaluative analytics

---

# 3. V2 Items

### 3.1 Volunteer Accounts (V2)

- Volunteer role
- Volunteer queue view
- Volunteer help actions
- Volunteer metrics

### 3.2 Photo Capture (V2)

- Photo-based status updates
- Photo-based chore verification
- Media bucket
- Image processing pipeline
- Photo thumbnails on Smartboard

### 3.3 Progress Tracking (V2)

- Standards/learning objectives
- Readiness indicators
- Skill-level progress
- Evidence (text/photo)
- Class progress grid
- Progress dashboards

---

# 4. Major Dependencies & Ordering

- **Presence depends on Sessions**
- **Help Queue depends on Presence**
- **Project updates depend on membership + sessions but not bound by sessions**
- **Chores depend on classroom membership but not project membership**
- **Teacher dashboard depends on all operational projections**
- **Smartboard depends on projections only**

---

# 5. V1 Deliverables

### Identity

- Student and teacher accounts
- Display name, pronouns
- PIN login + Google OAuth

### Classroom Management

- Create/update/archive classrooms
- Add/remove/role-change (student/teacher only)
- Invite links

### Sessions

- Start/end
- Time-bounded presence + help

### Presence

- Real-time presence board
- Sign-in/out history

### Help Queue

- Domain categories
- Ninja assignments
- Real-time queue updates
- Request lifecycle (create/claim/resolve/cancel)
- Summary view for students/ninjas
- Full view for teachers

### Projects

- Project + subsystem creation
- Text-only updates
- Freshness metadata
- Read-only Smartboard project view

### Chores

- Definitions + recurrence
- Instances
- Self/peer/teacher verification (text-only)
- Smartboard chore board

### Dashboards

Teacher dashboard (attention management)  
Student home dashboard (orientation, not evaluation)

---

# 6. V2 Extensions

---

## V2-A: Volunteer Role

- Separate volunteer account type
- Invite/approve volunteer workflow
- Restricted help queue view
- Actions limited to non-sensitive issues
- Logged interventions
- Metrics on volunteer load & reliability

---

## V2-B: Photo Capture & Media System

- Media router (`media.getUploadUrl`, `media.confirmUpload`, `media.get`, etc.)
- Supabase Storage buckets for media
- Photo attachments in:
  - status updates
  - chore verification
  - project artifacts
- Image processing (resize, thumbnails, EXIF stripping)
- Smartboard thumbnail display

---

## V2-C: Progress Tracking

- Standards CRUD
- Student progress table
- Evidence (text + photo)
- Class progress grid
- Teacher review workflows
- Smartboard progress map
- “Ready for Assessment” query
- Student progress dashboard

---

## V2-D: Parent / Family Views

- Read-only views for family members
- Notifications related to student work
- Privacy-gated permissions

---

## V2-E: Multi-School Identity

- Person with memberships in multiple schools
- Cross-school permissions
- School-switcher UI

---

## V2-F: Editable Smartboard

- Shared drag/drop on help queue
- Real-time editable project board
- Chore distribution live edits

---

# 7. V3+ (Original Forward-Looking Notes, Preserved)

- Offline-first mode
- IoT integrations for tool checkout
- RFID presence tracking
- AI-assisted help triage
- Predictive workload balancing
- Skill-based matching for project groups
- Multi-classroom dashboards
- District data integrations
