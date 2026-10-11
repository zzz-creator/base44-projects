# Base44 → Local (MSSQL) Migration — Status

**Last updated:** 11 October 2026
**Status:** All 8 projects normalised onto the local MSSQL backend architecture.
Workflow applied: `docs/base44-to-local.md`.

> Supersedes the February 2026 summary. The old blanket claim that everything was
> "complete" was true only for the frontend import removal; the backends, env and
> schema work was finished in this pass.

## Projects

| Project | DB name | Entity routes | Backend entry |
|---|---|---|---|
| AstroSim Nexus | `astrosim` | `/api/:entity` | `backend/server.js` |
| HotelOps | `hotelops` | `/api/:entity` | `backend/server.js` |
| KwanPro | `kwanpro` | `/api/entities/:entity` | `backend/server.js` |
| Nuclear Launch Sim | `nuclear_launch_sim` | `/api/entities/:entity` | `backend/server.js` |
| OmniPOS Core | `omnipos` | `/api/entities/:entity` | `backend/server.js` |
| OpsGrid | `opsgrid` | `/api/entities/:entity` | `backend/server.js` |
| ProdIntel StageOps | `prodintel` | `/api/entities/:entity` | `backend/server.js` |
| War Matrix | `warmatrix` | `/api/entities/:entity` | `backend/server.js` |

## Standard layout (per project)

```
<P>/backend/server.js        Express entry (all /api routes)
<P>/backend/db.js            mssql pool, loads backend/.env explicitly
<P>/backend/schema.sql       hand-written from <P>/entities/*  (apply manually)
<P>/backend/.env             DB + JWT + Gemini secrets (untracked)
<P>/backend/.env.example     same keys, blank secrets (commit this)
<P>/.env                     VITE_API_URL, VITE_GEMINI_API_KEY (Vite reads here)
<P>/src/api/base44-local-client.js   canonical local client
<P>/src/api/base44Client.js          re-exports it as `base44`
<P>/src/lib/AuthContext.jsx          canonical local auth provider
```

## Canonical API surface (every backend)

- `GET /api/health`
- `GET /api/entities/:entity` · `GET /api/entities/:entity/:id`
- `POST /api/entities/:entity` · `PUT /api/entities/:entity/:id` · `DELETE /api/entities/:entity/:id`
- `POST /api/entities/:entity/filter` · `POST /api/entities/:entity/bulk`
- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` · `PUT /api/auth/me` · `POST /api/auth/logout`
- `POST /api/integrations/Core/InvokeLLM` · `POST /api/integrations/Core/UploadFile`
- `POST /api/logs/user-app-logs`

## Client contract

`src/api/base44-local-client.js` implements the real Base44 SDK signatures:

```js
await base44.entities.War.list('-created_date', 100);
await base44.entities.War.filter({ status: 'active' }, '-created_date', 10);
await base44.entities.War.get(id);
await base44.entities.War.create(data);
await base44.entities.War.update(id, data);
await base44.entities.War.delete(id);
await base44.entities.War.bulkCreate(items);

await base44.auth.me();
await base44.integrations.Core.InvokeLLM({ prompt: '...' });
await base44.appLogs.logUserInApp('Dashboard');
```

**Offline dev auth:** these apps have no `/login` route (they were built around
Base44's hosted auth), so when no `auth_token` is present the client returns a
local admin (`dev@localhost.com`) instead of hard-failing. Real backend auth is
still used whenever a token exists.

**Gemini:** if `VITE_GEMINI_API_KEY` is set the client calls Gemini directly;
otherwise `InvokeLLM` falls back to `POST /api/integrations/Core/InvokeLLM`.

## Running a project

```bash
cd "<Project>"
npm install                      # frontend + tooling
cd backend && npm install && cd ..   # backend deps (express, mssql, ...)
# one-time: create the database and apply backend/schema.sql (see below)
npm run dev                      # vite + node backend/server.js
```

`backend/schema.sql` is **not** applied automatically — per the workflow the user
applies it to MSSQL. The workspace SQLTools config targets `localhost:1433`
(`admin`/`admin`, `trustServerCertificate: true`).

## Verification performed (11 Oct 2026)

- `npm run build` → exit 0 for all 8 projects.
- `node --check` → clean for every `backend/server.js`, `backend/db.js`, and route file.
- `node test-all-projects.mjs` → **8/8 passed** (client contract: Base44 list/filter
  signatures, entity proxy, dev-auth fallback, backend LLM routing).
- Backend boot smoke test → `/api/health` returned `{"status":"ok"}` for the projects
  whose database already exists (AstroSim, HotelOps, KwanPro, OmniPOS, OpsGrid,
  War Matrix, Nuclear). ProdIntel fails fast (`process.exit(1)`) when its `prodintel`
  database is absent; pointed at an existing database it boots and serves normally.
- No real `@base44/*` imports remain anywhere under any `src/`.

## Not verified / outstanding

- No `schema.sql` was applied and no DB DDL was run — runtime CRUD/auth was not
  exercised against MSSQL beyond the `/api/health` boot check.
- Lint reports pre-existing `unused-imports` (and a few `no-undef`) errors in frontend
  files unrelated to this migration. They were left untouched.
- War Matrix auth still stores a plaintext `password` fallback column (pre-existing);
  flagged as a security issue, not changed.
- War Matrix `backend/seed.sql` and `backend/scripts/migrate_auth.js` predate the new
  schema and need updating before use. `backend/routes/sas.js` references a `SASCodes`
  table not in `schema.sql` (pre-existing).
