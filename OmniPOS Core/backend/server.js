/**
 * OmniPOS Core - Local MSSQL Backend
 * Implements the Base44-compatible API surface used by src/api/base44-local-client.js.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { getPool, sql } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'omnipos-local-dev-secret';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

// Entity name → MSSQL table name
const TABLE_MAP = {
  Coupon: 'Coupon',
  Customer: 'Customer',
  GiftCard: 'GiftCard',
  Product: 'Product',
  PurchaseOrder: 'PurchaseOrder',
  ScheduledShift: 'ScheduledShift',
  SecurityLog: 'SecurityLog',
  ShiftSession: 'ShiftSession',
  Staff: 'Staff',
  StoreSettings: 'StoreSettings',
  Supplier: 'Supplier',
  Transaction: 'Transaction',
  User: 'Users',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

function ident(name) {
  if (!IDENT.test(name)) throw new Error(`Invalid identifier: ${name}`);
  return `[${name}]`;
}

// Objects/arrays are persisted as JSON text in NVARCHAR(MAX) columns.
function serialize(value) {
  return value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
}

function tableFor(entity) {
  return TABLE_MAP[entity];
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ─── Auth ────────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, role = 'user' } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  try {
    const pool = await getPool();
    const existing = await pool.request().input('email', email).query('SELECT id FROM Users WHERE email = @email');
    if (existing.recordset.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const id = crypto.randomUUID();
    const password_hash = await bcrypt.hash(password, 10);
    await pool.request()
      .input('id', id)
      .input('email', email)
      .input('password_hash', password_hash)
      .input('full_name', full_name || null)
      .input('role', role)
      .query('INSERT INTO Users (id, email, password_hash, full_name, role) VALUES (@id, @email, @password_hash, @full_name, @role)');

    const user = { id, email, full_name: full_name || null, role };
    const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  try {
    const pool = await getPool();
    const result = await pool.request().input('email', email).query('SELECT * FROM Users WHERE email = @email');
    const row = result.recordset[0];
    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = { id: row.id, email: row.email, full_name: row.full_name, role: row.role };
    const token = jwt.sign({ id: row.id, email: row.email, role: row.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', req.user.id)
      .query('SELECT id, email, full_name, role FROM Users WHERE id = @id');
    if (result.recordset.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => res.json({ success: true }));

app.put('/api/auth/me', authenticate, async (req, res) => {
  const data = { ...(req.body || {}) };
  delete data.id;
  delete data.password_hash;
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', req.user.id);
    const updates = [];
    for (const [key, value] of Object.entries(data)) {
      updates.push(`${ident(key)} = @${key}`);
      request.input(key, serialize(value));
    }
    if (updates.length === 0) {
      const current = await pool.request().input('id', req.user.id)
        .query('SELECT id, email, full_name, role FROM Users WHERE id = @id');
      return res.json(current.recordset[0] || null);
    }
    const result = await request.query(
      `UPDATE Users SET ${updates.join(', ')}, updated_date = GETDATE()
       OUTPUT INSERTED.id, INSERTED.email, INSERTED.full_name, INSERTED.role
       WHERE id = @id`
    );
    res.json(result.recordset[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Entities ────────────────────────────────────────────────────────────────

app.get('/api/entities/:entity', async (req, res) => {
  const table = tableFor(req.params.entity);
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  try {
    const pool = await getPool();
    const request = pool.request();
    let query = `SELECT * FROM ${ident(table)}`;
    const orderBy = typeof req.query.orderBy === 'string' ? req.query.orderBy : null;
    const limit = parseInt(String(req.query.limit || '1000'), 10) || 1000;
    if (orderBy) {
      const desc = orderBy.startsWith('-');
      const col = desc ? orderBy.slice(1) : orderBy;
      query += ` ORDER BY ${ident(col)} ${desc ? 'DESC' : 'ASC'}`;
    }
    query = query.replace('SELECT *', `SELECT TOP ${limit} *`);
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/entities/:entity/filter', async (req, res) => {
  const table = tableFor(req.params.entity);
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  const conditions = req.body && req.body.conditions ? req.body.conditions : (req.body || {});
  try {
    const pool = await getPool();
    const request = pool.request();
    const clauses = [];
    let i = 0;
    for (const [key, value] of Object.entries(conditions)) {
      if (Array.isArray(value)) {
        const names = value.map((v) => {
          const name = `p${i++}`;
          request.input(name, serialize(v));
          return `@${name}`;
        });
        clauses.push(`${ident(key)} IN (${names.join(', ')})`);
      } else {
        const name = `p${i++}`;
        request.input(name, serialize(value));
        clauses.push(`${ident(key)} = @${name}`);
      }
    }
    const orderBy = typeof req.query.sort === 'string' ? req.query.sort : null;
    const limit = parseInt(String(req.query.limit || '200'), 10) || 200;
    let query = `SELECT TOP ${limit} * FROM ${ident(table)}`;
    if (clauses.length > 0) query += ` WHERE ${clauses.join(' AND ')}`;
    if (orderBy) {
      const desc = orderBy.startsWith('-');
      const col = desc ? orderBy.slice(1) : orderBy;
      query += ` ORDER BY ${ident(col)} ${desc ? 'DESC' : 'ASC'}`;
    }
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/entities/:entity/bulk', async (req, res) => {
  const table = tableFor(req.params.entity);
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  const items = Array.isArray(req.body) ? req.body : [req.body];
  try {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const created = [];
    try {
      for (const item of items) {
        const data = { ...item, id: item.id || crypto.randomUUID() };
        const request = new sql.Request(transaction);
        const keys = Object.keys(data);
        keys.forEach((k) => request.input(k, serialize(data[k])));
        const cols = keys.map((k) => ident(k)).join(', ');
        const vals = keys.map((k) => `@${k}`).join(', ');
        await request.query(`INSERT INTO ${ident(table)} (${cols}) VALUES (${vals})`);
        created.push(data);
      }
      await transaction.commit();
      res.status(201).json(created);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/entities/:entity/:id', async (req, res) => {
  const table = tableFor(req.params.entity);
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', req.params.id)
      .query(`SELECT TOP 1 * FROM ${ident(table)} WHERE id = @id`);
    res.json(result.recordset[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/entities/:entity', async (req, res) => {
  const table = tableFor(req.params.entity);
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  const data = { ...(req.body || {}), id: (req.body && req.body.id) || crypto.randomUUID() };
  try {
    const pool = await getPool();
    const request = pool.request();
    const keys = Object.keys(data);
    keys.forEach((k) => request.input(k, serialize(data[k])));
    const cols = keys.map((k) => ident(k)).join(', ');
    const vals = keys.map((k) => `@${k}`).join(', ');
    const result = await request.query(`INSERT INTO ${ident(table)} (${cols}) OUTPUT INSERTED.* VALUES (${vals})`);
    res.status(201).json(result.recordset[0] || data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/entities/:entity/:id', async (req, res) => {
  const table = tableFor(req.params.entity);
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  const data = { ...(req.body || {}) };
  delete data.id;
  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('id', req.params.id);
    const updates = [];
    for (const [key, value] of Object.entries(data)) {
      updates.push(`${ident(key)} = @${key}`);
      request.input(key, serialize(value));
    }
    updates.push('[updated_date] = GETDATE()');
    const result = await request.query(
      `UPDATE ${ident(table)} SET ${updates.join(', ')} OUTPUT INSERTED.* WHERE id = @id`
    );
    res.json(result.recordset[0] || { id: req.params.id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/entities/:entity/:id', async (req, res) => {
  const table = tableFor(req.params.entity);
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  try {
    const pool = await getPool();
    await pool.request().input('id', req.params.id).query(`DELETE FROM ${ident(table)} WHERE id = @id`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Integrations ────────────────────────────────────────────────────────────

app.post('/api/integrations/Core/InvokeLLM', async (req, res) => {
  const data = req.body || {};
  if (!GEMINI_API_KEY) {
    return res.status(400).json({ error: 'GEMINI_API_KEY is not configured on the backend' });
  }
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const config = {};
    if (data.response_json_schema) {
      config.responseMimeType = 'application/json';
      config.responseSchema = data.response_json_schema;
    }
    const response = await ai.models.generateContent({
      model: data.model || 'gemini-3-flash-preview',
      contents: data.prompt,
      config: Object.keys(config).length > 0 ? config : undefined,
    });
    const textResponse = response.text || '';
    if (data.response_json_schema) {
      try {
        return res.json({ data: JSON.parse(textResponse) });
      } catch {
        return res.json({ data: textResponse });
      }
    }
    res.json({ response: textResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/integrations/Core/UploadFile', async (req, res) => {
  const data = req.body || {};
  res.json({ file_url: data.file_url || data.data_url || null });
});

// ─── Logs ────────────────────────────────────────────────────────────────────

app.post('/api/logs/user-app-logs', (req, res) => {
  console.log('[user-app-logs]', req.body?.page_name || req.body?.page || 'unknown');
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 OmniPOS Core backend running on http://localhost:${PORT}`);
});
