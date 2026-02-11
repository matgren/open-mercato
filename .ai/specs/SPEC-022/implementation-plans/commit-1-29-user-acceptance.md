# Acceptance Event: Receipts & Reporting (P10, P13, P14)

## Goal
Verify receipt issuance and end-of-day reporting capabilities.

## User Stories Covered
- **P10**: Cashier prints or emails receipt to customer.
- **P13**: Manager reviews session sales and variance.
- **P14**: User filters orders by POS channel in Sales module.

## Verification Steps
1. After a completed checkout, trigger a "Print Receipt" action.
2. Verify the receipt captures the cart items, taxes, and payment details accurately.
3. Trigger an "Email Receipt" and verify the recipient input.
4. Navigate to the Session Report page for a closed session.
5. Verify the sales summary, payment breakdown, and variance reports match transaction data.
6. Navigate to the Sales Order list and filter by "POS" channel to verify Story P14.
7. **Manual Review**: Open the generated receipt HTML/Snapshot and verify brand alignment, logo visibility, and legibility of legal/tax information.
