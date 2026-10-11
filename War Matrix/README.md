# War Matrix

A local application for analyzing and tracking military conflicts across different eras (past, current, and future).

## About

This project contains everything you need to run the War Matrix application locally on your own server without any external dependencies.

## Prerequisites

1. Node.js (v16 or higher)
2. npm or yarn
3. A local server setup (Express.js backend is included)

## Setup Instructions

### Frontend Setup

1. Navigate to the project directory
2. Install dependencies: `npm install`
3. Make sure your backend server is running on `http://localhost:3001`

### Backend Setup

The backend API server is required to run the application locally.

1. Ensure the backend directory has all required dependencies installed
2. Configure your database connection in `backend/.env` (see `backend/.env.example`)
3. Start the backend server (`node backend/server.js`)

## Running the Application

### Development Mode

```bash
# Start both frontend and backend
npm run dev
```

Or run separately in different terminals:

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend  
node backend/server.js
```

### Production Build

```bash
npm run build
```

## Project Structure

- `/src` - Frontend React application
- `/backend` - Backend Express API server
- `/entities` - Data entity definitions

## Environment Variables

No Base44 specific environment variables are required. The application communicates with your local API server running on `http://localhost:3001`.

## Local Server Architecture

The frontend communicates with your local backend API via:
- Entity CRUD operations: `/api/entities/{entityName}`
- Integrations: `/api/integrations/{integrationName}`
- Authentication: `/api/auth/`

All requests are directed to `http://localhost:3001` for local-only operation.

## Support

For help with the application, check the source code or review the server/client implementations.
