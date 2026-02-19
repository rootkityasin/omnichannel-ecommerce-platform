import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { name: true, phone: true, email: true },
  });

  if (admin) {
    console.log("Super Admin Found:");
    console.log(`Name: ${admin.name}`);
    console.log(`Phone: ${admin.phone}`);
    console.log(`Email: ${admin.email}`);
  } else {
    console.log("No Super Admin found.");
  }
}

try {
  await main();
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
