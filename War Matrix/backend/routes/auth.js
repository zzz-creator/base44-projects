
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { sql, poolPromise } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'warmatrix-local-dev-secret';
let jwt;
try { jwt = require('jsonwebtoken'); } catch { jwt = null; }

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ident = (name) => {
  if (!IDENT.test(name)) throw new Error(`Invalid identifier: ${name}`);
  return `[${name}]`;
};

function signToken(payload) {
  if (jwt) return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
  return 'mock-jwt-token'; // fallback
}

function bearerToken(req) {
  const header = req.headers.authorization;
  return header && header.startsWith('Bearer ') ? header.slice(7) : null;
}

// The Users table stores the credential in `password_hash` (canonical local
// schema) but older/seed databases use a plaintext `password` column; pick
// whichever exists so register/login work against either.
async function resolvePasswordColumn(pool) {
  const result = await pool.request().query(`
    SELECT TOP 1 name FROM sys.columns
    WHERE object_id = OBJECT_ID('Users') AND name IN ('password_hash', 'password')
    ORDER BY CASE name WHEN 'password_hash' THEN 0 ELSE 1 END
  `);
  return result.recordset[0] ? result.recordset[0].name : 'password_hash';
}

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const pool = await poolPromise;

        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Plaintext comparison, matching the prior backend behaviour.
        const storedPassword = user.password_hash !== undefined ? user.password_hash : user.password;
        if (storedPassword !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const { password: _, password_hash: _ph, ...userWithoutPassword } = user;

        try {
            await pool.request()
                .input('action', 'LOGIN')
                .input('performedBy', email)
                .input('success', 1)
                .query(`INSERT INTO AdminAuditLog (action, performedBy, success) VALUES (@action, @performedBy, @success)`);
        } catch (logErr) {
            console.error('Failed to log login:', logErr);
        }

        res.json({
            success: true,
            user: { ...userWithoutPassword, role: userWithoutPassword.role || 'user' },
            token: signToken({ id: user.id, email: user.email, role: user.role || 'user' })
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register Route (base44.auth.register())
router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, role = 'user' } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const pool = await poolPromise;

        const existing = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT id FROM Users WHERE email = @email');
        if (existing.recordset.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const passwordColumn = await resolvePasswordColumn(pool);
        const id = crypto.randomUUID();

        const request = pool.request();
        request.input('id', sql.NVarChar, id)
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, password)
            .input('full_name', sql.NVarChar, full_name || null)
            .input('role', sql.NVarChar, role);

        const result = await request.query(`
            INSERT INTO Users (id, email, ${ident(passwordColumn)}, full_name, role)
            OUTPUT inserted.id, inserted.email, inserted.full_name, inserted.role
            VALUES (@id, @email, @password, @full_name, @role)
        `);

        const user = result.recordset[0] || { id, email, full_name: full_name || null, role };
        res.status(201).json({
            success: true,
            user,
            token: signToken({ id: user.id, email: user.email, role: user.role || 'user' })
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    const token = bearerToken(req);
    if (!token || token === 'mock-jwt-token') return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.NVarChar, payload.id)
            .query('SELECT id, email, full_name, role FROM Users WHERE id = @id');
        res.json(result.recordset[0] || { ...payload });
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Update current user (base44.auth.updateMe()). Only role/full_name/email may
// change; id and the credential columns are never accepted here.
router.put('/me', async (req, res) => {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
    try {
        const pool = await poolPromise;

        const ALLOWED = ['role', 'full_name', 'email'];
        const request = pool.request();
        request.input('id', sql.NVarChar, payload.id);

        const updates = [];
        for (const key of ALLOWED) {
            if (req.body && Object.prototype.hasOwnProperty.call(req.body, key)) {
                const name = `u_${key}`;
                request.input(name, req.body[key]);
                updates.push(`${ident(key)} = @${name}`);
            }
        }

        if (updates.length === 0) {
            const current = await pool.request()
                .input('id', sql.NVarChar, payload.id)
                .query('SELECT id, email, full_name, role FROM Users WHERE id = @id');
            return res.json(current.recordset[0] || null);
        }

        const result = await request.query(`
            UPDATE Users
            SET ${updates.join(', ')}, updated_date = GETUTCDATE()
            OUTPUT inserted.id, inserted.email, inserted.full_name, inserted.role
            WHERE id = @id
        `);
        res.json(result.recordset[0] || null);
    } catch (err) {
        console.error('Update me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout (client clears its own token; kept for API completeness)
router.post('/logout', (req, res) => res.json({ success: true }));

// List all users (admin only)
router.get('/users', async (req, res) => {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt ? jwt.verify(token, JWT_SECRET) : {};
        if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
        const pool = await poolPromise;
        const result = await pool.request()
            .query('SELECT id, email, full_name, role, created_date FROM Users ORDER BY created_date DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Impersonate user (admin only)
router.post('/impersonate/:userId', async (req, res) => {
    const token = bearerToken(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt ? jwt.verify(token, JWT_SECRET) : {};
        if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.NVarChar, req.params.userId)
            .query('SELECT id, email, full_name, role FROM Users WHERE id = @id');
        const target = result.recordset[0];
        if (!target) return res.status(404).json({ error: 'User not found' });
        const impersonateToken = signToken({ id: target.id, email: target.email, role: target.role || 'user' });
        res.json({ token: impersonateToken, user: target });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
