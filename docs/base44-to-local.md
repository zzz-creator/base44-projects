---
description: Workflow for migrating Base44 sandbox projects to a local environment with MSSQL.
---

# Base44 to Local Workflow

**Updated 11 October 2026 — reflects the live configuration after all 8 projects were
normalised onto the `backend/` layout.**

This workflow guides the process of extracting data from the Base44 platform and migrating
it to a local development environment using MSSQL. All 8 projects in this workspace
(AstroSim Nexus, HotelOps, KwanPro, Nuclear Launch Sim, OmniPOS Core, OpsGrid,
ProdIntel StageOps, War Matrix) already follow it; the same steps apply when onboarding
a new project.

## 0. Canonical references — copy from these

| What | Where |
|---|---|
| Backend (Express + mssql) | `OpsGrid/backend/server.js` · `OpsGrid/backend/db.js` · `OpsGrid/backend/package.json` |
| Robust client | `OpsGrid/src/api/base44-local-client.js` |
| Client re-export | `OpsGrid/src/api/base44Client.js` |
| Auth provider | `OpsGrid/src/lib/AuthContext.jsx` |
| Schema | `OpsGrid/backend/schema.sql` (hand-written from `OpsGrid/entities/*`) |

## 1. Extraction from the Base44 platform (manual, once per app)

1. Open the application on the Base44 platform.
2. Open **Browser Developer Tools** (F12).
3. Go to the **Network** tab and check **Disable cache**.
4. Refresh the page.
5. Filter for a request named `files`.
6. Right-click the request → **Copy** → **Copy response**.
7. Save the response as `<Project>/base44-extract.json`.

**Tell the user to do the above and confirm the directory before continuing.**

## 2. Local processing

1. Run the extraction script from the `Base44 to Code` utility:
   ```powershell
   python run.py
   ```
2. When prompted, select the `base44-extract.json` file and a target directory.
3. Move the generated output into this workspace at `<Project>/`.

## 3. Target layout (per project, standardized)

```
<Project>/backend/server.js          Express entry, all /api routes
<Project>/backend/db.js              mssql pool; loads backend/.env explicitly
<Project>/backend/schema.sql         hand-written from <Project>/entities/*
<Project>/backend/.env               DB + JWT + Gemini secrets (untracked)
<Project>/backend/.env.example       same keys, blank values (committed)
<Project>/backend/package.json       express, mssql, cors, dotenv, bcryptjs, jsonwebtoken
<Project>/.env                       VITE_API_URL, VITE_GEMINI_API_KEY (Vite reads here)
<Project>/src/api/base44-local-client.js
<Project>/src/api/base44Client.js     re-exports the local client as `base44`
<Project>/src/lib/AuthContext.jsx     local auth provider
```

Preserve the backend's existing module system (CommonJS or ESM) — do not rewrite it.

## 4. Database migration (MSSQL — the user applies DDL, never the assistant)

1. **Create the database:**

   | Project | DB name |
   |---|---|
   | AstroSim Nexus | `astrosim` |
   | HotelOps | `hotelops` |
   | KwanPro | `kwanpro` |
   | Nuclear Launch Sim | `nuclear_launch_sim` |
   | OmniPOS Core | `omnipos` |
   | OpsGrid | `opsgrid` |
   | ProdIntel StageOps | `prodintel` |
   | War Matrix | `warmatrix` |

   ```sql
   CREATE DATABASE <dbname>;
   ```

2. **Write `backend/schema.sql` by hand** from the JSON schemas in `<Project>/entities/`
   (no generator scripts):
   - Every table: `id NVARCHAR(36) NOT NULL PRIMARY KEY`, `created_date DATETIME2 NOT NULL DEFAULT GETDATE()`, `updated_date DATETIME2 NULL`.
   - Type map: string → `NVARCHAR(255)` (use `NVARCHAR(MAX)` for description/notes/JSON-ish), number → `FLOAT`, integer → `INT`, boolean → `BIT DEFAULT 0`, `format: date`/`date-time` → `DATETIME2`, arrays → `NVARCHAR(MAX)`.
   - Add a `Users` table: `id NVARCHAR(36) PK`, `email NVARCHAR(255) UNIQUE NOT NULL`, `password_hash NVARCHAR(255) NOT NULL`, `full_name NVARCHAR(255) NULL`, `role NVARCHAR(50) DEFAULT 'user'`, `created_date`, `updated_date`.
   - Wrap each `CREATE TABLE` in `IF OBJECT_ID('<Table>', 'U') IS NULL`.
   - Table names must match the backend's `TABLE_MAP`.

3. **Apply the schema manually** (assistant must not run DB DDL):
   ```powershell
   sqlcmd -S localhost -U admin -P admin -d <dbname> -i backend/schema.sql
   ```

## 5. Backend configuration

Standard env (all projects except War Matrix and Nuclear Launch Sim):

```env
PORT=3001
DB_TYPE=mssql
DB_HOST=localhost
DB_PORT=1433
DB_NAME=<dbname>
DB_USER=admin
DB_PASS=admin
JWT_SECRET=<project>-local-dev-secret
GEMINI_API_KEY=
```

