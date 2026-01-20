
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        select: {
            id: true,
            name: true,
            image: true,
            images: true
        }
    });

    console.log('Database Products:');
    products.forEach(p => {
        console.log(`- ${p.name} (${p.id}): ${p.image}`);
        if (p.images && p.images.length > 0) {
            console.log(`  Gallery: ${p.images.join(', ')}`);
        }
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
