require('dotenv').config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/platform-client");

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.PLATFORM_DATABASE_URL
      }
    }
  });
  
  const hashedPassword = await bcrypt.hash("threadiv", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@threadiv.com" },
    update: { password: hashedPassword },
    create: {
      name: "Platform Admin",
      phone: "00000000000",
      email: "admin@threadiv.com",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("Created/Updated Admin:", admin);
  await prisma.$disconnect();
}

main().catch(console.error);
