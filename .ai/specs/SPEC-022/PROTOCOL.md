# Ralph Loop Protocol (SPEC-022)

> ⚠️ **This file is READ-ONLY for agents.** Do NOT modify this file.
> It defines the mandatory steps for each Ralph iteration.

## Per-Step Loop

Execute these steps **in order** for each `C*` plan:

1. **Read** the next `C*.md` plan from `implementation-plans/`
2. **Read** relevant `AGENTS.md` guides (see Task Router in root `AGENTS.md`)
3. **Implement** the single story (one `C*` = one story)
4. **Self-Review** (MANDATORY):
   - Read `.ai/skills/code-review/SKILL.md`
   - Verify changes against the checklist
   - Fix any Critical or High findings
5. **Document Review** (MANDATORY):
   - In `development_log.md` → Learnings → `### From C{N}`, add a `**Review Findings**:` line
   - List findings by severity, or write: `No violations found`
   - This line MUST exist before committing — `ralph.sh` will reject commits without it
6. **Quality Gate** — run before committing:
   - `yarn build:packages` (typecheck)
   - `yarn test` (relevant tests)
   - For UI stories (C22+): browser verification
7. **Git Commit** — message: `feat(pos): C{N} - {description}`
8. **Update `development_log.md`**:
   - Mark step as `✅ Done` with commit hash
   - Set the next step to `⬜ Next`
   - Append learnings (patterns, gotchas)
9. **Exit** — reply with `Step C{N} complete. Exiting for fresh context.` and STOP

## Status Symbols

| Symbol | Meaning | Agent Action |
|--------|---------|--------------|
| `✅ Done` | Completed & committed | Skip |
| `⬜ Next` | Ready for agent | Implement |
| `⏸️ Wait` | Blocked (dependency) | STOP — do not proceed |
| `🤝 User` | Manual acceptance required | STOP — do not proceed |

## Strict Rules

- **ONE step per session** — non-negotiable
- **NEVER bypass acceptance** — `⏸️ Wait` and `🤝 User` are hard stops
- **NEVER simulate human approval**
- **Keep the build green** — do not commit broken code
- **APPEND to Learnings** — never replace existing content
- **Review Findings line is REQUIRED** — commits without it will be rejected by the script
