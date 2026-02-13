# POS Module Development Log (SPEC-022)

> **This file is the boot loader for every new session.**
> Any agent starting work on SPEC-022 MUST read this file first.

## References
- [SPEC-022 - POS Module](../SPEC-022-2026-02-07-pos-module.md)
- [SPEC-022a - Tile Browsing](../SPEC-022a-2026-02-09-pos-tile-browsing.md)
- [Roadmap](./implementation-plans/roadmap.md)
- [Protocol](./PROTOCOL.md) — **read this for the mandatory step sequence**
- [Project Guidelines (AGENTS.md)](../../AGENTS.md)

---

## Current Status

- **Branch**: `feat/#391-pos-module`
- **Last Completed Step**: C18 (Cart Completion)
- **Next Step**: C19 (Cart Completion Command)

### Step Tracker

Status Legend:
- ✅ Done — Step complete & committed
- ⬜ Next — Ready for autonomous agent
- ⏸️ Wait — Paused (dependency/human needed)
- 🤝 User — Manual User Acceptance Required (loop will stop)

| Step | Status | Commit | Description |
|------|--------|--------|-------------|
| C01 | ✅ Done | `0c07b87` | Scaffolding |
| C02 | ✅ Done | `0c07b87` | ACL & Events |
| C03 | ✅ Done | `0c07b87` | Seeding |
| C04 | ✅ Done | `0c07b87` | PosRegister Entity |
| C05 | ✅ Done | `0c07b87` | PosRegister Commands |
| C06 | ✅ Done | `0c07b87` | PosRegister API |
| A-06 | ✅ Done | `0c07b87` | API Acceptance: Register |
| C06c | ✅ Done | `219133c2` | PIN Support |
| C07 | ✅ Done | `8587f802` | PosSession Entity |
| C08 | ✅ Done | `8d4f3dc0` | PosSession Commands |
| C09 | ✅ Done | — | PosSession API Routes |
| A-09 | ✅ Done | — | Acceptance: Session Lifecycle |
| C10 | ✅ Done | `db78ee98` | PosCashMovement Entity |
| C11 | ✅ Done | `11a6f3cd` | PosCashMovement Commands |
| C11b | ✅ Done | — | PosCashMovement API Routes |
| C12 | ✅ Done | `665e3f8b` | PosCart Entity |
| C13 | ✅ Done | `49865ddc` | PosCartLine Entity |
| C14 | ✅ Done | — | PosCart CRUD Commands |
| C15 | ✅ Done | — | PosCart Totals Recalculation |
| C16 | ✅ Done | `0d8cc320` | PosPayment Entity & Validator |
| C17 | ✅ Done | `b5fb8445` | PosPayment Commands |
| C18 | ✅ Done | — | Cart Completion |
| C19 | ⬜ Next | — | Cart Completion Command |

| ... | ... | ... | (See roadmap.md for full list) |

---

## Learnings

_Required for each step:_
- **Review Findings**: List any Critical/High/Medium issues found via code-review, or state "No violations found"
- **Patterns Discovered**: Architectural or code patterns noted
- **Gotchas**: Lessons for the next session

### From C01–C06 (2026-02-10)
- POS module uses **singular** entity names in ACL/command/event IDs (e.g., `pos.cart.manage`), unlike Sales which uses plural.
- `PosRegister` entity uses `isActive` boolean instead of the spec's `status` enum — simplified for Phase 1.
- Register acceptance tests mock `commandBus.execute` and `queryEngine.query` — follow this pattern for session tests.

### From C06c (2026-02-11)
- Added `pinHash` to `User` entity and Zod validation for PIN (4-6 digits).
- **Review Findings**: No violations found
- **Patterns discovered**: The `User` entity stores direct password hashes (`passwordHash`), so `pinHash` follows the same pattern directly on the `User` entity.
- **Gotchas**: Remember to implement PIN hashing (e.g., with `bcryptjs`) before saving to the database.

