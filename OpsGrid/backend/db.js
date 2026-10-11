/**
 * MSSQL connection pool for the OpsGrid local backend.
 */
import sql from 'mssql';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const config = {
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || 'admin',
  server: process.env.DB_HOST || process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'opsgrid',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let poolPromise;

export function getPool() {
  if (!poolPromise) {
    poolPromise = sql.connect(config)
      .then((pool) => {
        console.log('✅ MSSQL connected');
        return pool;
      })
      .catch((err) => {
        console.error('❌ MSSQL connection failed:', err.message);
        poolPromise = undefined;
        throw err;
      });
  }
  return poolPromise;
}

export { sql };
export default getPool;
