/**
 * AstroSim Nexus - Unified MSSQL Backend
 */
console.log('--- BACKEND STARTUP DEBUG ---');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason);
  process.exit(1);
});

console.log('Dependencies loaded');
const { sql, poolPromise } = require('./db.js');
const serverConfig = require('./config.json');

const app = express();
const PORT = process.env.PORT || 3001;
console.log('--- CONTROL VERIFICATION: PORT 3001 ---');
console.log(`Setting up app on port ${PORT}`);


const JWT_SECRET = process.env.JWT_SECRET || serverConfig.Auth?.JWT_SECRET || 'astrosim-nexus-secret-key-change-it';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Simple liveness probe (no DB).
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Entity → Table mapping ───────────────────────────────────────────────────

const TABLE_MAP = {
  AuditTrail:              'AuditTrail',
  CargoManifest:           'CargoManifest',
  Colony:                  'Colony',
  CombatEncounter:         'CombatEncounter',
  CombatLog:               'CombatLog',
  CombatParticipant:       'CombatParticipant',
  CustomShipClass:         'CustomShipClass',
  DiplomacyAgreement:      'DiplomacyAgreement',
  EconomicPolicy:          'EconomicPolicy',
  EventLog:                'EventLog',
  Faction:                 'Faction',
  FactionStrategicMemory:  'FactionStrategicMemory',
  FactionStrategyProfile:  'FactionStrategyProfile',
  Fleet:                   'Fleet',
  FleetAssignment:         'FleetAssignment',
  InfrastructureModule:    'InfrastructureModule',
  Inventory:               'Inventory',
  MarketData:              'MarketData',
  MarketEvent:             'MarketEvent',
  MarketTransaction:       'MarketTransaction',
  ResearchProject:         'ResearchProject',
  Resource:                'Resource',
  Ship:                    'Ship',
  ShipComponent:           'ShipComponent',
  ShipConstructionOrder:   'ShipConstructionOrder',
  ShipHull:                'ShipHull',
  ShipLoadout:             'ShipLoadout',
  Threat:                  'Threat',
  TradeAgreement:          'TradeAgreement',
  TradeRoute:              'TradeRoute',
  User:                    'Users',
};

// ─── Utilities ───────────────────────────────────────────────────────────────

