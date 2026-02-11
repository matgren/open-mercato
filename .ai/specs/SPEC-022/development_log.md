# POS Module Development Log (SPEC-022)

> **This file is the boot loader for every new session.**
> Any agent starting work on SPEC-022 MUST read this file first.

## References
- [SPEC-022 - POS Module](../SPEC-022-2026-02-07-pos-module.md)
- [SPEC-022a - Tile Browsing](../SPEC-022a-2026-02-09-pos-tile-browsing.md)
- [Roadmap](./implementation-plans/roadmap.md)
- [Project Guidelines (AGENTS.md)](../../AGENTS.md)

---

## Ralph-Adapted Workflow Protocol

We follow a modified [Ralph methodology](https://github.com/snarktank/ralph) adapted for conversational AI (Antigravity). The core loop is the same; the "fresh context" mechanism differs.

### Per-Step Loop (execute for each `C*` plan)

1. **Read** the next `C*.md` plan from `implementation-plans/`
2. **Read** relevant `AGENTS.md` guides (see Task Router in root `AGENTS.md`)
3. **Implement** the single story (one `C*` = one story)
4. **Quality Gate** — run before committing:
   - `yarn build:packages` (typecheck)
   - `yarn test` (relevant tests)
   - For UI stories (C22+): browser verification
5. **Git Commit** — one commit per `C*` step, message: `feat(pos): C{N} - {description}`
6. **Update this log**:
   - Move step to `Completed` in Current Status
   - Append any learnings to `Learnings` section
7. **Update `AGENTS.md`** (if patterns/gotchas were discovered)
8. **Signal end of iteration** — tell the user the step is done

### Fresh Context Protocol

Ralph spawns a new AI process per iteration. We simulate this by:
- **Within a session**: Continue with the next `C*` step if context is still clean.
- **Across sessions**: When starting a new conversation, point the agent at this file:
  `@[.ai/specs/SPEC-022/development_log.md]`
  The agent reads Current Status, picks up the next step, and continues.
- **When to start a new session**: After every 2-3 committed steps, or when context feels heavy.

---

## Current Status

- **Branch**: `feat/#391-pos-module`
- **Last Completed Step**: C06c (Auth Module PIN Support)
- **Next Step**: C07

### Step Tracker

| Step | Status | Commit |
|------|--------|--------|
| C01 | ✅ Done | `0c07b87` |
| C02 | ✅ Done | `0c07b87` |
| C03 | ✅ Done | `0c07b87` |
| C04 | ✅ Done | `0c07b87` |
| C05 | ✅ Done | `0c07b87` |
| C06 | ✅ Done | `0c07b87` |
| A-06 | ✅ Done | `0c07b87` |
| C06c | ✅ Done | `219133c2` |
| C07 | ⬜ Next | — |

---

## Learnings

_(Append discoveries here after each completed step)_

### From C01–C06 (2026-02-10)
- POS module uses **singular** entity names in ACL/command/event IDs (e.g., `pos.cart.manage`), unlike Sales which uses plural.
- `PosRegister` entity uses `isActive` boolean instead of the spec's `status` enum — simplified for Phase 1.
- Register acceptance tests mock `commandBus.execute` and `queryEngine.query` — follow this pattern for session tests.

### From C06c (2026-02-11)
- What was implemented: Added `pinHash` to `User` entity and Zod validation for PIN (4-6 digits).
- Files changed: `packages/core/src/modules/auth/data/entities.ts`, `packages/core/src/modules/auth/data/validators.ts`
- **Patterns discovered**: The `User` entity stores direct password hashes (`passwordHash`), indicating that `pinHash` should follow the same pattern directly on the `User` entity rather than a separate `UserCredential` entity. Zod schemas are placed directly in `data/validators.ts`.
- **Gotchas**: Remember to implement PIN hashing (e.g., with `bcryptjs`) before saving to the database and ensure proper decryption/verification on retrieval.
