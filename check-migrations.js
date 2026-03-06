/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
    try {
        const migrations = await prisma.$queryRaw`SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5`;
        console.log("Recent migrations:", migrations);
    } catch (e) {
        console.error("Error finding user:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
