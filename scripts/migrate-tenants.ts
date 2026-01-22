
import 'dotenv/config'; // Load env vars
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is missing from environment');
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? true : { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🚀 Starting SaaS Migration...');

    // 1. Create the Root Tenant (CrabKhai) if not exists
    let rootTenant = await prisma.tenant.findUnique({
        where: { slug: 'crabkhai' }
    });

    if (!rootTenant) {
        console.log('📦 Creating Root Tenant: CrabKhai...');
        rootTenant = await prisma.tenant.create({
            data: {
                name: 'CrabKhai',
                slug: 'crabkhai',
                customDomain: 'crabkhai.com',
                plan: 'PLATINUM',
                enabledModules: ['ANALYTICS', 'MARKETING', 'INVENTORY'], // Enable all by default for root
            }
        });
        console.log(`✅ Organization created: ${rootTenant.id}`);
    } else {
        console.log(`ℹ️ Root Tenant found: ${rootTenant.id}`);
    }

    const tenantId = rootTenant.id;

    // 2. Assign Tenant ID to all orphan records

    // Users
    const users = await prisma.user.updateMany({
        where: { tenantId: null },
        data: { tenantId }
    });
    console.log(`👥 Migrated ${users.count} Users`);

    // Products
    const products = await prisma.product.updateMany({
        where: { tenantId: null },
        data: { tenantId }
    });
    console.log(`🦀 Migrated ${products.count} Products`);

    // Orders
    const orders = await prisma.order.updateMany({
        where: { tenantId: null },
        data: { tenantId }
    });
    console.log(`📦 Migrated ${orders.count} Orders`);

    // Categories
    const categories = await prisma.category.updateMany({
        where: { tenantId: null },
        data: { tenantId }
    });
    console.log(`📂 Migrated ${categories.count} Categories`);

    // SiteConfig (Use upsert logic or just update if exists)
    // SiteConfig is unique, so we just attach it
    const config = await prisma.siteConfig.updateMany({
        where: { tenantId: null },
        data: { tenantId }
    });
    console.log(`⚙️ Migrated SiteConfig`);

    // Hubs
    const hubs = await prisma.hub.updateMany({
        where: { tenantId: null },
        data: { tenantId }
    });
    console.log(`🏭 Migrated ${hubs.count} Hubs`);

    // Coupons
    const coupons = await prisma.coupon.updateMany({
        where: { tenantId: null },
        data: { tenantId }
    });
    console.log(`🎟️ Migrated ${coupons.count} Coupons`);

    // PromoCards
    const promos = await prisma.promoCard.updateMany({
        where: { tenantId: null },
        data: { tenantId }
    });
    console.log(`📢 Migrated ${promos.count} Promos`);


    console.log('🎉 Migration Complete! All data is now owned by CrabKhai.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
