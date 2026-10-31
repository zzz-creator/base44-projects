/**
 * ProdIntel StageOps - Offline Backend Server (MSSQL version)
 * Run: node server.js
 * Requires: MSSQL Server running + backend/.env (falls back to config.json)
 */

const path = require('path');
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
// Load backend/.env explicitly – cwd is the project root, not backend/
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── Database Configuration ──────────────────────────────────────────────

const serverConfig = require('./config.json');
const dbMode = serverConfig.DatabaseMode || {};
const connString = dbMode.LocalSQLConnectionString || '';
const connPart = (key) => {
  const match = connString.match(new RegExp(`${key}=([^;]+)`));
  return match ? match[1] : undefined;
};

// .env values always win; config.json connection string is the fallback.
const config = {
  user:     process.env.DB_USER     || connPart('User ID')  || 'sa',
  password: process.env.DB_PASS     || process.env.DB_PASSWORD || connPart('Password') || '',
  server:   process.env.DB_HOST     || connPart('Server')   || 'localhost',
  database: process.env.DB_NAME     || connPart('Database') || 'prodintel',
  port:     parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// A full connection string (env or config.json) can be used directly by mssql.
// Otherwise connect with the resolved config object so .env values take effect.
const connectionSource = process.env.DATABASE_URL || config;

let poolPromise = sql.connect(connectionSource)
  .then(pool => {
    console.log('✅ MSSQL connected');
    return pool;
  })
  .catch(err => {
    console.error('❌ MSSQL connection failed:', err.message);
    console.error('   Connection target:', typeof connectionSource === 'string'
      ? connectionSource
      : `${connectionSource.server}:${connectionSource.port}/${connectionSource.database}`);
    process.exit(1);
  });

// ─── Entity → Table mapping ───────────────────────────────────────────────────
// Updated to match schema.sql.jsx (PascalCase)

const TABLE_MAP = {
  Production:                  'Production',
  ProductionTemplate:          'ProductionTemplate',
  Venue:                       'Venue',
  CrewMember:                  'CrewMember',
  CrewAssignment:              'CrewAssignment',
  CrewOnboarding:              'CrewOnboarding',
  TaskChecklist:               'TaskChecklist',
  IncidentLog:                 'IncidentLog',
  Budget:                      'Budget',
  BudgetExpense:               'BudgetExpense',
  EquipmentAsset:              'EquipmentAsset',
  MaintenanceRecord:           'MaintenanceRecord',
  UsageMetrics:                'UsageMetrics',
  EquipmentSchedule:           'EquipmentSchedule',
  AssetLocation:               'AssetLocation',
  KnowledgeRecord:             'KnowledgeRecord',
  CueDocumentation:            'CueDocumentation',
  ProcedureLibrary:            'ProcedureLibrary',
  AutomationRule:              'AutomationRule',
  TriggerCondition:            'TriggerCondition',
  WorkflowAction:              'WorkflowAction',
  ExecutionLog:                'ExecutionLog',
  HistoricalIncidentAnalysis:  'HistoricalIncidentAnalysis',
  ActivityLog:                 'ActivityLog',
  AuditLog:                    'AuditLog',
  Comment:                     'Comment',
  Notification:                'Notification',
  NotificationPreference:      'NotificationPreference',
  Announcement:                'Announcement',
  Conversation:                'Conversation',
  Message:                     'Message',
  User:                        'Users', // Standard name
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSortParam(sort) {
  if (!sort) return 'CreatedAt DESC';
  const desc = sort.startsWith('-');
  const field = sort.replace(/^-/, '').replace(/[^a-zA-Z0-9_]/g, '');
  // Mapping some common fields if they differ
  const mappedField = field === 'created_date' ? 'CreatedAt' : field;
  return `${mappedField} ${desc ? 'DESC' : 'ASC'}`;
}

function buildWhereClause(query, request) {
  const conditions = [];
  for (const [key, val] of Object.entries(query || {})) {
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
    conditions.push(`${safeKey} = @${safeKey}`);
    request.input(safeKey, val);
  }
  return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'prodintel-dev-secret-change-in-production';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req['user'] = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    const user = result.recordset[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.PasswordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.UserID, email: user.Email, role: user.Role, full_name: user.FullName },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.UserID, email: user.Email, full_name: user.FullName, role: user.Role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, role = 'user' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const pool = await poolPromise;
    const existing = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT UserID FROM Users WHERE Email = @email');
    
    if (existing.recordset.length > 0) return res.status(409).json({ error: 'User already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const now = new Date();

    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, password_hash)
      .input('full_name', sql.NVarChar, full_name || email.split('@')[0])
      .input('role', sql.NVarChar, role)
      .input('now', sql.DateTime2, now)
      .query(`
        INSERT INTO Users (UserID, Email, PasswordHash, FullName, Role, CreatedAt, UpdatedAt)
        VALUES (@id, @email, @password_hash, @full_name, @role, @now, @now);
        SELECT UserID as id, Email as email, FullName as full_name, Role as role FROM Users WHERE UserID = @id;
      `);

    const token = jwt.sign(
      { id, email, role, full_name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({ token, user: result.recordset[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (_req, res) => res.json({ success: true }));

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req['user'].id)
      .query('SELECT UserID as id, Email as email, FullName as full_name, Role as role, CreatedAt as created_date FROM Users WHERE UserID = @id');
    
    if (!result.recordset[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/me', authenticate, async (req, res) => {
  const allowed = ['full_name', 'phone', 'profile_image_url'];
  const mapping = { full_name: 'FullName', phone: 'Phone', profile_image_url: 'ProfileImageUrl' };
  
  const updates = [];
  const pool = await poolPromise;
  const request = pool.request();

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates.push(`${mapping[key]} = @${key}`);
      request.input(key, req.body[key]);
    }
  }

  if (updates.length === 0) {
    const r = await pool.request()
      .input('id', sql.UniqueIdentifier, req['user'].id)
      .query('SELECT UserID as id, Email as email, FullName as full_name, Role as role FROM Users WHERE UserID = @id');
    return res.json(r.recordset[0]);
  }

  const now = new Date();
  updates.push(`UpdatedAt = @now`);
  request.input('now', sql.DateTime2, now);
  request.input('id', sql.UniqueIdentifier, req['user'].id);

  try {
    const result = await request.query(`
      UPDATE Users SET ${updates.join(', ')} WHERE UserID = @id;
      SELECT UserID as id, Email as email, FullName as full_name, Role as role FROM Users WHERE UserID = @id;
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin: Impersonate User ──────────────────────────────────────────────────

app.post('/api/auth/impersonate/:userId', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.userId)
      .query('SELECT UserID as id, Email as email, FullName as full_name, Role as role FROM Users WHERE UserID = @id');
    const target = result.recordset[0];
    if (!target) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign(
      { id: target.id, email: target.email, role: target.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token, user: target });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/users', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: Admins only' });
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT UserID as id, Email as email, FullName as full_name, Role as role, CreatedAt as created_date FROM Users ORDER BY CreatedAt DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Entity CRUD ─────────────────────────────────────────────────────────────


// LIST
app.get('/api/entities/:entity', authenticate, async (req, res) => {
  const table = TABLE_MAP[req.params.entity];
  if (!table) return res.status(404).json({ error: `Unknown entity: ${req.params.entity}` });

  const sort = parseSortParam(req.query.sort);
  const limit = Math.min(parseInt(req.query.limit?.toString() || '1000'), 5000);
  const skip = parseInt(req.query.skip?.toString() || '0');

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .input('skip', sql.Int, skip)
      .query(`SELECT * FROM ${table} ORDER BY ${sort} OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single
app.get('/api/entities/:entity/:id', authenticate, async (req, res) => {
  const table = TABLE_MAP[req.params.entity];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });

  // Determine ID column name (usually EntityID)
  const idCol = req.params.entity === 'User' ? 'UserID' : `${req.params.entity}ID`;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT * FROM ${table} WHERE ${idCol} = @id`);
    
    if (!result.recordset[0]) return res.status(404).json({ error: 'Record not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FILTER
app.post('/api/entities/:entity/filter', authenticate, async (req, res) => {
  const table = TABLE_MAP[req.params.entity];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });

  const sort = parseSortParam(req.query.sort);
  const limit = Math.min(parseInt(req.query.limit?.toString() || '1000'), 5000);
  const skip = parseInt(req.query.skip?.toString() || '0');

  try {
    const pool = await poolPromise;
    const request = pool.request();
    const where = buildWhereClause(req.body, request);
    
    request.input('limit', sql.Int, limit);
    request.input('skip', sql.Int, skip);

    const result = await request.query(
      `SELECT * FROM ${table} ${where} ORDER BY ${sort} OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
app.post('/api/entities/:entity', authenticate, async (req, res) => {
  const table = TABLE_MAP[req.params.entity];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });

  const idCol = req.params.entity === 'User' ? 'UserID' : `${req.params.entity}ID`;
  const now = new Date();
  const id = uuidv4();
  
  const data = {
    [idCol]: id,
    CreatedAt: now,
    UpdatedAt: now,
    CreatedBy: req['user'].email,
    ...req.body,
  };

  try {
    const pool = await poolPromise;
    const request = pool.request();
    const keys = Object.keys(data);
    
    keys.forEach(k => request.input(k, data[k]));
    const placeholders = keys.map(k => `@${k}`).join(', ');

    const result = await request.query(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders});
       SELECT * FROM ${table} WHERE ${idCol} = @${idCol}`
    );
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
app.put('/api/entities/:entity/:id', authenticate, async (req, res) => {
  const table = TABLE_MAP[req.params.entity];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });

  const idCol = req.params.entity === 'User' ? 'UserID' : `${req.params.entity}ID`;
  const data = { ...req.body, UpdatedAt: new Date() };
  
  // Clean up read-only fields
  delete data[idCol];
  delete data.CreatedAt;
  delete data.CreatedBy;

  try {
    const pool = await poolPromise;
    const request = pool.request();
    const keys = Object.keys(data);
    
    keys.forEach(k => request.input(k, data[k]));
    const setClause = keys.map(k => `${k} = @${k}`).join(', ');
    request.input('id', sql.UniqueIdentifier, req.params.id);

    const result = await request.query(
      `UPDATE ${table} SET ${setClause} WHERE ${idCol} = @id;
       SELECT * FROM ${table} WHERE ${idCol} = @id;`
    );

    if (!result.recordset[0]) return res.status(404).json({ error: 'Record not found' });
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
app.delete('/api/entities/:entity/:id', authenticate, async (req, res) => {
  const table = TABLE_MAP[req.params.entity];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  const idCol = req.params.entity === 'User' ? 'UserID' : `${req.params.entity}ID`;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM ${table} WHERE ${idCol} = @id`);
    
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health ───────────────────────────────────────────────────────────────────

// Simple liveness probe (no DB).
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/health', async (_req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request().query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT) || 3001;

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
  console.log(`\n🎭 ProdIntel StageOps backend (MSSQL) running on http://localhost:${actualPort}`);
  console.log(`   Health: http://localhost:${actualPort}/health`);
  console.log(`   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
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
