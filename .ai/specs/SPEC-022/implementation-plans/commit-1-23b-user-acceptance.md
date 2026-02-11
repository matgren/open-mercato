# Acceptance Event: Session Lifecycle (P2, P12)

## Goal
Verify that cashiers can open and close register sessions with proper float management.

## User Stories Covered
- **P2**: Cashier opens session with opening float amount.
- **P12**: Cashier counts drawer, records variance, and closes session.

## Verification Steps
1. Navigate to `/backend/pos/sessions`.
2. Select an active register and click "Open Session".
3. Enter an opening float amount (e.g., $100.00).
4. Verify the session status changes to "Open".
5. Click "Close Session".
6. Enter the closing cash count and verify any variance is calculated.
7. Verify the session status changes to "Closed" and total duration is recorded.
8. **Manual Review**: Confirm with the finance team that the variance calculation logic (Expected vs. Actual) aligns with store reconciliation policies.
