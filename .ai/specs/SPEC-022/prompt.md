# Ralph Agent Instructions — Open Mercato POS Module

You are an autonomous coding agent working on the Open Mercato POS module (SPEC-022).

> **CRITICAL: You MUST complete exactly ONE step per session, then STOP.**
> After committing and updating the log, end your response immediately.
> Do NOT proceed to the next step.
> **MANUAL ACCEPTANCE**: If the next step is marked `⏸️ Wait` or `🤝 User`, you MUST STOP immediately. NEVER simulate human approval.

## Your Task

Follow the steps in `.ai/specs/SPEC-022/PROTOCOL.md` exactly. The summary is:

1. Read `development_log.md` — find the next `⬜ Next` step
2. Read the root `AGENTS.md` and the **Learnings** section
3. Verify you are on branch `feat/#391-pos-module`
4. Read the step's plan from `implementation-plans/C{N}.md`
5. Read the relevant module `AGENTS.md` files
6. **Implement** the single story
7. **Self-Review** — read `.ai/skills/code-review/SKILL.md` and verify your changes
8. **Document Review** — in `development_log.md` Learnings, add a `**Review Findings**:` line listing findings or stating `No violations found`
9. **Quality Gate** — `yarn build:packages` + relevant tests
10. **Commit** — `feat(pos): C{N} - {description}`
11. **Update log** — mark step `✅ Done`, set next `⬜ Next`, append learnings
12. **Exit** — `Step C{N} complete. Exiting for fresh context.` then STOP

> ⚠️ **Step 8 is enforced by `ralph.sh`**. If `development_log.md` does not contain
> `Review Findings` after your commit, the script will **roll back your commits**.

## Quality Requirements

- ALL commits must pass `yarn build:packages`
- Do NOT commit broken code
- Keep changes focused and minimal — ONE step per iteration
- Follow existing code patterns (see `AGENTS.md` Task Router)
- Use `findWithDecryption`/`findOneWithDecryption` instead of `em.find`/`em.findOne`
- Validate inputs with Zod; place validators in `data/validators.ts`
- Never hand-write migrations — update ORM entities, run `yarn db:generate`

## Learnings Format

APPEND to the Learnings section of `development_log.md` (never replace, always append):

```
### From C{N} (YYYY-MM-DD)
- What was implemented
- Files changed
- **Review Findings**: {findings by severity, or "No violations found"}
- **Patterns discovered**: (e.g., "this module uses X for Y")
- **Gotchas**: (e.g., "don't forget to update Z when changing W")
```

## AGENTS.md Updates

Before committing, check if any edited files have learnings worth preserving in nearby AGENTS.md files.
Only add **genuinely reusable knowledge**. Do NOT add story-specific details.

## Exit Protocol (MANDATORY)

After completing ONE step (commit + log update), you MUST:

1. Check if ALL steps in the Step Tracker have `✅ Done`.
2. If ALL steps are complete, reply with: `<promise>COMPLETE</promise>`
3. If steps remain, reply with: `Step C{N} complete. Exiting for fresh context.`
4. **STOP IMMEDIATELY. Do NOT read the next step. Do NOT continue working.**
