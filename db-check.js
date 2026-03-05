require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'User'`;
        console.log("Columns in User table:", columns);
    } catch (e) {
        console.error("Full Error:", JSON.stringify(e, null, 2));
        console.error(e)
    } finally {
        await prisma.$disconnect();
    }
}

main();
