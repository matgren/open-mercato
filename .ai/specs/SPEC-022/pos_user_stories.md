# POS User Stories (Cashier Persona)

This document lists the specific user stories a Cashier can perform in Open Mercato POS.
Legend:
*   [P1] = Phase 1 Critical (MVP for Open Mercato)
*   [P2] = Phase 2 (Enhancement)
*   [P3] = Phase 3 (Advanced/Offline)
*   [Standard Feature] = Standard retail feature to replicate

## 1. Session Management
*   **As a Cashier**, I want to **open a new session** by counting the physical cash drawer and entering the *Opening Float*, so that I am accountable for the money at the start. [P1]
*   **As a Cashier**, I want to **close my session** by performing a "Blind Count" of the drawer (entering totals without seeing the expected amount), so that the system can record any variance/theft. [P1] [Standard Feature]
*   **As a Cashier**, I want to **withdraw cash (Cash Out)** for specific reasons (e.g., "Buying cleaning supplies", "Dropping cash to safe"), so that the drawer balance remains accurate. [P1]
*   **As a Cashier**, I want to **add cash (Cash In)** to replenish change, so that I can continue trading. [P1]

## 2. Fast Checkout & Cart
*   **As a Cashier**, I want to **scan a product barcode** using a physical scanner, so that it is added to the cart instantly without manual search. [P1]
*   **As a Cashier**, I want to **visually browse products by category** (e.g., tap "Drinks", see tiles of Soda), so that I can quickly find items without barcodes (like pastries or fruits). [P1] [SPEC-022a]
*   **As a Cashier**, I want to **scan a "Weighted Product" label** (e.g., from a deli scale), so that the system automatically parses the item ID and weight/price. [P1]
*   **As a Cashier**, I want to **search for a product by name** (e.g., "shirt"), so that I can find items with damaged barcodes. [P1]
*   **As a Cashier**, I want to **hold/save an order** (Draft) to serve another customer, and **resume it later**, so that a line doesn't form while one customer forgets their wallet. [P2] [Standard Feature]
*   **As a Cashier**, I want to **change the quantity** of a line item using a virtual numpad, so that I don't have to scan the same item 10 times. [P1]
*   **As a Cashier**, I want to **override a price** (if allowed), entering a reason, so that I can honor a shelf price error. [P1]

## 3. Payment Processing
*   **As a Cashier**, I want to **process a standard cash payment** and see the *Change Due* immediately. [P1]
*   **As a Cashier**, I want to **split a payment** by entering the cash amount first, then charging the remainder to a card, so that flexible payments are supported. [P1]
*   **As a Cashier**, I want to **invoice a customer** (Pay later), so that trusted B2B clients can pay monthly (Customer Account). [P2]

## 4. Customer & Receipt
*   **As a Cashier**, I want to **select an existing customer** or **create a new one** quickly during checkout, so that the sale is linked to their history. [P1]
*   **As a Cashier**, I want to **email the receipt** to the customer instead of printing it, so that we save paper. [P1]
*   **As a Cashier**, I want to **reprint a past receipt** from the order history, so that a customer can get a copy for expenses. [P1]

## 5. Refunds & Returns
*   **As a Cashier**, I want to **search for a past order** and select specific items to **Refund**, so that inventory is restocked and the customer gets their money back. [P2] [Standard Feature]
