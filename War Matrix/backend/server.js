
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Main application connected on http://localhost:5173`);
});
