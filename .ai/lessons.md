# Lessons

# Lessons Learned

Recurring patterns and mistakes to avoid. Review at session start.

## Centralize generic infrastructure only

**Context**: Promoting code reuse for utilities like `UndoPayload` or `withAtomicFlush`.

**Problem**: Aggressive "centralization" can lead to cross-module coupling or regressions if infra-level logic (like Auth scoping) is simplified without full context.

**Rule**: Centralize shared utilities in `packages/shared` only if they are strictly **isomorphic and generic**. Never centralize module-specific logic or complex security/tenant-scoping logic that depends on platform-wide context. Favor small, focused helpers over "god utilities" that try to handle too many cross-cutting concerns.

## Avoid identity-map stale snapshots in command logs

**Context**: Command `buildLog()` in multiple modules loaded the "after" snapshot using the same non-forked `EntityManager` used earlier in `prepare()`. MikroORM's identity map returned cached entities, so `snapshotAfter` matched `snapshotBefore`.

**Problem**: Audit logs showed identical before/after snapshots even when updates occurred, because the EM cache was reused.

**Rule**: In `buildLog()`, always load snapshots using a forked `EntityManager` (or explicitly `refresh: true`). This guarantees a fresh DB read and avoids identity-map caching in logs.

**Applies to**: Any command that captures `snapshotBefore` in `prepare()` and later loads `snapshotAfter` in `buildLog()`.

## Flush entity updates before running relation syncs that query

**Context**: `catalog.products.update` mutates scalar fields and then calls `syncOffers` / `syncCategoryAssignments` / `syncProductTags`, which perform `find` queries. MikroORM auto-flush + subscriber logic reset `__originalEntityData`, resulting in no change sets and no UPDATE being issued.

**Problem**: Updates to the main entity silently did not hit the database when relation syncs executed before the flush.

**Rule**: If an update command mutates scalar fields and then performs relation-sync queries, flush the main entity changes *before* those syncs (or split into two UoWs/transactions).

**Applies to**: Commands that update a core record and then call sync helpers that query/modify relations using the same `EntityManager`.
## Trust generators over manual patches

**Context**: Manual "fixes" to generated files (e.g., `entity-fields-registry.ts`) introduced syntax errors that broke the build.

**Problem**: Manual patches are fragile and get overwritten anyway. 

**Rule**: Never manually edit files in `.mercato/generated/` or `src/generated/`. If they are wrong, fix the generator source (`packages/cli/src/lib/generators/`) or the input metadata (`index.ts`, `entities.ts`). Run `yarn generate` to verify.

## Isolate Next.js magic in shared packages

**Context**: When adding logic to `packages/shared` that uses `next/headers`, `next/navigation`, or other Next.js-runtime-only features.

**Problem**: CLI tools (which load the same packages during bootstrap) can crash if they encounter Next.js-specific imports outside of a Next.js runtime.

**Rule**: ALWAYS use dynamic imports for `next/headers`, `next/navigation`, or any other Next.js-runtime-only features in `packages/shared`. This prevents CLI tools from crashing.

## Scope database migrations to specific modules

**Context**: Running `yarn db:generate` without scoping resulted in a massive migration that incorrectly dropped foreign key constraints across the entire system.

**Problem**: Unscoped migrations are globally destructive if the local database is even slightly out of sync with other modules.

**Rule**: Always scope migration generation to the specific module's entities using the `--filter` or specific entity paths. Review migration files for `drop constraint` or `drop table` statements that don't belong to the target module.

## Maintain branch purity via base diffs

**Context**: The POS branch accumulated "pollution" including regressions in `packages/shared` and unauthorized deletions.

**Problem**: Long-running branches can unknowingly deviate from `origin/develop` in unrelated areas.

**Rule**: Frequently run `git diff origin/develop...HEAD --name-only` to ensure only module-specific files and intended architectural changes are present. Revert any accidental changes in core packages immediately.
