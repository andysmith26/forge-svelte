# Reference Documents

These documents define what Forge is, why it works this way, and how it's built. They are the source of truth for design decisions.

## Document Hierarchy

| Document | Role | Scope |
| -------- | ---- | ----- |
| [**01-vision-and-scope**](01-vision-and-scope.md) | Source of truth for *what* and *why* | Forge-specific: philosophy, problem, users, V1 scope, invariants |
| [**02-learning-principles**](02-learning-principles.md) | Philosophical foundation | Universal: 15 constructionist constraints from Piaget, Papert, and Stager |
| [**03-architecture**](03-architecture.md) | Source of truth for *how* | Forge-specific: layers, patterns, tech stack, directory structure |

## How They Relate

**Vision & Scope** is the root document. It defines Forge's purpose, users, classroom model, V1 capabilities, core invariants, and what Forge is not. All other documents must be consistent with it.

**Learning Principles** is the philosophical foundation that Vision & Scope builds on. V&S distills four operating commitments from these 15 principles and cites specific principle numbers throughout. Learning Principles is intentionally universal — it applies to any constructionist ed-tech project, not just Forge.

**Architecture** describes how Forge implements the vision within a SvelteKit application. It covers the layered architecture, entity design, use case patterns, infrastructure adapters, authentication, and testing. It incorporates the foundational architectural commitments (event sourcing, sessions as time containers, real-time guarantees) that originated in Vision & Scope.

## Rules

- If a feature contradicts Vision & Scope, the feature is wrong.
- If a feature violates a Learning Principle, it doesn't belong in Forge.
- If Architecture drifts from Vision & Scope, Architecture gets updated.
