
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const log = [];

        // 1. Get Sections
        let sections = await prisma.productSection.findMany({
            include: { _count: { select: { products: true } }, products: true }
        });

        // 2. Ensure Defaults exist if none
        if (sections.length === 0) {
            log.push("No sections found. Seeding defaults...");
            const defaults = [
                { title: 'Best Sellers', slug: 'best-sellers', order: 0 },
                { title: 'New Arrivals', slug: 'new-arrivals', order: 1 },
                { title: 'Super Savings', slug: 'super-savings', order: 2 },
            ];
            for (const d of defaults) {
                await prisma.productSection.create({ data: { ...d, isActive: true } });
            }
            // Refetch
            sections = await prisma.productSection.findMany({
                include: { _count: { select: { products: true } }, products: true }
            });
        }

        // 3. Get Available Products
        const products = await prisma.product.findMany({
            where: { stage: { in: ['Selling', 'Published', 'Coming Soon'] } },
            take: 20
        });

        if (products.length === 0) {
            return NextResponse.json({ success: false, error: "No products available to assign" }, { status: 404 });
        }

        log.push(`Found ${products.length} available products.`);

        // 4. Assign Products to Empty Sections
        let updatedCount = 0;
        for (const section of sections) {
            if (section.products.length === 0) {
                // Assign random subset (e.g., 3-5 products)
                const shuffled = products.sort(() => 0.5 - Math.random());
                const selected = shuffled.slice(0, 4);

                await prisma.productSection.update({
                    where: { id: section.id },
                    data: {
                        products: {
                            connect: selected.map((p: any) => ({ id: p.id }))
                        }
                    }
                });
                log.push(`Assigned ${selected.length} products to '${section.title}'`);
                updatedCount++;
            } else {
                log.push(`Section '${section.title}' already has ${section.products.length} products.`);
            }
        }

        return NextResponse.json({ success: true, updatedSections: updatedCount, log });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
