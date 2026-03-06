/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
    try {
        const user = await prisma.user.findFirst();
        console.log("Success:", user);
    } catch (e) {
        console.error("Error finding user:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
