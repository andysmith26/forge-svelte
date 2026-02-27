Here's a set of design guidelines derived from the shared philosophical lineage of Piaget, Papert, and Stager. These aren't suggestions — they're constraints. If a tool violates these, it's working against how children actually learn.

---

**On the nature of learning itself**

1. **Learning is construction, not transmission.** Children build knowledge by making things, not by receiving explanations. If your tool's primary interaction is presenting content and checking comprehension, it's a teaching tool, not a learning tool. Those are different things, and the constructionist tradition is uninterested in the first one.

2. **The child is the agent, never the tool.** The locus of control must stay with the learner. The moment your software is making the interesting decisions — choosing what to do next, evaluating quality, determining sequence — you've stolen the cognitive work. That's the work _that is_ the learning.

3. **Knowledge is not transferable as a unit.** You cannot design a tool that "delivers" understanding. You can only design environments where understanding becomes necessary. If your tool works without the child having to think hard, it doesn't work.

---

**On what tools should do**

4. **Tools must produce artifacts.** Papert's central insight: children learn most powerfully when constructing a public, shareable artifact — a program, a robot, a composition, a model. If your tool doesn't end with something the child made and can show to someone else, it's probably a worksheet with better graphics.

5. **Favor low floors, wide walls, and high ceilings.** Entry must be easy (low floor), the range of possible projects must be broad (wide walls), and sophistication must be unbounded (high ceiling). If every child's output looks roughly the same, your walls are too narrow. If advanced learners hit a cap, your ceiling is too low.

6. **The tool should make powerful ideas accessible, not easy.** Papert didn't want to remove difficulty — he wanted to remove _unnecessary_ difficulty. Logo didn't make geometry easy; it made geometry _experienceable_ by giving children a way to think with it. Your tool should give access to real domain concepts, not simplified decoys.

7. **Debugging is the pedagogy.** When something doesn't work, the child has to reason about why. This is where the deepest learning happens. Tools that prevent errors, auto-correct, or flag mistakes instantly are robbing children of the most valuable cognitive event. Design for productive failure, not failure prevention.

---

**On the role of adults**

8. **Adults are not instructors; they are environment designers.** The teacher's job (and therefore your tool's job in supporting teachers) is to set up the conditions where interesting problems arise naturally. Teacher-facing features should help adults observe, curate challenges, and ask good questions — not monitor compliance or pace delivery.

9. **Never provide a dashboard that reduces a child to a number.** Stager is blunt on this: quantified learning analytics are surveillance dressed as pedagogy. If your teacher view shows scores, completion rates, or time-on-task as primary indicators, you've built a compliance tool. Show teachers what kids _made_ and what they _struggled with_ instead.

10. **The adult should need to know the child to use the tool well.** If your teacher features work identically regardless of which student is involved, they aren't supporting teaching — they're automating management. Good tools should reward a teacher's knowledge of individual children, not replace it.

---

**On time and structure**

11. **Require sufficient time for immersion.** Papert and Stager both insist that deep learning requires extended, uninterrupted engagement. If your tool is designed around 10-minute sessions or bell-schedule chunks, you've pre-defeated it. Design for projects that unfold over days or weeks, not tasks that complete in minutes.

12. **Never gamify the learning itself.** Points, badges, streaks, and leaderboards redirect motivation from the intrinsic satisfaction of building something that works to the extrinsic accumulation of tokens. This is antithetical to the entire tradition. If the work isn't interesting enough without rewards, the work is wrong.

13. **Sequence is the learner's job, not the tool's.** Piaget showed that children construct knowledge in a developmental order that cannot be externally imposed. Papert extended this: the best learning happens when children follow their own questions. If your tool enforces a scope-and-sequence, you've built a curriculum, not a learning environment.

---

**On what to reject**

14. **If it can be done without a computer, don't use a computer.** Technology is justified only when it gives children powers they cannot otherwise have — the ability to simulate, to iterate instantly, to build at scale, to connect with distant audiences. If your tool digitizes something that works fine with paper, you've added cost without value.

15. **Reject the premise that learning must be measured to be real.** The demand for assessment data is institutional, not pedagogical. If your tool's design is shaped primarily by what it can measure and report, you've optimized for the institution, not the child. Stager would tell you that's a political choice disguised as a design requirement.

---

A practical test you can apply to any feature: **Who is doing the thinking?** If it's the software, cut the feature. If it's the teacher on behalf of the child, redesign it. If it's the child, you're probably in the right territory.
