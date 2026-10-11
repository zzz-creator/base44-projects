# Database-Driven Admin Authentication Plan

## Goal
Replace the hardcoded admin password ("SUPERVISOR-OMEGA-1") in the frontend with a secure(ish) database-backed authentication system.

## User Review Required
> [!IMPORTANT]
> **Plaintext Passwords**: The user explicitly requested **NOT** to hash passwords. This is a security risk in a real production environment but acceptable for this simulation/offline context.

## Proposed Changes

### Database Schema
#### [MODIFY] [SQLServerSchema.sql](file:///c:/Users/mrkee/Documents/HTML/Base44/Nuclear%20Launch%20Sim/src/components/data/SQLServerSchema.sql)
- Add `password` column to `Users` table (NVARCHAR(255)).
- Add a script to insert a default admin user if one doesn't exist.

### Backend
#### [NEW] [server/routes/auth.js](file:///c:/Users/mrkee/Documents/HTML/Base44/Nuclear%20Launch%20Sim/server/routes/auth.js)
- `POST /login`: Accepts `{ email, password }`.
  - Queries `Users` table.
  - Checks if password matches (plaintext).
  - Returns `{ success: true, user: { ... } }` or error.

#### [MODIFY] [server/index.js](file:///c:/Users/mrkee/Documents/HTML/Base44/Nuclear%20Launch%20Sim/server/index.js)
- Register `/api/auth` route.

### Frontend
#### [MODIFY] [src/pages/Simulator.jsx](file:///c:/Users/mrkee/Documents/HTML/Base44/Nuclear%20Launch%20Sim/src/pages/Simulator.jsx)
- Remove `adminPassword` state.
- Update `authenticateAdmin` to call `/api/auth/login`.
- Handle login success/failure based on API response.
- Remove "Change Admin Password" prompt on startup (since it's now DB-managed).

## Verification Plan
### Automated Tests
- None planned for this phase.

### Manual Verification
1.  **Seed DB**: Run the SQL script to add the password column and default user.
2.  **Test Login**:
    - Try logging in with random credentials (should fail).
    - Log in with the seeded admin credentials (should succeed).
3.  **Check Logs**: Verify "LOGIN" action is logged in `AdminAuditLog` (frontend already does this, but we'll ensure the flow is preserved).
