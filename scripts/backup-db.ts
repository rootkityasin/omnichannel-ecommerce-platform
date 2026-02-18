
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

async function backup() {
    console.log('📦 Starting database backup (Prisma Client)...');

    const customPath = process.argv[2];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupRoot = customPath ? customPath : path.join(process.cwd(), 'backups');
    const backupDir = path.join(backupRoot, timestamp);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
        // Get all table names (Postgres specific)
        const tablesResult: { table_name: string }[] = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            AND table_name != '_prisma_migrations';
        `;

        const tables = tablesResult.map(r => r.table_name);
        console.log(`Found ${tables.length} tables to backup.`);

        for (const table of tables) {
            console.log(`  Targeting table: ${table}`);
            // Use Unsafe for dynamic table name
            const data: unknown[] = await prisma.$queryRawUnsafe(`SELECT * FROM "${table}"`);

            const filePath = path.join(backupDir, `${table}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`  ✓ Saved ${data.length} rows to ${table}.json`);
        }

        console.log(`\n✅ Backup completed successfully!`);
        console.log(`📂 Location: ${backupDir}`);

    } catch (e) {
        console.error('❌ Backup failed:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

backup();
