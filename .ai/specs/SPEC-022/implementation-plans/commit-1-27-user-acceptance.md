# Acceptance Event: terminal Entry (P3, P4, P5, P6)

## Goal
Verify the core POS terminal interface for item selection, overrides, and discounting.

## User Stories Covered
- **P3**: Cashier starts new cart for customer transaction.
- **P4**: Cashier scans/searches and adds items to cart.
- **P5**: Cashier applies price override with reason.
- **P6**: Cashier enters line or cart discount.

## Verification Steps
1. Open the POS Checkout interface (`/backend/pos/checkout`).
2. Verify a new cart is automatically initialized for the open session.
3. Use the search/scan bar to add multiple products to the cart.
4. Use the Tile Grid to add a product by category.
5. Apply a price override to a line item and provide a mandatory reason.
6. Add a percentage or fixed amount discount to a specific line.
7. Add a cart-level discount and verify totals recalculate correctly.
8. **Manual Review**: Perform a "stress test" by adding 50+ items to the cart to verify UI performance and responsiveness of the total calculations.
