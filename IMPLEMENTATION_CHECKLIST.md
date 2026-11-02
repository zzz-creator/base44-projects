# Local (MSSQL) Runbook & Checklist

**Last updated:** 11 October 2026
Companion to `MIGRATION_COMPLETE.md`. This is the operational checklist for
running each app locally against MSSQL.

## 1. One-time database setup (manual — the assistant must not run DDL)

For each project, create its database and apply the schema by hand:

```sql
CREATE DATABASE astrosim;          -- hotelops, kwanpro, nuclear_launch_sim,
                                   -- omnipos, opsgrid, prodintel, warmatrix
```

Then run that project's `backend/schema.sql` against its database (SQLTools in
`Base44.code-workspace`, or `sqlcmd -S localhost -U admin -P admin -d <db> -i backend/schema.sql`).

- [x] AstroSim Nexus → `astrosim` (verified 2026-11-01: schema applied, /api/health ok, auth register+login round-trip with bcrypt hashing passed)
- [x] KwanPro → `kwanpro` (verified 2026-11-01)
- [x] Nuclear Launch Sim → `nuclear_launch_sim` (verified 2026-11-01; seeded admin password migrated to bcrypt hash)
- [x] OmniPOS Core → `omnipos` (verified 2026-11-01)
- [x] OpsGrid → `opsgrid` (verified 2026-11-01)
- [x] ProdIntel StageOps → `prodintel` (verified 2026-11-01)
- [x] War Matrix → `warmatrix` (verified 2026-11-01)

Each schema creates every entity table plus a `Users` table (`id`, `email`,
`password_hash`, `full_name`, `role`, `created_date`, `updated_date`).

## 2. Configuration

- [ ] `backend/.env` exists in each project (created with `localhost/admin` and
      that project's `DB_NAME`). Fill `GEMINI_API_KEY` if you want server-side LLM calls.
- [ ] Root `<Project>/.env` holds `VITE_API_URL=http://localhost:3001` and
      `VITE_GEMINI_API_KEY=<key>` if the frontend should call Gemini directly.
- [ ] `.env` files are gitignored; `backend/.env.example` (blank secrets) is trackable.

## 3. Install & run

```bash
cd "<Project>"
npm install
cd backend && npm install && cd ..
npm run dev          # concurrently: vite  +  node backend/server.js
```

Backend alone: `node backend/server.js` from the project root.

## 4. Functional checks (per project)

- [ ] `GET http://localhost:3001/api/health` → `{ "status": "ok" }`
- [ ] App boots in the browser with no `@base44` errors in the console.
- [ ] Network tab shows entity calls to `http://localhost:3001/api/...`.
- [ ] List / create / update / delete round-trips against MSSQL.
- [ ] `filter(...)` works (uses the backend `/filter` endpoint).
- [ ] LLM calls resolve (direct Gemini or the backend fallback).

## 5. Automated checks

```bash
# from C:\Users\mrkee\Documents\Opencode\HTML\Base44
node test-all-projects.mjs        # client contract, 8/8 expected
```

Per project: `npm run build` (must exit 0) and `node --check backend/server.js`.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Login failed for user 'admin' | Database not created yet, or wrong `DB_NAME` in `backend/.env`. |
| ProdIntel backend exits immediately | Its `prodintel` DB is missing (fail-fast `process.exit(1)`). |
| `Cannot GET /api/...` | Backend not running, or wrong port. |
| `Invalid object name 'X'` | `schema.sql` not applied, or table/entity name mismatch. |
| 400 on `InvokeLLM` | No `GEMINI_API_KEY` on the backend and no `VITE_GEMINI_API_KEY` on the client. |

## Known pre-existing issues (not part of this migration)

- (Resolved) Lint unused-import / `no-undef` errors cleared across all 7 apps
  (War Matrix no-undef fixes: AIStrategyAdvisor, CustomScenarioBuilder,
  BranchComparisonChart).
- (Resolved) Plaintext password auth restored to bcryptjs hashing across all 7
  backends; War Matrix `resolvePasswordColumn` dual-column fallback removed.
  Auth now requires the `password_hash` column.
- (Resolved) Dead code removed: `localApiClient.jsx` (AstroSim, ProdIntel),
  `War Matrix/backend/routes/sas.js`, `OmniPOS Core/tmp/` scripts.
- (Resolved) Root `node_modules/` and `test-results/` added to `.gitignore`.
- (Resolved) HotelOps app removed from monorepo.
- (Resolved) `Nuclear Launch Sim` `/api/sas` route: `SASCodes` table added to
  schema.sql; route now functional.
- (Resolved) All 7 apps' DB schemas verified end-to-end against live MSSQL
  (schema applied, /api/health ok, auth register+login round-trip with bcrypt).
