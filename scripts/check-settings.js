const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const config = await prisma.siteConfig.findFirst();
        console.log("Site Config Measurement Unit:", config ? config.measurementUnit : "No Config Found");
        console.log("Weight Unit Value:", config ? config.weightUnitValue : "N/A");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
