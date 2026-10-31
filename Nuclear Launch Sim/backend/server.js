
const express = require('express');

process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, p) => {
    console.error('UNHANDLED REJECTION:', reason);
});

const cors = require('cors');
const { poolPromise } = require('./db');
const apiRoutes = require('./routes/api');
const commsRoutes = require('./routes/comms');
const authRoutes = require('./routes/auth');
const sasRoutes = require('./routes/sas');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api', apiRoutes);
app.use('/api/comms', commsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sas', sasRoutes);

// Simple liveness probe (no DB).
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Health Check
app.get('/health', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT 1 as health');
        res.json({ status: 'ok', db: 'connected', result: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
    }
});

// Bind the first free port at or above PORT (3001, 3002, ...), like Vite does,
// so a stale instance or another project on 3001 does not abort startup.
function listenWithFallback(port, onReady) {
    port = Number(port) || 3001;
    const server = app.listen(port);
    server.on('listening', () => onReady(server.address().port));
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`Port ${port} is in use, trying ${port + 1}...`);
            server.close();
            listenWithFallback(port + 1, onReady);
        } else {
            console.error('Failed to start server:', err);
            process.exit(1);
        }
    });
}

listenWithFallback(PORT, (actualPort) => {
    console.log(`Nuclear Launch Sim backend running on http://localhost:${actualPort}`);
    poolPromise
      .then((pool) => pool.request().query("SELECT (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE') AS total, (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = 'Users') AS hasUsers"))
      .then((r) => {
        const { total, hasUsers } = r.recordset[0];
        if (total === 0) {
          console.error(`❌ DB has no tables — apply backend/schema.sql to the database, then restart.`);
          process.exit(1);
        }
        if (hasUsers === 0) {
          console.error(`❌ 'Users' table missing — apply backend/schema.sql (creates Users) to the database, then restart.`);
          process.exit(1);
        }
        console.log(`✅ DB OK: ${total} tables present (Users ✓).`);
      })
      .catch((err) => {
        console.error(`❌ DB connection failed: ${err.message}`);
        process.exit(1);
      });
});