function toPascalCase(str) {
  if (!str) return 'Unknown';
  if (str === 'id') return null;
  // If it's already PascalCase (no underscores and starting with caps), return as is
  if (!str.includes('_') && /^[A-Z]/.test(str)) return str;
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function toSnakeCase(str) {
  if (!str) return 'unknown';
  return str.replace(/([A-Z])/g, (match, group, offset) => (offset > 0 ? '_' : '') + match.toLowerCase());
}

function mapRow(row, entityName) {
  if (!row) return null;
  const mapped = {};
  const idCol = `${entityName}ID`;
  
  Object.keys(row).forEach(key => {
    if (key.toLowerCase() === idCol.toLowerCase() || key.toLowerCase() === 'id') {
      mapped.id = row[key];
    } else {
      mapped[toSnakeCase(key)] = row[key];
    }
  });
  return mapped;
}

function mapInput(data, entityName) {
  if (!data) return {};
  const mapped = {};
  const idCol = `${entityName}ID`;
  
  Object.keys(data).forEach(key => {
    if (key.toLowerCase() === 'id') {
      mapped[idCol] = data[key];
    } else {
      const pKey = toPascalCase(key);
      if (pKey) mapped[pKey] = data[key];
    }
  });
  return mapped;
}


// ─── Middleware ─────────────────────────────────────────────────────────────

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
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Users WHERE Email = @email');
    
    const user = result.recordset[0];
    if (!user || !(await bcrypt.compare(password, user.PasswordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.UserID, email: user.Email, role: user.Role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ token, user: { id: user.UserID, email: user.Email, role: user.Role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, role = 'user' } = req.body;
  try {
    const pool = await poolPromise;
    const password_hash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, password_hash)
      .input('full_name', sql.NVarChar, full_name)
      .input('role', sql.NVarChar, role)
      .query('INSERT INTO Users (UserID, Email, PasswordHash, FullName, Role) VALUES (@id, @email, @password_hash, @full_name, @role)');
    
    const token = jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id, email, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req['user'].id)
      .query('SELECT UserID as id, Email as email, FullName as full_name, Role as role FROM Users WHERE UserID = @id');
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

// ─── Entity Routes ───────────────────────────────────────────────────────────


app.get('/api/:entity', async (req, res) => {
  const entityName = req.params.entity;
  const table = TABLE_MAP[entityName];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT * FROM ${table} ORDER BY CreatedAt DESC`);
    res.json(result.recordset.map(row => mapRow(row, entityName)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/:entity/:id', async (req, res) => {
  const entityName = req.params.entity;
  const table = TABLE_MAP[entityName];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  const idCol = `${entityName}ID`;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`SELECT * FROM ${table} WHERE ${idCol} = @id`);
    res.json(mapRow(result.recordset[0], entityName));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/:entity', async (req, res) => {
  const entityName = req.params.entity;
  const table = TABLE_MAP[entityName];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  const idCol = `${entityName}ID`;
  const id = uuidv4();
  const rawData = { ...req.body, id };
  const data = mapInput(rawData, entityName);
  
  try {
    const pool = await poolPromise;
    const request = pool.request();
    Object.keys(data).forEach(k => request.input(k, data[k]));
    const columns = Object.keys(data).join(', ');
    const values = Object.keys(data).map(k => `@${k}`).join(', ');
    
    await request.query(`INSERT INTO ${table} (${columns}) VALUES (${values})`);
    res.status(201).json(mapRow(data, entityName));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/:entity/:id', async (req, res) => {
  const entityName = req.params.entity;
  const table = TABLE_MAP[entityName];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  const idCol = `${entityName}ID`;
  const data = mapInput({ ...req.body, updated_at: new Date() }, entityName);
  delete data[idCol];

  try {
    const pool = await poolPromise;
    const request = pool.request();
    Object.keys(data).forEach(k => request.input(k, data[k]));
    const setClause = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    request.input('id', sql.UniqueIdentifier, req.params.id);

    await request.query(`UPDATE ${table} SET ${setClause} WHERE ${idCol} = @id`);
    res.json({ id: req.params.id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/:entity/:id', async (req, res) => {
  const entityName = req.params.entity;
  const table = TABLE_MAP[entityName];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  const idCol = `${entityName}ID`;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query(`DELETE FROM ${table} WHERE ${idCol} = @id`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── Filtered Query Route ────────────────────────────────────────────────────
app.post('/api/:entity/filter', async (req, res) => {
  const entityName = req.params.entity;
  const table = TABLE_MAP[entityName];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  
  const rawQuery = req.body || {};
  let sort = req.query.sort;
  if (Array.isArray(sort)) sort = sort[0];
  if (typeof sort !== 'string') sort = 'CreatedAt DESC';
  
  let limitStr = req.query.limit;
  if (Array.isArray(limitStr)) limitStr = limitStr[0];
  const limit = parseInt(String(limitStr || '200')) || 200;
  
  try {
    const pool = await poolPromise;
    const request = pool.request();
    
    // Map query keys to PascalCase
    const query = mapInput(rawQuery, entityName);

    let whereClause = '';
    const conditions = [];
    
    Object.keys(query).forEach((key, index) => {
      const paramName = `p${index}`;
      request.input(paramName, query[key]);
      conditions.push(`${key} = @${paramName}`);
    });
    
    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }
    
    const sortColumnRaw = sort.startsWith('-') ? sort.slice(1) : sort.split(' ')[0];
    const sortDir = sort.startsWith('-') ? 'DESC' : (sort.split(' ')[1] || 'ASC');
    
    // Map sort column to PascalCase if it's a known snake_case field
    const sortColumn = toPascalCase(sortColumnRaw) || 'CreatedAt';

    const sqlQuery = `SELECT TOP ${limit} * FROM ${table} ${whereClause} ORDER BY ${sortColumn} ${sortDir}`;
    console.log('--- EXECUTING FILTERED QUERY ---');
    console.log('Entity:', entityName);
    console.log('Mapped Query:', query);
    console.log('SQL:', sqlQuery);
    
    const result = await request.query(sqlQuery);
    res.json(result.recordset.map(row => mapRow(row, entityName)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Bulk Create Route ───────────────────────────────────────────────────────
app.post('/api/:entity/bulk', async (req, res) => {
  const entityName = req.params.entity;
  const table = TABLE_MAP[entityName];
  if (!table) return res.status(404).json({ error: 'Unknown entity' });
  
  const rawItems = Array.isArray(req.body) ? req.body : [req.body];
  if (rawItems.length === 0) return res.json({ success: true, count: 0 });
  
  const idCol = `${entityName}ID`;
  
  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      for (const rawItem of rawItems) {
        const id = rawItem.id || uuidv4();
        const data = mapInput({ ...rawItem, id }, entityName);
        
        const request = new sql.Request(transaction);
        Object.keys(data).forEach(k => request.input(k, data[k]));
        const columns = Object.keys(data).join(', ');
        const values = Object.keys(data).map(k => `@${k}`).join(', ');
        
        await request.query(`INSERT INTO ${table} (${columns}) VALUES (${values})`);
      }
      await transaction.commit();
      res.status(201).json({ success: true, count: rawItems.length });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  console.log(`🚀 AstroSim Nexus backend running on http://localhost:${actualPort}`);
  // Startup schema check: fail loudly if the DB is unreachable or has no tables,
  // so a missing schema.sql application is caught immediately instead of
  // surfacing as 500s on the first entity request.
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
