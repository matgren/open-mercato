# API Acceptance Event: Register Management (P1)

## Goal
Verify the functional implementation of Register management via API before the UI is ready.

## User Stories Covered
- **P1**: Manager creates register for checkout station.

## Verification Steps (Terminal/cURL)
1. **Create Register**:
   ```bash
   curl -X POST /api/pos/registers -d '{"name": "Main Terminal", "code": "REG-001", "organizationId": "..."}'
   ```
2. **Retrieve List**:
   ```bash
   curl -X GET /api/pos/registers
   ```
3. **Verify Constraints**: Attempt to create a register with a duplicate code and verify the error response.
4. **Audit Check**: Verify that a new entry appears in the `action_logs` table for the creation event.
5. **Manual Review**: Verify the register record in the database using a GUI (like DBeaver or pgAdmin) to ensure all fields (name, code, organizationId, tenantId) are correctly populated and audit timestamps are present.
