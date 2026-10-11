
const { sql, poolPromise } = require('../db');

async function migrate() {
    try {
        const pool = await poolPromise;
        console.log('Connected to MSSQL to apply migrations...');

        // 1. Add password_hash column if it doesn't exist
        try {
            await pool.request().query(`
                IF NOT EXISTS (
                    SELECT * FROM sys.columns 
                    WHERE object_id = OBJECT_ID('Users') AND name = 'password_hash'
                )
                BEGIN
                    ALTER TABLE Users ADD password_hash NVARCHAR(255);
                    PRINT 'Added password_hash column to Users table.';
                END
            `);
            console.log('Schema update checked/applied.');
        } catch (err) {
            console.error('Error altering table:', err.message);
        }

        // 2. Seed Default Admin
        try {
            const result = await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM Users WHERE email = 'admin@centcom.com')
                BEGIN
                    INSERT INTO Users (id, email, full_name, password_hash, role)
                    VALUES (CONVERT(NVARCHAR(36), NEWID()), 'admin@centcom.com', 'CENTCOM Commander', 'SUPERVISOR-OMEGA-1', 'admin');
                    SELECT 'Seeded' as status;
                END
                ELSE
                BEGIN
                    -- Update password just in case it was wrong
                    UPDATE Users 
                    SET password_hash = 'SUPERVISOR-OMEGA-1', role = 'admin'
                    WHERE email = 'admin@centcom.com';
                    SELECT 'Updated' as status;
                END
            `);
             console.log('Seed status:', result.recordset[0] ? result.recordset[0].status : 'Already exists');
        } catch (err) {
            console.error('Error seeding admin:', err.message);
        }

        console.log('Migration complete.');
        process.exit(0);

    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
