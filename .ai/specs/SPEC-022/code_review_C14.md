# Code Review: C14 - PosCartLine CRUD Commands (SPEC-022)

## Summary
Implemented the standard CRUD commandHandlers for `PosCartLine`. Operations are fully undoable and tenant-scoped.

## Findings

### Medium
- **Undo logic**: The `update` undo handler uses `Object.assign(line, payload.before)`. While this works for all current fields, it relies on the snapshot containing exactly the structure expected by the entity. This is consistent with the `registers.ts` pattern used in this module.

## Checklist
- [x] No `any` types introduced
- [x] Validators in `data/validators.ts` (not inline)
- [x] Tenant isolation: queries filter by `organization_id`
- [x] Commands implemented as `CommandHandler` with snapshots
- [x] Commands are undoable
- [x] Actions use `withAtomicFlush`
- [x] Build passes with new changes
- [x] Unit tests pass
