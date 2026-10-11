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

- [ ] AstroSim Nexus → `astrosim`
- [ ] HotelOps → `hotelops`
- [ ] KwanPro → `kwanpro`
- [ ] Nuclear Launch Sim → `nuclear_launch_sim`
- [ ] OmniPOS Core → `omnipos`
- [ ] OpsGrid → `opsgrid`
- [ ] ProdIntel StageOps → `prodintel`
- [ ] War Matrix → `warmatrix`

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

- Lint: unused-import errors across frontend files; a few `no-undef` bugs in
  War Matrix components.
- War Matrix: plaintext `password` auth fallback, stale `seed.sql` /
  `scripts/migrate_auth.js`, `routes/sas.js` references an absent `SASCodes` table.
- Dead code left in place: `AstroSim Nexus/src/components/localApiClient.jsx`,
  `ProdIntel StageOps/src/components/api/localApiClient.jsx`, and `tmp/` scripts
  in OmniPOS Core.
