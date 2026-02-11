# Acceptance Event: Payment & Completion (P7, P8, P9)

## Goal
Verify the multi-payment checkout flow and successful conversion to Sales documents.

## User Stories Covered
- **P7**: Cashier records cash or card payment.
- **P8**: Cashier accepts multiple payment methods (Split Payment).
- **P9**: Cart finalized, SalesOrder created, receipt issued.

## Verification Steps
1. From an active cart, click "Pay".
2. Record a partial payment using "Card".
3. Record the remaining balance using "Cash".
4. Enter an over-payment in cash and verify change is calculated correctly.
5. Click "Complete Checkout" and verify the success screen.
6. In the **Sales** module, verify that a new `SalesOrder` and `SalesPayment` records were created with the "POS" channel.
7. Verify the order metadata contains the POS Register and Session IDs.
8. **Manual Review**: Manually reconcile the total payments against the SalesOrder grand total to ensure no "penny rounding" issues occurred during split payment calculation.
