import { connectDB } from '../backend/db.js';
import sql from 'mssql';

async function seed() {
    try {
        const pool = await connectDB();
        console.log('Connected. Clearing and seeding Staff table...');
        
        // Clear existing staff to avoid primary key conflicts
        await pool.request().query('DELETE FROM Staff');

        const staffData = [
            { staff_id: 'admin', name: 'System Admin', role: 'administrator', pin: '0000', active: true },
            { staff_id: 'manager', name: 'Store Manager', role: 'manager', pin: '1234', active: true },
            { staff_id: 'supervisor', name: 'Shift Supervisor', role: 'supervisor', pin: '5678', active: true },
            { staff_id: 'cashier', name: 'Standard Cashier', role: 'cashier', pin: '9012', active: true }
        ];

        for (const staff of staffData) {
            const req = pool.request();
            Object.entries(staff).forEach(([key, val]) => req.input(key, val));
            
            await req.query(`
                INSERT INTO Staff (staff_id, name, role, pin, active)
                VALUES (@staff_id, @name, @role, @pin, @active)
            `);
            console.log(`Inserted ${staff.name} (${staff.role}) with PIN ${staff.pin}`);
        }

        console.log('Seeding complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding staff:', err.message);
        process.exit(1);
    }
}

seed();
