
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { prisma } from '../lib/prisma';

async function restore() {
    console.log('🔄 Starting database restore (Prisma Client)...');

    const backupFolder = process.argv[2];
    if (!backupFolder) {
        console.error('❌ No backup folder specified.');
        process.exit(1);
    }

    if (!fs.existsSync(backupFolder)) {
        console.error(`❌ Backup folder not found: ${backupFolder}`);
        process.exit(1);
    }

    try {
        console.log(`📂 Reading backup from: ${backupFolder}`);

        const files = fs.readdirSync(backupFolder).filter(f => f.endsWith('.json'));
        if (files.length === 0) {
            console.error('❌ No JSON backup files found in directory.');
            process.exit(1);
        }

        const ORDERED_TABLES = [
            // Level 0 (No dependencies)
            'Tenant', 'Plan', 'HeroSlide', 'StorySection', 'ProductSection',
            'TrackingEvent', 'Notification', 'TrustedDevice', 'SecurityLog', 'VerificationToken',

            // Level 1 (+Tenant)
            'SiteConfig', 'PaymentConfig', 'DeliveryConfig', 'Category', 'PromoCard', 'Coupon', 'AuditLog',

            // Level 1 (+Tenant/Hub)
            'Hub',

            // Level 2 (+Hub)
            'Freezer', 'Expense',

            // Level 2 (+Hub/Tenant) -> User
            'User',

            // Level 3 (+User)
            'Account', 'Session',

            // Level 3 (+Category/Tenant) -> Product
            'Product',

            // Level 4 (+Product)
            'Modifier', 'Review', 'ComboItem', '_ProductToProductSection',

            // Level 4 (+Hub/Tenant) -> Order
            'Order',

            // Level 5 (+Order/Product)
            'OrderItem',

            // Level 5 (+Freezer/Product/Hub)
            'Inventory'
        ];

        // 1. Clean up database (Delete in Reverse Order)
        const REVERSE_TABLES = [...ORDERED_TABLES].reverse();
        console.log('🧹 Cleaning up database (ordered delete)...');

        for (const table of REVERSE_TABLES) {
            try {
                // Use DELETE instead of TRUNCATE to avoid permission issues
                // We ignore "table does not exist" errors
                await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
                // console.log(`    Deleted ${table}`);
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                if (!msg.includes('does not exist') && !msg.includes('relation') && !msg.includes('42P01')) {
                    console.warn(`    Warning deleting ${table}: ${msg}`);
                }
            }
        }

        // Fetch column types to handle JSON/Array serialization correctly
        const columnsMeta: { table_name: string, column_name: string, udt_name: string }[] = await prisma.$queryRaw`
            SELECT table_name, column_name, udt_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public';
        `;

        const columnTypes: Record<string, Record<string, string>> = {};
        for (const meta of columnsMeta) {
            if (!columnTypes[meta.table_name]) columnTypes[meta.table_name] = {};
            columnTypes[meta.table_name][meta.column_name] = meta.udt_name;
        }

        // 2. Restore Data (Insert in Order)

        // Filter and sort files based on ORDERED_TABLES
        const sortedFiles = files.sort((a, b) => {
            const tableA = path.basename(a, '.json');
            const tableB = path.basename(b, '.json');
            const indexA = ORDERED_TABLES.indexOf(tableA);
            const indexB = ORDERED_TABLES.indexOf(tableB);

            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1; // Put unknown last
            if (indexB === -1) return -1;

            return indexA - indexB;
        });

        console.log('📥 Insert data (ordered insert)...');

        for (const file of sortedFiles) {
            const tableName = path.basename(file, '.json');
            const filePath = path.join(backupFolder, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const rows = JSON.parse(content);

            console.log(`  Targeting table: ${tableName} (${rows.length} rows)`);

            if (rows.length > 0) {
                const chunkSize = 100; // Smaller chunk size

                for (let i = 0; i < rows.length; i += chunkSize) {
                    const chunk = rows.slice(i, i + chunkSize);

                    if (chunk.length === 0) continue;

                    // Get columns from first row of chunk
                    const keys = Object.keys(chunk[0]);
                    const columns = keys.map(k => `"${k}"`).join(', ');

                    const values: unknown[] = [];
                    const placeholders: string[] = [];
                    let paramIndex = 1;

                    chunk.forEach((row: Record<string, unknown>) => {
                        const rowPlaceholders: string[] = [];
                        keys.forEach((key) => {
                            let val = row[key];
                            const type = columnTypes[tableName]?.[key];

                            // Check if column is JSON/JSONB and value is object/array
                            if ((type === 'json' || type === 'jsonb') && val !== null && typeof val === 'object') {
                                val = JSON.stringify(val);
                            }

                            values.push(val);
                            rowPlaceholders.push(`$${paramIndex++}`);
                        });
                        placeholders.push(`(${rowPlaceholders.join(', ')})`);
                    });

                    const query = `
                        INSERT INTO "${tableName}" (${columns})
                        VALUES ${placeholders.join(', ')}
                    `;

                    await prisma.$executeRawUnsafe(query, ...values);
                }
                console.log(`    ✓ Restored ${rows.length} rows.`);
            } else {
                console.log(`    (Skipping insert, 0 rows)`);
            }
        }

        console.log(`\n✅ Restore completed successfully!`);

    } catch (e) {
        console.error('❌ Restore failed:', JSON.stringify(e, null, 2));
        if (e instanceof Error) console.error(e.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

restore();
