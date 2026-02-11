# Acceptance Event: Register Management (P1)

## Goal
Verify that administrators can fully manage POS registers.

## User Stories Covered
- **P1**: Manager creates register for checkout station.

## Verification Steps
1. Navigate to `/backend/pos/registers`.
2. Click "Create Register".
3. Fill in name, code, and optional warehouse.
4. Save and verify the register appears in the list.
5. Update the register name and verify the change.
6. Verify the operation is recorded in the Action Log / Version History.
7. **Manual Review**: Validate the UI layout on both desktop and mobile viewports to ensure the register form remains accessible and functional.
