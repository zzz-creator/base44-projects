# Space Logistics — Local Backend

A minimal Express + SQLite REST server that replaces the Base44 cloud backend
so the entire app runs **completely offline**.

---

## Quick Start

### 1. Copy server files

```
project-root/
├── src/               ← React app
├── server/            ← copy this backend/ folder here
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── .env.example
├── .env               ← frontend env vars
└── package.json       ← frontend
```

### 2. Install & start the backend

```bash
cd server
npm install
node server.js          # or: npm run dev  (auto-restart via node --watch)
```

The API will start at **http://localhost:3001**

### 3. Configure the frontend

Create a `.env` file in the **project root** (next to the frontend `package.json`):

```
VITE_API_URL=http://localhost:3001
```

### 4. Switch the frontend to local mode

In `src/api/base44Client.js` (or wherever base44 is re-exported), replace the
import with `localApiClient.js`:

```js
// change this line in any file that imports base44Client:
import { base44 } from '../api/base44Client';
// to:
import { base44 } from '../components/localApiClient';
```

Or — if you keep `api/base44Client.js` as a thin wrapper — just point it at
`localApiClient.js` for offline builds.

### 5. Start the frontend

```bash
npm install   # if not done yet
npm run dev
```

Open http://localhost:5173 — everything works offline now.

---

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/:entity` | List all records (sorted, limited) |
| POST | `/api/:entity/filter` | Filter by query object |
| POST | `/api/:entity` | Create one record |
| POST | `/api/:entity/bulk` | Bulk create |
| PUT | `/api/:entity/:id` | Update (merge patch) |
| DELETE | `/api/:entity/:id` | Delete one record |
| GET | `/health` | Health check |

Query params: `sort=-created_date`, `limit=200`

---

## Database

Data is stored in `server/space-logistics.db` (SQLite).  
Back it up by copying that file.  
Change the path via the `DB_PATH` environment variable.