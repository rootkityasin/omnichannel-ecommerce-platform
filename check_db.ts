
import { prisma } from './lib/prisma';

async function main() {
    const configs = await prisma.siteConfig.findMany({
        include: {
            tenant: true
        }
    });

    console.log("Found " + configs.length + " configs");
    configs.forEach(c => {
        console.log(`Tenant: ${c.tenant?.slug} (${c.tenantId})`);
        console.log(`Phone: ${c.contactPhone}`);
        console.log(`Email: ${c.contactEmail}`);
        console.log(`Address: ${c.contactAddress}`);
        console.log(`ShopName: ${c.shopName}`);
        console.log('---');
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
