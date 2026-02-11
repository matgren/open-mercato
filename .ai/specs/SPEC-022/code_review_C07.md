# Code Review: C07 - PosSession Entity

## Summary
The `PosSession` entity was created in `packages/core/src/modules/pos/data/entities.ts` according to `SPEC-022`. It includes standard fields, Mikro-ORM decorators, and appropriate indexing.

## Findings

### Critical
No violations found.

### High
No violations found.

### Medium
No violations found.

### Low
No violations found.

## Checklist
- [x] No `any` types introduced
- [ ] All API routes export `openApi`
- [ ] Validators in `data/validators.ts` (not inline)
- [x] Tenant isolation: queries filter by `organization_id`
- [ ] No hardcoded user-facing strings
- [ ] CRUD routes use `makeCrudRoute` with `indexer`
- [ ] Events declared in `events.ts` before emitting
- [ ] Workers/subscribers export `metadata`
- [ ] Custom fields use `collectCustomFieldValues()`
- [x] `modules:prepare` needed after file additions
- [x] No cross-module ORM relationships
- [ ] Encryption helpers used instead of raw `em.find`
- [ ] Forms use `CrudForm`, tables use `DataTable`
- [ ] `apiCall` used instead of raw `fetch`
- [ ] ACL features mirrored in `setup.ts` `defaultRoleFeatures`
