# Forge — Metrics

# 1. Purpose of Metrics

Forge metrics exist to answer operational questions:

- Is the classroom running smoothly right now?
- Are students able to get help promptly?
- Are projects advancing between sessions?
- Are chores being distributed fairly?
- Do teachers have situational awareness?

Metrics in V1 are **not** evaluative. They do not measure mastery, skill, or achievement.

This document defines metrics derived from projections. All metrics are role-dependent and must honor privacy guarantees.

---

# 2. V1 Metrics: Operational Freshness Only

The following metrics are aligned with V1 constraints and do not imply mastery or evaluative scoring.

## 2.1 Presence Metrics

### Active Presence Count

Number of students currently signed in.

### Inactive-but-Present Flags

Students who are signed in but have no activity (status updates, help events, chore events) within a configurable window.

### Session Activity Density

Distribution of “activity events” (help, project updates, chore completions) by time of session.

---

## 2.2 Help Queue Metrics

### Queue Length Over Time

Rolling count of pending help requests.

### Time-to-First-Response

Median time between request creation and claim (teacher or ninja).

### Time-to-Resolution

Median time between request creation and resolution.

### Request Lifecycle Breakdown

Count of help events:

- created
- claimed
- unclaimed
- resolved
- cancelled

### Domain Load Distribution

Requests per help category (i.e., per ninja domain).

### Uncategorized Ratio

Fraction of requests with no category, supporting INV-2 behavior.

---

## 2.3 Project Operational Metrics

### Project Freshness

Time since last status update for each project.  
Buckets may include:

- 0–1 sessions
- 2–3 sessions
- 4–5 sessions
- > 5 sessions (stale)

### Subsystem Freshness

Same metric at the subsystem level.

### Multi-Student Collaboration Rate

Number of projects with >1 active student this session.

### Update Visibility Rate

Percentage of status updates viewed by other project members.

---

## 2.4 Chore Metrics

### Chore Claim Rate

Average claims per session.

### Completion Velocity

Median time from claim → complete.

### Verification Velocity

Median time from complete → verification (peer or teacher).

### Recurrence Health

Completion rate for recurring chores within expected windows.

---

## 2.5 Ninja Metrics

### Ninja Load Balance

Requests per ninja, including:

- claimed
- resolved

### Domain Bottlenecks

Domains with persistent queues or long wait times.

### Intervention Indicators

Rate of teacher overrides (`byTeacher: true`) per session.

---

# 3. Smartboard Metrics (Derived, Not Stored)

Smartboard displays aggregate operational views:

- Real-time presence
- Real-time help queue
- Freshness colors for projects
- Chore distribution

Smartboard shows **only** operational data and must not include:

- comparative performance
- mastery metrics
- skill status
- evaluative summaries

---

# 4. Anti-Metric Boundaries (Required by 01–04)

The following must **not** appear in V1 metrics:

- No skill progression (“emerging → proficient → mastery”)
- No rubric scoring
- No cross-student comparisons
- No leaderboards
- No streaks, XP, points
- No evaluative progress bars
- No performance analytics

These are V2+ features and belong in V2 extensions.

---

# 5. Data Sources

Metrics come exclusively from projections:

- SignIn
- HelpRequest
- StatusUpdate
- ChoreInstance
- NinjaAssignment

All are derived from immutable domain events.

No metric in V1 may use:

- media files
- evidence artifacts
- progress tables
- volunteer interactions

These belong to V2 extensions.

---

# 6. Dashboard Views

## 6.1 Teacher Dashboard

- Help queue health
- Presence distribution
- Project freshness indicators
- Chore verification backlog
- Activity timeline

## 6.2 Student Dashboard (Home)

- Own activity summary
- Own project freshness (operational, not evaluative)
- Own help request state
- Chore status

---

# 7. V2-Only Metrics

The following metrics are V2-only:

- Metrics depending on **progress standards**, **progress statuses**, or **progress evidence**
- Metrics based on **photo evidence**
- Metrics using **progress grid** or **progress heat maps**
- Metrics that implied **evaluation**, **growth**, or **achievement levels**
- Metrics referencing **volunteer actions**

---

# V2 Extensions

---

## V2-A: Progress Metrics

### Student Progress Indicators

- Standards completed
- Standards in-progress
- Skills emerging
- Skills mastered

### Evidence Metrics

- Evidence items added (text, photo, file)
- Evidence-by-domain breakdown
- Evidence completeness score

### Class Progress Grid

- Standards × Students grid
- Aggregated “readiness” indicators
- Highlighting bottleneck standards

### Person-Level Growth Trajectory

- Trend lines for evidence submitted
- Timeline of demonstrations
- Skill-level heat maps

### Teacher Progress Dashboard

- Evaluation backlog
- Standards with high variance
- Students with stalled standards
- Standards requiring calibration

---

## V2-B: Media-Based Metrics

### Photo Evidence Count

Images per student/project/standard.

### Verification Latency with Media

Verification time when photos are required.

### Media Coverage Ratio

Percentage of project updates or chores containing photos.

---

## V2-C: Volunteer Metrics

### Volunteer Activity

Help requests claimed by volunteers.

### Volunteer Reliability

Median response time of volunteers.

### Volunteer Effectiveness

Resolution times vs teacher/ninja benchmarks.
