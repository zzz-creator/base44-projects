import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, connectMasterDB } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entitiesDir = path.resolve(__dirname, '../entities');
const extractPath = path.resolve(__dirname, '../base44-extract.json');

async function createDatabase() {
    try {
        const masterPool = await connectMasterDB();
        const dbName = process.env.DB_NAME;
        const result = await masterPool.request().query(`
            IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = N'${dbName}')
            BEGIN
                CREATE DATABASE [${dbName}]
            END
        `);
        console.log(`Database [${dbName}] checked/created.`);
        await masterPool.close();
    } catch (err) {
        console.error('Error creating database:', err);
        throw err;
    }
}

async function createTables(pool) {
    const files = fs.readdirSync(entitiesDir).filter(f => f.endsWith('.json') || f.indexOf('.') === -1);
    
    for (const file of files) {
        let content = fs.readFileSync(path.join(entitiesDir, file), 'utf-8');
        try {
            const schema = JSON.parse(content);
            const tableName = schema.name || file.replace('.json', '');
            
            let columns = [];
            let hasId = false;
            
            if (schema.properties) {
                for (const [colName, colDef] of Object.entries(schema.properties)) {
                    if (colName === 'id') hasId = true;
                    let sqlDef = '[NVARCHAR](MAX)';
                    if (colDef.type === 'string') sqlDef = '[NVARCHAR](MAX)';
                    if (colDef.type === 'number') sqlDef = '[FLOAT]';
                    if (colDef.type === 'boolean') sqlDef = '[BIT]';
                    columns.push(`[${colName}] ${sqlDef}`);
                }
            }
            if (!hasId) {
                columns.unshift('[id] [NVARCHAR](255) PRIMARY KEY');
            } else {
                columns = columns.map(c => c.startsWith('[id]') ? '[id] [NVARCHAR](255) PRIMARY KEY' : c);
            }
            if (!columns.some(c => c.startsWith('[created_date]'))) columns.push('[created_date] [DATETIME] DEFAULT GETDATE()');
            if (!columns.some(c => c.startsWith('[updated_date]'))) columns.push('[updated_date] [DATETIME] DEFAULT GETDATE()');
            
            const createSql = `
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableName}' and xtype='U')
                CREATE TABLE [${tableName}] (
                    ${columns.join(',\n                    ')}
                )
            `;
            await pool.request().query(createSql);
            console.log(`Table [${tableName}] checked/created.`);
        } catch(e) {
            console.error(`Skipping ${file}: Not valid JSON or parsing error.`, e.message);
        }
    }
}

async function seedData(pool) {
    if (!fs.existsSync(extractPath)) {
        console.log(`Extract file not found at ${extractPath}. Skipping seed.`);
        return;
    }
    const extractStr = fs.readFileSync(extractPath, 'utf8');
    const extractData = JSON.parse(extractStr);
    
    const entities = fs.readdirSync(entitiesDir).map(f => f.replace('.json', ''));
    
    for (const [entityName, records] of Object.entries(extractData)) {
        if (!entities.includes(entityName)) {
            console.log(`Table [${entityName}] not in entities schema. Skipping seed.`);
            continue;
        }
        console.log(`Seeding ${records.length} records for [${entityName}]...`);
        for (const record of records) {
            const req = pool.request();
            const keys = Object.keys(record);
            const vals = [];
            for (const k of keys) {
                let val = record[k];
                if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                req.input(k, val);
                vals.push(`@${k}`);
            }
            try {
                const q = `INSERT INTO [${entityName}] ([${keys.join('], [')}]) VALUES (${vals.join(', ')})`;
                await req.query(q);
            } catch (err) {
                 if (!err.message.includes('Violation of PRIMARY KEY constraint')) {
                     console.error(`Failed to insert record into ${entityName}: ${err.message}`);
                 }
            }
        }
    }
}

async function main() {
    await createDatabase();
    const pool = await connectDB();
    await createTables(pool);
    await seedData(pool);
    console.log('Setup complete.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
