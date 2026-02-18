
require('dotenv').config(); // Load environment variables
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Connecting to DB...");
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true
        }
    });

    console.log("Users in DB:");
    console.table(users);
}

main()
    .catch((e) => {
        console.error("Script Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
