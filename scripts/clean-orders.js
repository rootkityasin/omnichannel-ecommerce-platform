const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Cleaning all orders...');
        const result = await prisma.order.deleteMany({});
        console.log(`Deleted ${result.count} orders.`);
    } catch (error) {
        console.error('Error cleaning orders:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
