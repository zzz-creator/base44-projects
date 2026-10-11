/**
 * MSSQL Database Connection Pool
 */
const sql = require('mssql');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const serverConfig = require('./config.json');

const dbMode = serverConfig.DatabaseMode || {};
const localConnectionString = dbMode.LocalSQLConnectionString || '';
const connectionValue = (key) => localConnectionString.match(new RegExp(`${key}=([^;]+)`))?.[1];

// Environment variables (.env) win; config.json is only a fallback.
const config = {
  user:     process.env.DB_USER     || connectionValue('User ID')  || 'sa',
  password: process.env.DB_PASS     || process.env.DB_PASSWORD    || connectionValue('Password') || '',
  server:   process.env.DB_HOST     || connectionValue('Server')   || 'localhost',
  database: process.env.DB_NAME     || connectionValue('Database') || 'astrosim',
  port:     parseInt(process.env.DB_PORT || connectionValue('Port') || '1433', 10),
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// DATABASE_URL (if provided) overrides the discrete settings.
const poolPromise = sql.connect(process.env.DATABASE_URL || config)
  .then(pool => {
    console.log('✅ MSSQL connected');
    return pool;
  })
  .catch(err => {
    console.error('❌ MSSQL connection failed:', err.message);
    // process.exit(1);
  });


module.exports = {
  sql,
  poolPromise
};
