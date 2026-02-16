
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("123456", 10);

    const admin = await prisma.user.create({
        data: {
            name: "Super Admin",
            phone: "01804221161",
            email: "admin@crabkhai.com", // Added Required Email
            password: hashedPassword,
            role: "SUPER_ADMIN"
        }
    });

    console.log("Created Admin:", admin);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
