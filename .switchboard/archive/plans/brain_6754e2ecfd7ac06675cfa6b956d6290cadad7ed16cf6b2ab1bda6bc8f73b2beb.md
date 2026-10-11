# Implementation Plan - KwanPro Local Migration (Base44 to MSSQL)

This plan outlines the migration of the `KwanPro` project from the Base44 platform to a local development environment using a Node backend and MSSQL database.

## User Review Required

> [!IMPORTANT]
> This migration will replace the `@base44/sdk` and `@base44/vite-plugin` with a custom local client and a Node/Express backend. Ensure you have a local MSSQL instance running and have created a database for this project.

> [!WARNING]
> Database credentials (Host, Name, User, Password) need to be configured in a `.env` file. A template will be provided.

## Proposed Changes

---

### 1. Database Schema

#### [NEW] `KwanPro/schema.sql`
A comprehensive SQL script containing `CREATE TABLE` definitions for all 12 entities (Student, Class, Attendance, etc.) found in the `entities/` directory. Each table will include an `id` column as a Primary Key (UUID/String) to maintain compatibility with the front-end logic.

---

### 2. Backend Implementation

#### [NEW] `KwanPro/backend/server.js`
A local Node/Express server that:
- Connects to MSSQL using the `mssql` package.
- Provides RESTful endpoints for CRUD operations on all entities (`/api/entities/:entityName`).
- Implements basic filtering/querying logic consistent with what the Base44 SDK expects.

#### [NEW] `KwanPro/.env`
Configuration for database connection strings and Gemini API keys.

---

### 3. Local Client & SDK Integration

#### [NEW] `KwanPro/src/api/base44-local-client.js`
A robust local client adapted from `custom-sdk.js`. This client will use standard `fetch` or `axios` to communicate with the local Node backend while maintaining the same API interface as the `@base44/sdk`.

#### [MODIFY] `KwanPro/src/api/base44Client.js`
Update to export the new `base44-local-client.js` instead of creating a client from `@base44/sdk`.

---

### 4. Build Configuration & Dependencies

#### [MODIFY] `KwanPro/vite.config.js`
Remove `@base44/vite-plugin` and associated configurations.

#### [MODIFY] `KwanPro/package.json`
- Remove `@base44/sdk` and `@base44/vite-plugin`.
- Add `mssql`, `express`, `cors`, `dotenv`.
- Add `concurrently` (dev dependency).
- Update `dev` script to `"concurrently \"vite\" \"node backend/server.js\""`.

---

### 5. Gemini AI Integration

#### [MODIFY] `KwanPro/src/api/InvokeLLM.js` (or equivalent)
Ensure `@google/genai` is initialized with the local `VITE_GEMINI_API_KEY`.

## Open Questions

- What are your preferred MSSQL credentials (Host, Database Name, User, Password)? If unspecified, I will use placeholders (`localhost`, `KwanProDB`, `sa`, etc.).

## Verification Plan

### Automated Tests
- N/A (Mostly integration/manual verification in this phase).

### Manual Verification
- Run `npm install` and `npm run dev`.
- Verify the frontend loads and fetches data from the local server.
- Verify CRUD operations (e.g., adding a new Student) persist in the local MSSQL database.
- Check "Command Dashboard" and other interactive elements.