### From C07 (2026-02-11)
- What was implemented: PosSession Entity created in `packages/core/src/modules/pos/data/entities.ts`.
- Files changed: `packages/core/src/modules/pos/data/entities.ts`
- **Review Findings**: No violations found
- **Patterns discovered**: Standard entity structure with `organizationId`, `tenantId`, `createdAt`, `updatedAt`, `deletedAt` and Mikro-ORM decorators (`@Entity`, `@PrimaryKey`, `@Property`, `@Index`) used consistently. Use of `jsonb` for metadata and `numeric` for monetary values.
- **Gotchas**: None.

### From C08 (2026-02-11)
- What was implemented: Implemented CRUD commands for `PosSession` entity (`CreatePosSession`, `UpdatePosSession`, `DeletePosSession`), and specific lifecycle commands (`OpenPosSession`, `ClosePosSession`). Defined Zod schemas for `PosSession` inputs and updated events for `PosSession` lifecycle.
- Files changed:
    - `packages/core/src/modules/pos/data/validators.ts`
    - `packages/core/src/modules/pos/commands/shared.ts`
    - `packages/core/src/modules/pos/commands/sessions.ts` (new)
    - `packages/core/src/modules/pos/events.ts`
    - `.ai/specs/SPEC-022/implementation-plans/C08.md` (new)
- **Review Findings**: No violations found
- **Patterns discovered**: Copied `CommandHandler` pattern from `registers.ts`, including `loadSnapshot`, `withAtomicFlush`, `emitCrudSideEffects`/`emitCrudUndoSideEffects`. Used `requirePosSession` helper.
- **Gotchas**: Remembered to update `shared.ts` with `requirePosSession` and `events.ts` with CRUD events.

### From C09 & A-09 (2026-02-11)
- **Implemented**: `PosSession` API routes (CRUD + Open/Close) in `packages/core/src/modules/pos/api/sessions.ts` and normalized `openapi.ts`.
- **Verified**: Full acceptance test suite in `sessions.acceptance.test.ts` passing with 100% coverage of lifecycle.
- **Review Findings**: Fixed `Result` class usage (removed), standardized DI container mocking in tests (`createRequestContainer`), and resolved OpenAPI schema generation issues.
- **Patterns Discovered**: The `CommandBus` returns a plain object `{ result: ... }`, not a `Result` class instance. Acceptance tests must mock `createRequestContainer` to support `makeCrudRoute` correctly.
- **Gotchas**: Mocks for `em` (EntityManager) are critical for custom field decoration, even if not explicitly used in the test logic, to avoid console warnings.

### From C10 (2026-02-13)
- **Implemented**: `PosCashMovement` Entity in `packages/core/src/modules/pos/data/entities.ts` and Zod validator in `packages/core/src/modules/pos/data/validators.ts`.
- **Review Findings**:
  - Initially found several violations (generator typo, 20+ type errors, `any` type usage).
  - **All violations resolved**: Typo fixed, `NextResponse` used for API types, `RequiredEntityData` for commands, and guards added to undo handlers.
- **Patterns Discovered**: Standardize on `NextResponse` for core API handlers to ensure `Request`/`Response` globals are correctly resolved in the build environment. Use `RequiredEntityData<T>` from `@mikro-orm/core` for `em.create()` to maintain strict typing.
- **Gotchas**: Rebuilding the CLI package is required after fixing generator source files to see changes in `yarn generate`.
### From C11 (2026-02-13)
- **Implemented**: `pos.cash.movement.create` command in `packages/core/src/modules/pos/commands/cash-movements.ts`.
- **Verified**: Unit tests for creation and undo functionality passing.
- **Review Findings**: No violations found.
- **Patterns Discovered**: Follow the `CommandHandler` archetype for POS: `ensureOrganizationScope`, `ensureTenantScope`, `withAtomicFlush` for persistence, and `emitCrudSideEffects`/`emitCrudUndoSideEffects` for events.
- **Gotchas**: Ensure `createdByUserId` is correctly captured in snapshots to support full undo/audit fidelity. Verify that `index.ts` in the commands folder imports all newly created command files to register them in the `commandBus`.
### From C12 (2026-02-13)
- **Implemented**: `PosCart` Entity in `packages/core/src/modules/pos/data/entities.ts` and Zod schemas in `packages/core/src/modules/pos/data/validators.ts`.
- **Review Findings**: No violations found.
- **Patterns Discovered**: Standardize on plural table names (`pos_carts`) even if the entity class is singular (`PosCart`), while keeping POS-specific IDs singular (per convention). Use of `numeric` for all monetary fields with precision 18, scale 4.
- **Gotchas**: Ensure all mandatory scoping columns (`organization_id`, `tenant_id`) and audit columns are included and indexed.

