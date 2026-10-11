/**
 * MSSQL Database Connection Pool
 */
const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const serverConfig = require('./config.json');

const dbMode = serverConfig.DatabaseMode || {};
const connectionString = dbMode.LocalSQLConnectionString || '';
const connectionMatch = (pattern) => connectionString.match(pattern)?.[1];

// .env values win; config.json connection string is the fallback.
const config = {
  user:     process.env.DB_USER || connectionMatch(/User ID=([^;]+)/) || 'sa',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || connectionMatch(/Password=([^;]+)/) || '',
  server:   process.env.DB_HOST || connectionMatch(/Server=([^;]+)/) || 'localhost',
  database: process.env.DB_NAME || connectionMatch(/Database=([^;]+)/) || 'hotelops',
  port:     parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

const poolPromise = sql.connect(process.env.DATABASE_URL || config)
  .then(pool => {
    console.log('✅ MSSQL connected');
    return pool;
  })
  .catch(err => {
    console.error('❌ MSSQL connection failed:', err.message);
    throw err;
  });


module.exports = {
  sql,
  poolPromise
};
