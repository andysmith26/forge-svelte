# Evaluating Forge Against PRINCIPLES_LEARNING.md

The app already does several things well: it avoids scoring dashboards, rejects leaderboards, and positions teachers as facilitators (claiming help requests, not grading). But there are significant gaps. Here are 12 concrete recommendations, each tied to a specific principle.

**A note on scope:** Forge is not purely a "constructivist learning tool" — it is also a classroom logistics tool. But its logistics always exist in service of students constructing knowledge. Managing a help queue, organizing classroom responsibilities, tracking who's present — these are operational concerns, but when designed well they create the conditions for construction to happen. Some recommendations below are about direct construction activities (students making and sharing artifacts). Others are about logistics that enable construction (better help flows, session continuity, teacher review). And there is a third category worth naming: students who participate in managing their own classroom — triaging help, maintaining shared spaces, declaring expertise — are constructing knowledge about how learning communities work. That meta-learning is real and valuable.

---

## 1. Add the Projects Module — Students Need to Produce Artifacts (Principle 4)

> "Tools must produce artifacts... If your tool doesn't end with something the child made and can show to someone else, it's probably a worksheet with better graphics."

Right now Forge tracks _presence_ and _help requests_ — both administrative concerns. There's no place for students to document, share, or showcase what they actually **built**. The "Projects" module is marked "Coming Soon" in settings but doesn't exist. This is the single most important gap. Students should be able to create project entries with descriptions, photos, links, and reflections — artifacts they own and can present.

---

## 2. Add a Student-Facing Project Gallery / Showcase View (Principle 4 + 14)

> "A public, shareable artifact — a program, a robot, a composition, a model."

The smartboard display currently shows presence and help queue — operational data. It should also (or instead) feature a **project showcase**: what students have made. This is where the computer adds unique value (Principle 14) — aggregating and displaying student work to a classroom audience in real-time, something paper can't do as dynamically.

---

## 3. Redesign the Help Request Flow to Require More Student Thinking (Principle 2, 7) — _Logistics → construction_

> "Debugging is the pedagogy... Design for productive failure, not failure prevention."

The current help form asks for "what I tried" (min 20 chars), which is good. But it could go further:

- **Add a "what do you think is happening?" field** — force the student to articulate a hypothesis before requesting help.
- **Show a brief "have you tried..." prompt** (not auto-solving, just a nudge to think before escalating). This keeps the cognitive work with the student rather than immediately offloading it to a teacher.

---

## 4. Remove or Rethink the Ninja System's Gamification Elements (Principle 12) — _Meta-learning_

> "Never gamify the learning itself. Points, badges, streaks, and leaderboards redirect motivation from the intrinsic satisfaction of building something that works."

The Ninja system assigns students a visible badge ("N" on the smartboard) and a title based on teacher judgment. While the intent is peer specialization, the **badge-like presentation** risks becoming extrinsic motivation — kids pursuing "ninja" status rather than genuine mastery. Consider:

- Reframe ninjas as **"ask me about..."** rather than a status badge. The student's profile already has an `askMeAbout` field — lean into that instead of a separate badge system.
- Let students self-declare areas of comfort rather than having teachers assign status from above.

When students declare their own expertise and make themselves available as resources, they're constructing knowledge about their own competence and about how a learning community shares skill. That's valuable — but it needs to be self-directed, not awarded from above.

---

## 5. Let Students Choose Their Own Help Categories / Topics (Principle 13) — _Logistics → construction_

> "Sequence is the learner's job, not the tool's... The best learning happens when children follow their own questions."

Help categories are currently created and managed entirely by teachers. Students pick from a pre-defined list. Instead, allow students to **write in their own topic/category** when requesting help. This small change shifts ownership of how work is categorized back to the learner and gives teachers richer signal about what students are actually thinking about.

---

## 6. Replace the Teacher Dashboard Metrics with "What They Made / What They Struggled With" (Principle 9) — _Logistics → construction_

> "Never provide a dashboard that reduces a child to a number... Show teachers what kids made and what they struggled with instead."

The event log currently captures help request durations, wait times, and resolution times. While these aren't surfaced as dashboards yet, the infrastructure is built to support it. **Explicitly design the teacher's session review view** to show:

- A narrative of each student's session: what they worked on, what help they asked for, what they said they tried
- NOT: average wait time, number of requests, time-on-task metrics

---

## 7. Design for Multi-Session Projects, Not Single-Session Tasks (Principle 11) — _Logistics → construction_

> "Deep learning requires extended, uninterrupted engagement... Design for projects that unfold over days or weeks."

The entire app is structured around discrete **sessions** — start session, sign in, get help, end session. There's no continuity between sessions. A student's context resets each time. Add:

- **Project continuity across sessions** — students pick up where they left off
- **A "last time I was working on..." prompt** when signing in to a new session
- **Cross-session help history** so a teacher can see the arc of a student's struggle, not just today's snapshot

---

## 8. Give Students Control Over Their Profile and Self-Presentation (Principle 2) — _Meta-learning_

> "The child is the agent, never the tool. The locus of control must stay with the learner."

