const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching Site Configs...");
        const configs = await prisma.siteConfig.findMany({
            include: {
                tenant: {
                    select: {
                        slug: true,
                        customDomain: true
                    }
                }
            }
        });
        console.log(JSON.stringify(configs, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
