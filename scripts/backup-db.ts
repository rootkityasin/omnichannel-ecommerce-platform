import 'dotenv/config';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL is missing in .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function backup() {
    console.log('📦 Starting database backup...');

    // Get custom path from args or default to current directory
    const customPath = process.argv[2];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Use custom path if provided, otherwise default to project/backups
    const backupRoot = customPath ? customPath : path.join(process.cwd(), 'backups');
    const backupDir = path.join(backupRoot, timestamp);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const client = await pool.connect();

    try {
        // Get all table names
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        const tables = res.rows.map(r => r.table_name);
        console.log(`Found ${tables.length} tables to backup.`);

        for (const table of tables) {
            // Exclude migration tables if desired, but backing up everything is safer
            console.log(`  Targeting table: ${table}`);
            const data = await client.query(`SELECT * FROM "${table}"`);

            const filePath = path.join(backupDir, `${table}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data.rows, null, 2));
            console.log(`  ✓ Saved ${data.rowCount} rows to ${table}.json`);
        }

        console.log(`\n✅ Backup completed successfully!`);
        console.log(`📂 Location: ${backupDir}`);

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('❌ Backup failed:', message);
    } finally {
        client.release();
        await pool.end();
    }
}

backup();
