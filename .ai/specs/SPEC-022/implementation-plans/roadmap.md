This roadmap breaks down the POS module implementation into 34 atomic commits.

### Architectural Standards
- **Naming**: Singular entity names for POS (per SPEC-022 convention).
- **Security**: PIN-based switching support (C06c) + Tenant-scoped isolation.
- **Audit**: `VersionHistoryPanel` integration (SPEC-017) for all CrudForms.
- **i18n**: i18n-first design (SPEC-003) & standard Form System (SPEC-016).
- **Traceability**: Every `C*.md` plan **MUST** list the specific **User Stories** (from `pos_user_stories.md`) and **Sequence Diagrams** (from `pos_sequence_diagrams.md`) it implements.

## Commit Index

| Commit | Scope | Description |
|--------|-------|-------------|
| **C01** | Backend | Scaffolding & Module Registration |
| **C02** | Backend | ACL & Events Definitions |
| **C03** | Backend | Database Seeding (SalesChannel, PaymentMethods) |
| **C04** | Backend | `PosRegister` Entity & Validator |
| **C05** | Backend | `PosRegister` Commands (Create/Update/Delete) |
| **C06** | Backend | `PosRegister` API Routes |
| **A-06** | Acceptance | [API: Register Management](file:///Users/maciejgren/Documents/OM/.ai/specs/SPEC-022/implementation-plans/commit-1-06-api-acceptance.md) |
| **C06c** | Backend | Auth Module: PIN Support (Security) |
| **C07** | Backend | `PosSession` Entity & Validator |
| **C08** | Backend | `PosSession` Commands (Open/Close) |
| **C09** | Backend | `PosSession` API Routes |
| **A-09** | Acceptance | [API: Session Lifecycle](file:///Users/maciejgren/Documents/OM/.ai/specs/SPEC-022/implementation-plans/commit-1-09-api-acceptance.md) |
| **C10** | Backend | `PosCashMovement` Entity & Validator |
| **C11** | Backend | `PosCashMovement` Commands |
| **C11b** | Backend | `PosCashMovement` API Routes |
| **C12** | Backend | `PosCart` Entity & Validator |
| **C13** | Backend | `PosCartLine` Entity & Validator |
| **C14** | Backend | `PosCartLine` Commands (Add/Update/Delete) |
| **C15** | Backend | `PosCart` Totals Recalculation Service |
| **C16** | Backend | `PosPayment` Entity & Validator |
| **C17** | Backend | `PosPayment` Commands & Entity Mapping Logic |
| **C18** | Backend | Sales Module Bridge & Mapping |
| **C18b** | Backend | `PosCart` Completion Command (`pos.cart.complete`) |
| **C19** | Backend | `PosReceipt` Entity & Validator |
| **C20** | Backend | `PosReceipt` Generation Logic |
| **C21** | Backend | Final Verification & Migration Generation |
| **C22** | Frontend | Scaffolding & Module Routing |
| **C23** | Frontend | Register Management UI |
| **A-P1** | Acceptance | [Register Management](file:///Users/maciejgren/Documents/OM/.ai/specs/SPEC-022/implementation-plans/commit-1-23-user-acceptance.md) |
| **C23b** | Frontend | Session Management UI |
| **A-P2** | Acceptance | [Session Lifecycle](file:///Users/maciejgren/Documents/OM/.ai/specs/SPEC-022/implementation-plans/commit-1-23b-user-acceptance.md) |
| **C24** | Frontend | `PosCheckoutPage` Layout Skeleton + **Idle Auto-Lock** |
| **C25** | Frontend | `PosProductGrid` & **Category Tabs** Components |
| **C26** | Frontend | `PosProductSearch`, **Weighted Barcode Parser** |
| **C27** | Frontend | `PosCartPanel` & Item Management (Qty/Override) |
| **A-P4** | Acceptance | [terminal Entry](file:///Users/maciejgren/Documents/OM/.ai/specs/SPEC-022/implementation-plans/commit-1-27-user-acceptance.md) |
| **C28** | Frontend | Payment Selection UI + **Split Payment Logic** |
| **C28b** | Frontend | Checkout Execution & Feedback |
| **A-P9** | Acceptance | [Payment & Completion](file:///Users/maciejgren/Documents/OM/.ai/specs/SPEC-022/implementation-plans/commit-1-28b-user-acceptance.md) |
| **C29** | Frontend | `PosReceiptDialog` & Session Reports |
| **A-P13** | Acceptance | [Receipts & Reporting](file:///Users/maciejgren/Documents/OM/.ai/specs/SPEC-022/implementation-plans/commit-1-29-user-acceptance.md) |
| **C30** | Frontend | **Full Flow Integration Tests** (Verify Sequence Diagrams) |