War Matrix and Nuclear Launch Sim use a different key set (their backends read these names):

```env
DB_TYPE=mssql
DB_USER=admin
DB_PASSWORD=admin
DB_SERVER=localhost
DB_DATABASE=<dbname>
PORT=3001
JWT_SECRET=<project>-local-dev-secret
GEMINI_API_KEY=
```

Root `<Project>/.env` (Vite):

```env
VITE_API_URL=http://localhost:3001
VITE_GEMINI_API_KEY=
```

AstroSim Nexus, HotelOps and ProdIntel StageOps also read `backend/config.json`
(`DatabaseMode.LocalSQLConnectionString`, plus `Auth.JWT_SECRET` for the first two).
Copy `backend/config.example.json` → `backend/config.json` and fill in the
connection string and secret.

## 6. Backend API surface (every project)

- `GET /api/health`
- Entity CRUD: `GET /api[/entities]/:entity` · `GET|PUT|DELETE /api[/entities]/:entity/:id` · `POST /api[/entities]/:entity`
- `POST /api[/entities]/:entity/filter` · `POST /api[/entities]/:entity/bulk`
- Auth: `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` · `PUT /api/auth/me` · `POST /api/auth/logout`
- Integrations: `POST /api/integrations/Core/InvokeLLM` · `POST /api/integrations/Core/UploadFile`
- Logs: `POST /api/logs/user-app-logs`

Entity route prefix per project — set the client's `SDK_CONFIG.entityPathPrefix` to match:

| Prefix | Projects |
|---|---|
| `/entities` (`/api/entities/:entity`) | OpsGrid, KwanPro, OmniPOS Core, War Matrix, Nuclear Launch Sim, ProdIntel StageOps |
| `''` (`/api/:entity`) | AstroSim Nexus, HotelOps |

## 7. Local client integration

1. Copy `OpsGrid/src/api/base44-local-client.js`; change only `SDK_CONFIG.tokenKey = 'auth_token'`
   and `SDK_CONFIG.entityPathPrefix` per the table above.
2. Keep the real Base44 SDK signatures:
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
   (Older clients that used `list(params)` / `filter(query, params)` were a bug — replaced.)
3. Auth: these apps have no `/login` page, so the client returns a local admin
   (`dev@localhost.com`) when no `auth_token` is present; real backend auth applies once
   a token exists. `base44.auth.updateMe` is supported via `PUT /api/auth/me`.
4. LLM: if `VITE_GEMINI_API_KEY` is set the client calls Gemini directly via
   `@google/genai`; otherwise `InvokeLLM` falls back to `POST /api/integrations/Core/InvokeLLM`.
5. Copy `OpsGrid/src/lib/AuthContext.jsx` and wire `src/api/base44Client.js` to re-export
   the local client as `base44`.

## 8. Code refactoring

1. Remove the `@base44/vite-plugin` from `vite.config.js` and `package.json` — fully,
   including `legacySDKImports`, `hmrNotifier`, `navigationNotifier`, `visualEditAgent`.
2. Remove all `@base44/*` imports from `src/` and rewrite any `@/` alias imports that
   depended on the plugin.
3. Ensure `@google/genai` is a dependency of the project root.
4. Root `package.json` dev script:
   ```json
   "dev": "node ../dev-runner.mjs"
   ```
   `../dev-runner.mjs` (shared at the workspace root, beside `test-all-projects.mjs`) picks
   the first free backend port at or above `PORT` (3001 → 3002 → …), starts
   `backend/server.js` on it, then starts Vite with `VITE_API_URL` pointed at that exact
   port — so the UI always talks to the backend that is actually running. Streams are
   labelled `[backend]` / `[frontend]`, and `vite --logLevel info` restores Vite's URL
   banner that `vite.config.js`'s `logLevel: 'error'` would otherwise swallow.
   Each backend also retries the next port itself on `EADDRINUSE`, so running one
   standalone (`cd backend; npm run dev`) is resilient too.

## 9. Verification

```powershell
cd "<Project>"
npm install
cd backend; npm install; cd ..
npm run dev                     # shared dev-runner; prints both URLs, backend falls forward 3001→3002
```

- `GET http://localhost:3001/api/health` → `{ "status": "ok" }` (use the port the launcher
  printed if 3001 was busy)
- `npm run build` exits 0; `node --check backend/server.js` is clean.
- From the workspace root: `node test-all-projects.mjs` → 8/8 passed (client contract).
- Browser network tab shows entity calls to `http://localhost:3001/api/...`;
  list/create/update/delete round-trip against MSSQL.
- Auth and LLM integrations work (direct Gemini or backend fallback).

## 10. Repo notes (current config)

- Git root: a single repository at this workspace. Remote `origin` →
  `https://github.com/zzz-creator/base44-projects.git`.
- Secrets stay untracked: `.env` files, `backend/config.json`, `.local.env`,
  `custom-sdk.js`; their `.example` twins are committed.
- The workspace test suite is `test-all-projects.mjs`; run it from the repo root.