# API Acceptance Event: Session Lifecycle (P2)

## Goal
Verify the functional implementation of Session lifecycle via API.

## User Stories Covered
- **P2**: Cashier opens session with opening float amount.

## Verification Steps (Terminal/cURL)
1. **Open Session**:
   ```bash
   curl -X POST /api/pos/sessions/open -d '{"registerId": "...", "openingFloat": 100.00}'
   ```
2. **Check Status**:
   ```bash
   curl -X GET /api/pos/sessions/active
   ```
3. **Verify Persistence**: Check the `pos_sessions` database table to ensure the `openedAt` and `openingFloat` fields are set correctly.
4. **Manual Review**: Manually inspect the `ActionLog` for the session opening event to verify the user identity and timestamp accuracy.
