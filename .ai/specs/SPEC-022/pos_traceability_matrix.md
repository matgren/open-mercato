# POS Requirements Traceability Matrix

This document maps requirements (User Stories, Sequence Diagrams) to the Implementation Roadmap (Commits).
Use this matrix to verify that every requirement is covered by a specific implementation step.

## 1. User Stories vs. Commits

| ID | User Story | Phase | Target Commit | Verification Type |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | Open Session (Count Float) | P1 | **C23b** (UI), **C08** (API) | Manual / E2E |
| **US-02** | Close Session (Blind Count) | P1 | **C23b** (UI), **C08** (API) | Manual (Variance Test) |
| **US-03** | Cash In / Cash Out | P1 | **C11** (API), **C23b** (UI) | Unit / Integration |
| **US-04** | Scan Barcode (Instant Add) | P1 | **C26** (Frontend) | E2E (Hid) |
| **US-05** | Visual Browsing (Category) | P1 | **C25** (Grid + Tabs) | Manual |
| **US-06** | Weighted Product Scan | P1 | **C26** (Parser Service) | Unit (Parser) |
| **US-07** | Search by Name | P1 | **C26** (Search Box) | E2E |
| **US-08** | Change Quantity (Numpad) | P1 | **C27** (Cart Panel) | Unit |
| **US-09** | Price Override | P1 | **C27** (Cart Panel) | Unit |
| **US-10** | Cash Payment (Change Due) | P1 | **C28** (Payment UI) | Unit |
| **US-11** | Split Payment (Cash+Card) | P1 | **C28** (UI), **C28b** (Logic) | Integration |
| **US-12** | Info on Receipt (Email/Print) | P1 | **C29** (Receipt API) | Manual |
| **US-13** | Customer Selection | P1 | **C24** (Layout), **C28b** | E2E |
| **US-SEC** | Auto-Lock (Idle Timer) | P1 | **C24** (Layout Hook) | Manual |

## 2. Sequence Diagrams vs. Commits

| Diagram | Key Logic / Flow | Target Commit | Verified By |
| :--- | :--- | :--- | :--- |
| **Checkout Transaction** | Atomic Order + Payment Creation | **C28b** (Logic), **C30** (Full Flow) | Integration Test (Jest/RTL) |
| **Session Reconciliation** | Blind Count & Variance Calculation | **C08** (Backend), **C30** (Full Flow) | Unit + Integration Test |
| **Visual Browsing** | Category Tabs & Lazy Loading | **C25** (Components), **C30** (Full Flow) | Integration Test |

## 3. Gap Verification Strategy

When implementing a Commit (e.g., **C26**), the Agent MUST:
1.  Check this matrix for mapped Stories (e.g., US-04, US-06, US-07).
2.  Copy the *specific acceptance criteria* of those stories into the `C26.md` Implementation Plan.
3.  Ensure the "Verification" section of `C26.md` explicitly tests those criteria.