### From C13 (2026-02-13)
- **Implemented**: `PosCartLine` Entity in `packages/core/src/modules/pos/data/entities.ts` and Zod schemas in `packages/core/src/modules/pos/data/validators.ts`.
- **Review Findings**: No violations found.
- **Patterns Discovered**: Used `numeric(18,4)` consistently for quantities and monetary values, matching the `PosCart` and `sales` line item patterns.
- **Gotchas**: Ensure `productId` is indexed for fast lookup during cart operations. Re-running `yarn generate` is necessary to update the generated code that tracks entity changes.

### From C14 (2026-02-13)
- **Implemented**: `pos.cart.line.add`, `pos.cart.line.update`, and `pos.cart.line.delete` commands.
- **Verified**: Unit tests passing for all CRUD operations and undo functionality.
- **Review Findings**: No violations found. Standardized snapshot/undo pattern from `registers.ts`.
- **Patterns Discovered**: Standardize on `requirePosCart` and `requirePosCartLine` helpers to reduce boilerplate and ensure consistent 404/Deleted status handling.
- **Gotchas**: Always verify the cart exists before adding a line to prevent orphaned lines in dissociated sessions.
### From C15 (2026-02-13)
- **Implemented**: `PosCart` and `PosCartLine` totals recalculation logic in `packages/core/src/modules/pos/lib/cartCalculation.ts`. Integrated this service into add/update/delete cart line commands.
- **Verified**: Unit tests for all cart line commands passing with totals validation. Full package build successful.
- **Review Findings**: No violations found.
- **Patterns Discovered**: Standardized on `.toFixed(4)` for numeric string properties to ensure consistency with Mikro-ORM monetary types.
- **Gotchas**: When using `em.find` for recalculating totals, remember to filter by `deletedAt: null` to avoid including soft-deleted lines.
### From C16 (2026-02-13)
- **Implemented**: `PosPayment` Entity in `packages/core/src/modules/pos/data/entities.ts` and Zod schemas in `packages/core/src/modules/pos/data/validators.ts`.
- **Review Findings**: No violations found.
- **Patterns Discovered**: Followed established POS module patterns for scoping and audit fields. Numeric fields use `precision: 18, scale: 4`.
- **Gotchas**: Root `npm run modules:prepare` script seems to be missing from `package.json` despite being referenced in `AGENTS.md`. Used `yarn generate` and `yarn build:packages` directly.

### From C17 (2026-02-13)
- **Implemented**: `pos.payment.record` command in `packages/core/src/modules/pos/commands/payments.ts`.
- **Verified**: Unit tests passing for exact payments, overpayments, and split payments.
- **Review Findings**: No violations found.
- **Patterns Discovered**: Standardized change calculation for cash payments and updated `PosCart.amountReturn` reactively.
- **Gotchas**: Ensure all payment IDs (organization, tenant, session, cart) are valid UUIDs during testing as Zod validation is strict.
### From C18 (2026-02-13)
- **Implemented**: `mapPosCartToSalesOrder`, `mapPosCartLineToSalesOrderLine`, and `mapPosPaymentToSalesPayment` in `packages/core/src/modules/pos/lib/salesBridge.ts`.
- **Verified**: Unit tests in `salesBridge.test.ts` passing for all mapping scenarios. Full package build successful.
- **Review Findings**: No violations found.
- **Patterns Discovered**: Standardized mapping from POS gross prices to Sales net prices by extracting tax. Used `externalReference` to maintain traceability between POS and Sales entities without direct ORM relationships.
- **Gotchas**: Ensure `paidTotalAmount` in Sales Order correctly reflects only the captured amount (excluding change returned) to maintain financial integrity.
