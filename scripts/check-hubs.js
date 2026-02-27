const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const hubs = await prisma.hub.findMany();
  console.log("Current Hubs:", hubs);

  const defaultHubs = [
    { id: "dhaka-central", name: "Dhaka Central Hub", location: "Dhaka" },
    { id: "khulna-hub", name: "Khulna Hub", location: "Khulna" },
    { id: "chattogram-hub", name: "Chattogram Hub", location: "Chattogram" },
  ];

  for (const hub of defaultHubs) {
    try {
      await prisma.hub.upsert({
        where: { id: hub.id },
        update: {},
        create: hub,
      });
      console.log(`Seeded hub: ${hub.id}`);
    } catch (err) {
      console.error(`Failed to seed ${hub.id}:`, err);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
