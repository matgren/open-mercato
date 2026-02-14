# POS Implementation Gap Analysis

This document outlines the gaps between our recent research (Workflows, User Stories) and the existing implementation plan (`roadmap.md`).

## 1. Security: Auto-Lock (Idle Timer)
*   **Gap**: The roadmap does not explicitly list the "Idle Auto-Lock" feature.
*   **Recommendation**: Add to **C24 (PosCheckoutPage)** or **C23b (Session UI)**.
*   **Task**: Implement `useIdleTimer` hook and "Soft Lock" UI overlay (PIN pad).

## 2. Visual Browsing: Category Tabs
*   **Gap**: **C25** lists `PosProductGrid` but omits the `PosCategoryTabs` component defined in **SPEC-022a**.
*   **Recommendation**: Update **C25** scope to include `PosCategoryTabs` and the category filtering logic.

## 3. Complex Products: Weighted Barcodes
*   **Gap**: **C26** mentions "Barcode Support" but doesn't specify the complex "Embedded Weight" parsing logic (Prefix `21`).
*   **Recommendation**: Explicitly add `BarcodeParser` service implementation to **C26**.

## 4. Payment: Split Payments & Remaining Due
*   **Gap**: **C28** ("Payment Selection UI") is generic.
*   **Recommendation**: Explicitly require "Remaining Due" calculation and "Split Payment" flow in **C28**.

## Proposed Roadmap Updates

| Commit | Existing Description | Proposed Update |
| :--- | :--- | :--- |
| **C24** | `PosCheckoutPage` Layout Skeleton | Layout Skeleton + **Idle Auto-Lock Hook** |
| **C25** | `PosProductGrid` Components | Product Grid + **Category Tabs Component** |
| **C26** | `PosProductSearch` & Barcode Support | Search + **Weighted Barcode Parser Service** |
| **C28** | Payment Selection UI | Payment UI + **Split Payment Logic** |
