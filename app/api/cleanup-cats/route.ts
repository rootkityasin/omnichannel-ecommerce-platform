
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const badCategoryNames = ['Best Sellers', 'New Arrivals', 'Super Savings', 'Others'];

        // 1. Find Bad Categories
        const badCategories = await prisma.category.findMany({
            where: { name: { in: badCategoryNames } },
            include: { _count: { select: { products: true } } }
        });

        // 2. Find/Create Target
        let targetCategory = await prisma.category.findFirst({
            where: { name: { in: ['Ready to Eat', 'Uncategorized', 'General'] } }
        });

        if (!targetCategory) {
            targetCategory = await prisma.category.create({ data: { name: 'Uncategorized' } });
        }

        const log = [`Target Category: ${targetCategory.name}`];
        let reassignCount = 0;

        // 3. Reassign
        for (const badCat of badCategories) {
            if (badCat._count.products > 0) {
                const updated = await prisma.product.updateMany({
                    where: { categoryId: badCat.id },
                    data: { categoryId: targetCategory.id }
                });
                reassignCount += updated.count;
                log.push(`Reassigned ${updated.count} products from ${badCat.name}`);
            }
        }

        // 4. Delete
        const deleted = await prisma.category.deleteMany({
            where: { id: { in: badCategories.map((c: any) => c.id) } }
        });

        return NextResponse.json({
            success: true,
            deletedCategories: deleted.count,
            reassignedProducts: reassignCount,
            log
        });

    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, stack: e.stack }, { status: 500 });
    }
}
