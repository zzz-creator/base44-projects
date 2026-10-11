
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { sql, poolPromise } = require('../db');

const ALLOWED_TABLES = [
    'MissionScenario',
    'MissionPerformance',
    'AdminAuditLog',
    'AdminAccessControl',
    'Users'
];

// Base44 entity names -> MSSQL table names. The frontend addresses the user
// entity in the singular ("User") while the physical table is "Users".
const TABLE_ALIASES = {
    User: 'Users',
    Users: 'Users'
};

// Resolve an entity name to a whitelisted table name (security check).
const resolveTable = (entityName) => {
    const mapped = TABLE_ALIASES[entityName] || entityName;
    if (ALLOWED_TABLES.includes(mapped)) return mapped;
    // Generic singular fallback: "Foo" -> "Foos"
    if (ALLOWED_TABLES.includes(`${mapped}s`)) return `${mapped}s`;
    throw new Error('Invalid table name');
};

// Identifiers coming from the client (sort columns, filter keys) are only ever
// interpolated after this check, everything else is parameterised.
const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const ident = (name) => {
    if (!IDENT.test(name)) throw new Error(`Invalid identifier: ${name}`);
    return `[${name}]`;
};

// Objects/arrays are persisted as JSON text in NVARCHAR(MAX) columns.
const serialize = (value) =>
    value !== null && typeof value === 'object' ? JSON.stringify(value) : value;

const orderClause = (orderBy) => {
    if (!orderBy) return '';
    const desc = orderBy.startsWith('-');
    const column = desc ? orderBy.slice(1) : orderBy;
    return ` ORDER BY ${ident(column)} ${desc ? 'DESC' : 'ASC'}`;
};

const COMPARISON_OPERATORS = { $ne: '<>', $gt: '>', $gte: '>=', $lt: '<', $lte: '<=', $like: 'LIKE' };

// Translate a Base44-style filter object into a parameterised WHERE fragment.
// Supports $or/$and, the comparison operators and IN/array shorthand; every
// other entry is treated as equality.
function buildFilter(request, filter, counter) {
    const clauses = [];
    for (const [key, value] of Object.entries(filter || {})) {
        if ((key === '$or' || key === '$and') && Array.isArray(value)) {
            const parts = value
                .map((sub) => buildFilter(request, sub, counter))
                .filter(Boolean);
            if (parts.length > 0) clauses.push(`(${parts.join(key === '$or' ? ' OR ' : ' AND ')})`);
            continue;
        }
        if (Array.isArray(value)) {
            const names = value.map((v) => {
                const name = `p${counter.i++}`;
                request.input(name, serialize(v));
                return `@${name}`;
            });
            if (names.length > 0) clauses.push(`${ident(key)} IN (${names.join(', ')})`);
            continue;
        }
        if (value !== null && typeof value === 'object') {
            for (const [op, opValue] of Object.entries(value)) {
                if (op === '$in') {
                    const arr = Array.isArray(opValue) ? opValue : [opValue];
                    const names = arr.map((v) => {
                        const name = `p${counter.i++}`;
                        request.input(name, serialize(v));
                        return `@${name}`;
                    });
                    clauses.push(names.length > 0 ? `${ident(key)} IN (${names.join(', ')})` : '1 = 0');
                    continue;
                }
                const name = `p${counter.i++}`;
                request.input(name, serialize(opValue));
                clauses.push(`${ident(key)} ${COMPARISON_OPERATORS[op] || '='} @${name}`);
            }
            continue;
        }
        const name = `p${counter.i++}`;
        request.input(name, serialize(value));
        clauses.push(`${ident(key)} = @${name}`);
    }
    return clauses.join(' AND ');
}

// --- Generic CRUD ---

// Get all (orderBy/limit supplied by src/api/base44-local-client.js list())
router.get('/entities/:table', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = resolveTable(req.params.table);

        const limit = Math.min(parseInt(req.query.limit, 10) || 1000, 5000);
        const orderBy = typeof req.query.orderBy === 'string' ? req.query.orderBy : null;

        const query = `SELECT TOP ${limit} * FROM ${ident(tableName)}${orderClause(orderBy)}`;
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Filter (POST body = match object, ?sort= & ?limit= from the client filter())
router.post('/entities/:table/filter', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = resolveTable(req.params.table);
        const filter = req.body || {};

        const request = pool.request();
        const where = buildFilter(request, filter, { i: 0 });

        const limit = Math.min(parseInt(req.query.limit, 10) || 200, 5000);
        const sort = typeof req.query.sort === 'string' ? req.query.sort : null;

        let query = `SELECT TOP ${limit} * FROM ${ident(tableName)}`;
        if (where) query += ` WHERE ${where}`;
        query += orderClause(sort);

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk create
router.post('/entities/:table/bulk', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = resolveTable(req.params.table);
        const items = Array.isArray(req.body) ? req.body : [req.body];

        const created = [];
        for (const item of items) {
            const data = { ...item, id: item.id || crypto.randomUUID() };
            const request = pool.request();
            const keys = Object.keys(data);
            keys.forEach((key) => request.input(key, serialize(data[key])));
            const columns = keys.map((k) => ident(k)).join(', ');
            const values = keys.map((k) => `@${k}`).join(', ');
            const result = await request.query(
                `INSERT INTO ${ident(tableName)} (${columns}) OUTPUT inserted.* VALUES (${values})`
            );
            created.push(result.recordset[0] || data);
        }
        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get by ID
router.get('/entities/:table/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = resolveTable(req.params.table);
        const id = req.params.id;

        const result = await pool.request()
            .input('id', sql.VarChar, id) // Assuming ID is string/GUID
            .query(`SELECT * FROM ${ident(tableName)} WHERE id = @id`);

        res.json(result.recordset[0] || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create
router.post('/entities/:table', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = resolveTable(req.params.table);
        const data = { ...(req.body || {}), id: (req.body && req.body.id) || crypto.randomUUID() };

        const keys = Object.keys(data);
        if (keys.length === 0) return res.status(400).json({ error: 'No data provided' });

        const columns = keys.map((k) => ident(k)).join(', ');
        const values = keys.map((k) => `@${k}`).join(', ');

        const request = pool.request();
        keys.forEach((key) => {
            request.input(key, serialize(data[key]));
        });

        const result = await request.query(
            `INSERT INTO ${ident(tableName)} (${columns}) OUTPUT inserted.* VALUES (${values})`
        );
        res.json(result.recordset[0] || data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Update
router.put('/entities/:table/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = resolveTable(req.params.table);
        const id = req.params.id;
        const data = req.body;

        const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_date'); // don't update key or created_date usually
        if (keys.length === 0) return res.status(400).json({ error: 'No data to update' });

        const setClause = keys.map(k => `${ident(k)} = @${k}`).join(', ');

        const request = pool.request();
        request.input('id', id);
        keys.forEach(key => {
            request.input(key, serialize(data[key]));
        });

        const result = await request.query(`
            UPDATE ${ident(tableName)}
            SET ${setClause}, updated_date = GETUTCDATE()
            OUTPUT inserted.*
            WHERE id = @id
        `);

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete
router.delete('/entities/:table/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const tableName = resolveTable(req.params.table);
        const id = req.params.id;

        await pool.request()
            .input('id', id)
            .query(`DELETE FROM ${ident(tableName)} WHERE id = @id`);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
