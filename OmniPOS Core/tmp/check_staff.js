import { connectDB } from '../backend/db.js';

async function check() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT name, pin, role, active FROM Staff');
        console.log('Staff members found:');
        console.table(result.recordset);
        process.exit(0);
    } catch (err) {
        console.error('Error checking staff table:', err.message);
        process.exit(1);
    }
}
check();
