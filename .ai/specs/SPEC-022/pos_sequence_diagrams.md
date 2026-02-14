# POS Phase 1 Sequence Diagrams

## 1. Checkout Transaction (Online / Split Payment)

This flow illustrates a complex transaction with a "Split Payment" (Cash + Card) and how it creates the Sales Order in a transactional manner.

```mermaid
sequenceDiagram
    actor Cashier
    participant UI as POS UI
    participant API as POS API
    participant Sales as Sales Module
    participant DB as Database

    Note over Cashier, UI: Cart Total: $100.00
    
    Cashier->>UI: Select "Cash" -> Enter $40.00
    UI->>API: POST /pos/payments (amount: 40)
    API->>DB: Save PosPayment (Authorized)
    API-->>UI: 200 OK (Remaining: $60.00)
    
    Cashier->>UI: Select "Card" -> Enter $60.00
    UI->>API: POST /pos/payments (amount: 60)
    API->>DB: Save PosPayment (Authorized)
    API-->>UI: 200 OK (Remaining: $0.00)
    
    Note over UI: "Complete" button becomes active
    
    Cashier->>UI: Press "Complete Transaction"
    UI->>API: POST /pos/carts/:id/complete
    
    activate API
    API->>DB: Load Cart & Payments
    API->>API: Verify Paid Amount >= Grand Total
    
    rect rgb(240, 240, 240)
        note right of API: Atomic App Transaction
        API->>Sales: Create SalesOrder (Channel: 'pos')
        Sales-->>API: Return OrderID
        
        loop For each Payment
            API->>Sales: Create SalesPayment (linked to Order)
        end
        
        API->>DB: Update PosCart (status: completed)
        API->>DB: Update PosPayments (status: captured)
    end
    
    API-->>UI: 200 OK (Order Payload)
    deactivate API
    
    UI->>UI: Print Receipt
    UI->>UI: Clear Cart / New Customer
```

## 2. Session Reconciliation (Blind Count)

This flow shows the "Blind Count" security feature inspired by industry standards, ensuring the cashier counts the money *before* seeing what the system expects.

```mermaid
sequenceDiagram
    actor Cashier
    participant UI as POS UI
    participant API as POS API
    participant DB as Database

    Cashier->>UI: Click "Close Session"
    UI->>API: GET /pos/sessions/:id/details
    API-->>UI: Return OpeningFloat + CashMovements
    
    Note over UI: UI calculates "Expected", but HIDES it.
    
    UI->>UI: Show "Closing Count" Form
    Cashier->>UI: Enter Counted Cash ($502.50)
    
    UI->>API: POST /pos/sessions/:id/close
    Note right of UI: Payload: { closingCashAmount: 502.50 }
    
    activate API
    API->>DB: Load Session & Sales
    API->>API: Calculate System Expected ($500.00)
    API->>API: Calculate Variance (+$2.50)
    
    API->>DB: Update PosSession (Closed, Variance recorded)
    API-->>UI: 200 OK (Variance Details)
    deactivate API
    
    alt Variance Exists
        UI->>UI: Show Variance Warning (Excess +$2.50)
    end
    
    UI->>UI: Show Session Summary Report
    UI->>UI: Print Z-Report
    UI->>UI: Redirect to Register Select
```

## 3. Visual Product Browsing (Category & Tiles)

This flow, defined in **SPEC-022a**, ensures we handle graphical browsing efficiently without overloading the client.

```mermaid
sequenceDiagram
    actor Cashier
    participant UI as POS UI
    participant CatAPI as /api/catalog/product-categories
    participant ProdAPI as /api/catalog/products
    participant DB as Database

    Note over UI: 1. Initial Page Load
    UI->>CatAPI: GET ?parentId=null&isActive=true
    CatAPI-->>UI: Return Root Categories (e.g., Drinks, Food)
    
    UI->>ProdAPI: GET ?categoryId=ALL&limit=20
    ProdAPI-->>UI: Return First 20 Products
    
    Note over UI: Cashier sees "Drinks" tab & Grid
    
    Note over UI: 2. Category Drill-down
    Cashier->>UI: Taps "Food" Tab
    UI->>ProdAPI: GET ?categoryId={food_id}&limit=20&offset=0
    ProdAPI->>DB: Query by Category Path
    ProdAPI-->>UI: Return 20 "Food" items
    
    UI->>UI: Replace Grid Content
    
    Note over UI: 3. Lazy Loading
    Cashier->>UI: Scrolls to bottom / "Load More"
    UI->>ProdAPI: GET ?categoryId={food_id}&limit=20&offset=20
    ProdAPI-->>UI: Return Next 20 "Food" items
    UI->>UI: Append to Grid
```

