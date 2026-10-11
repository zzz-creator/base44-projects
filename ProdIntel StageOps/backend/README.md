# ProdIntel StageOps – Offline Backend Setup

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14

---

## Quick Setup

### 1. Set up PostgreSQL database

```bash
# Create the database
createdb -U postgres prodintel

# Apply the schema (creates all tables + default admin user)
psql -U postgres -d prodintel -f schema.sql
```

Default admin credentials (change after first login):
- Email: `admin@prodintel.local`
- Password: `admin123`

---

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

---

### 3. Install dependencies & start server

```bash
npm install
npm start
# or for development with auto-reload:
npm run dev
```

Server runs on **http://localhost:3001**

---

### 4. Configure frontend

Copy `.env.example` from the project root to `.env` (or `.env.local`) and set:

```env
VITE_API_URL=http://localhost:3001
VITE_OFFLINE_MODE=true
```

Then in the project root run:

```bash
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Login → returns JWT token |
| `POST` | `/api/auth/register` | Register new user |
| `GET` | `/api/auth/me` | Get current user |
| `PUT` | `/api/auth/me` | Update current user |
| `GET` | `/api/entities/:Entity` | List records |
| `GET` | `/api/entities/:Entity/:id` | Get single record |
| `POST` | `/api/entities/:Entity/filter` | Filter records |
| `POST` | `/api/entities/:Entity` | Create record |
| `PUT` | `/api/entities/:Entity/:id` | Update record |
| `DELETE` | `/api/entities/:Entity/:id` | Delete record |
| `GET` | `/health` | Health check |

### Supported Entity names

`Production`, `ProductionTemplate`, `Venue`, `CrewMember`, `CrewAssignment`,
`CrewOnboarding`, `TaskChecklist`, `IncidentLog`, `Budget`, `BudgetExpense`,
`EquipmentAsset`, `MaintenanceRecord`, `UsageMetrics`, `EquipmentSchedule`,
`AssetLocation`, `KnowledgeRecord`, `CueDocumentation`, `ProcedureLibrary`,
`AutomationRule`, `TriggerCondition`, `WorkflowAction`, `ExecutionLog`,
`HistoricalIncidentAnalysis`, `ActivityLog`, `AuditLog`, `Comment`,
`Notification`, `NotificationPreference`, `Announcement`, `Conversation`,
`Message`, `User`

---

## Switching between online (base44) and offline mode

In the **project root**, the file `components/api/localApiClient.js` provides a
drop-in replacement for the base44 SDK client with the exact same interface.

When `VITE_OFFLINE_MODE=true` is set, the app automatically uses the local
backend. When unset or false, it uses the base44 cloud backend.

The switcher is in `components/api/apiClientSwitcher.js`.

---

## Creating additional users

```bash
# Via API (with admin token)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","full_name":"Jane Smith","role":"user"}'
``