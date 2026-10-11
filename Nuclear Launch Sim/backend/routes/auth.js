
const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sql, poolPromise } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'nuclear-launch-sim-local-dev-secret';

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ident = (name) => {
    if (!IDENT.test(name)) throw new Error(`Invalid identifier: ${name}`);
    return `[${name}]`;
};

const publicUser = (row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: row.role
});

function bearerToken(req) {
    const header = req.headers.authorization;
    return header && header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Verify a Bearer token if one is present. Returns the decoded payload or null.
function verifyToken(req) {
    const token = bearerToken(req);
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

// Resolve the current user. A valid token wins; otherwise fall back to the
// seeded local administrator so this single-user simulator keeps its previous
// "always signed in" behaviour (there is no login screen that stores a token).
async function currentUser(req) {
    const pool = await poolPromise;
    const payload = verifyToken(req);
    if (payload && payload.id) {
        const result = await pool.request()
            .input('id', payload.id)
            .query('SELECT id, email, full_name, role FROM Users WHERE id = @id');
        if (result.recordset[0]) return result.recordset[0];
    }
    const fallback = await pool.request().query(`
        SELECT TOP 1 id, email, full_name, role FROM Users
        ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_date ASC
    `);
    return fallback.recordset[0] || null;
}

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const pool = await poolPromise;

        // Plaintext password check as requested
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Direct comparison (CAUTION: Not secure for production, but requested)
        const storedPassword = user.password_hash !== undefined ? user.password_hash : user.password;
        if (storedPassword !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user info (omit credentials)
        const { password: _pw, password_hash: _ph, ...userWithoutPassword } = user;

        // Log the successful login
        try {
            await pool.request()
                .input('action', 'LOGIN')
                .input('performedBy', email)
                .input('success', 1)
                .query(`INSERT INTO AdminAuditLog (action, performedBy, success) VALUES (@action, @performedBy, @success)`);
        } catch (logErr) {
            console.error('Failed to log login:', logErr);
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            user: userWithoutPassword,
            token
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Current user (base44.auth.me())
router.get('/me', async (req, res) => {
    try {
        const user = await currentUser(req);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update current user (base44.auth.updateMe()). Only role/full_name/email may
// change; id and the password columns are never accepted here.
router.put('/me', async (req, res) => {
    try {
        const pool = await poolPromise;
        const user = await currentUser(req);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const ALLOWED = ['role', 'full_name', 'email'];
        const request = pool.request();
        request.input('id', user.id);

        const updates = [];
        for (const key of ALLOWED) {
            if (req.body && Object.prototype.hasOwnProperty.call(req.body, key)) {
                const name = `u_${key}`;
                request.input(name, req.body[key]);
                updates.push(`${ident(key)} = @${name}`);
            }
        }

        if (updates.length === 0) return res.json(publicUser(user));

        const result = await request.query(`
            UPDATE Users
            SET ${updates.join(', ')}, updated_date = GETUTCDATE()
            OUTPUT inserted.id, inserted.email, inserted.full_name, inserted.role
            WHERE id = @id
        `);

        res.json(result.recordset[0] ? publicUser(result.recordset[0]) : publicUser(user));
    } catch (err) {
        console.error('Update me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout (client clears its own token; kept for API completeness)
router.post('/logout', (req, res) => res.json({ success: true }));

module.exports = router;