Students can currently edit pronouns and "ask me about" — good. Expand this:

- Let students **choose their own avatar or display image** (not just a generated initial)
- Let students write a **"currently working on"** status visible on the smartboard
- Let students **opt in/out of the help queue display** — some kids don't want their struggles public

This shifts the smartboard from a teacher surveillance tool to a student expression tool.

---

## 9. Rethink the Smartboard as a Student-Controlled Artifact Board (Principles 2, 4, 14)

> "Technology is justified only when it gives children powers they cannot otherwise have."

The smartboard currently serves the teacher: who's here, who needs help. Reimagine it as a space **students contribute to**:

- Students post updates about their projects ("just got my circuit working!")
- The display rotates through student work-in-progress
- Students can "feature" their project on the board when they want to share

This is uniquely enabled by the computer (aggregation, real-time updates to a shared display) and puts students in control.

---

## 10. Remove Enforced Urgency Levels from Help Requests (Principle 2, 13) — _Logistics → construction_

> "The moment your software is making the interesting decisions — choosing what to do next, evaluating quality, determining sequence — you've stolen the cognitive work."

The current system asks students to classify urgency as "blocked / question / check_work." This pre-categorization subtly tells students how to frame their problem in the system's terms rather than their own. Teachers should decide priority by **knowing their students** (Principle 10), not by reading a software-assigned urgency tag. Consider making urgency optional or removing it, and instead letting the teacher's knowledge of the child drive triage.

---

## 11. Add a Student Reflection / Journal Feature Tied to Projects (Principles 1, 4, 7)

> "Learning is construction... Children build knowledge by making things."

Reflection is itself an act of construction — building understanding of your own process. Add a lightweight journal where students can:

- Write about what they learned during a session
- Document bugs they encountered and how they solved them (Principle 7 — debugging as pedagogy)
- Attach these reflections to their project artifacts

This is **not** an assessment tool for teachers — it's a construction tool for students.

---

## 12. Ensure the "Chores" Module Doesn't Become Compliance Tracking (Principles 8, 9, 15) — _Meta-learning_

> "Teacher-facing features should help adults observe, curate challenges, and ask good questions — not monitor compliance or pace delivery."

The "Chores" module is marked "Coming Soon." When designed, it must avoid becoming a task-completion tracker with checkboxes and completion rates. Instead, frame classroom responsibilities as **community contributions** — visible on the project board, self-reported by students, and discussed rather than scored. This is worth doing because students managing shared responsibilities are constructing knowledge about how communities function — negotiating fairness, developing reliability, understanding collective ownership. That said, if chores can be managed with a paper chart on the wall, don't digitize them (Principle 14). The justification for putting this in Forge is if the tool enables something paper can't: rotation logic, student-driven negotiation of responsibilities, or visibility across sessions.

---

## Summary

| #   | Recommendation                                         | Category                  | Primary Principle                   |
| --- | ------------------------------------------------------ | ------------------------- | ----------------------------------- |
| 1   | Build the Projects module for student artifacts        | Direct construction       | 4 — Artifacts                       |
| 2   | Add project gallery/showcase to smartboard             | Direct construction       | 4, 14 — Artifacts + Computer-worthy |
| 3   | Deepen help request form to require student hypotheses | Logistics → construction  | 2, 7 — Agency + Debugging           |
| 4   | Rethink Ninja badges as self-declared "ask me about"   | Meta-learning (community) | 12 — No gamification                |
| 5   | Let students write in their own help topics            | Logistics → construction  | 13 — Learner-driven sequence        |
| 6   | Design teacher review as narrative, not metrics        | Logistics → construction  | 9 — No numbers                      |
| 7   | Support multi-session project continuity               | Logistics → construction  | 11 — Time for immersion             |
| 8   | Expand student control over profile & visibility       | Meta-learning (community) | 2 — Child as agent                  |
| 9   | Reimagine smartboard as student-controlled space       | Direct construction       | 2, 4, 14 — Agency + Artifacts       |
| 10  | Make help urgency optional or remove it                | Logistics → construction  | 2, 13 — Agency + Learner sequence   |
| 11  | Add student reflection/journal tied to projects        | Direct construction       | 1, 4, 7 — Construction + Debugging  |
| 12  | Design Chores as community contributions, not tracking | Meta-learning (community) | 8, 9, 15 — No compliance            |

The overarching theme is not that Forge should stop managing classroom logistics — it's that those logistics should always serve student construction. Some recommendations above (1, 2, 9, 11) add **direct construction activities**: students making and sharing artifacts. Others (3, 5, 6, 7, 10) improve **logistics so they enable construction** rather than displacing it — better help flows that keep cognitive work with the student, session continuity that supports deep projects, teacher views that surface what kids made rather than compliance metrics. And a third group (4, 8, 12) recognizes that **students participating in classroom management is itself constructive** — declaring expertise, shaping their own visibility, contributing to shared responsibilities. When students help triage a help queue or maintain a classroom community, they are constructing knowledge about how learning communities function. That meta-learning deserves to be designed for, not treated as mere administration.
