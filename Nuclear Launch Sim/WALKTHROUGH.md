# MS SQL Server Integration Walkthrough

## Overview
We have successfully integrated a Node.js backend to connect your React frontend with an MS SQL Server database.

## Prerequisites
- MS SQL Server instance running and accessible.
- Database named `StrategicCommandSimulator` (or update `.env` to match yours).
- Node.js installed.

## Setup Instructions

### 1. Configure Database Credentials
1.  Navigate to the `server` directory: `cd server`
2.  Open `.env` file (created from `.env.example`).
3.  Update the `DB_USER`, `DB_PASSWORD`, and `DB_SERVER` with your actual SQL Server credentials.

```env
DB_USER=sa
DB_PASSWORD=your_strong_password
DB_SERVER=localhost
DB_DATABASE=StrategicCommandSimulator
PORT=3001
```

### 2. Install Dependencies
In the root directory, run:
```bash
npm install
cd server
npm install
cd ..
```

### 3. Start the Application
In the root directory, run:
```bash
npm run dev
```
This command will start both the backend server and the frontend application concurrently.
You should see output from both services in your terminal.

## Architecture Change
- **Before**: Frontend -> `localStorage` (Mock)
- **After**: Frontend -> `/api` (Vite Proxy) -> Node.js Express Server -> MS SQL Server

## Troubleshooting
- **Connection Failed**: Check your `.env` credentials and ensure TCP/IP is enabled in SQL Server Configuration Manager.
- **CORS Error**: Should not happen due to Vite proxy, but ensure `cors` is enabled in `server/index.js` (it is).
