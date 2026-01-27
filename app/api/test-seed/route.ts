import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';

export async function GET() {
    try {
        // const prisma = new PrismaClient(); // Instantiated inside try/catch

        const defaults = [
            { title: 'Best Sellers', slug: 'best-sellers', order: 0 },
            { title: 'New Arrivals', slug: 'new-arrivals', order: 1 },
            { title: 'Super Savings', slug: 'super-savings', order: 2 },
        ];

        const sections = [];

        for (const s of defaults) {
            const existing = await prisma.productSection.findUnique({ where: { slug: s.slug } });
            if (!existing) {
                const created = await prisma.productSection.create({ data: { ...s, isActive: true } });
                sections.push(created);
            } else {
                sections.push(existing);
            }
        }

        // Assign products
        const products = await prisma.product.findMany({ take: 10 });

        // Best Sellers
        const bestSellers = sections.find(s => s.slug === 'best-sellers');
        if (bestSellers && products.length > 0) {
            const pIds = products.slice(0, 3).map((p: any) => ({ id: p.id }));
            await prisma.productSection.update({
                where: { id: bestSellers.id },
                data: { products: { connect: pIds } }
            });
        }

        // New Arrivals
        const newArrivals = sections.find(s => s.slug === 'new-arrivals');
        if (newArrivals && products.length > 3) {
            const pIds = products.slice(3, 6).map((p: any) => ({ id: p.id }));
            await prisma.productSection.update({
                where: { id: newArrivals.id },
                data: { products: { connect: pIds } }
            });
        }

        // Super Savings
        const superSavings = sections.find(s => s.slug === 'super-savings');
        if (superSavings && products.length > 6) {
            const pIds = products.slice(6, 8).map((p: any) => ({ id: p.id }));
            await prisma.productSection.update({
                where: { id: superSavings.id },
                data: { products: { connect: pIds } }
            });
        }

        // await prisma.$disconnect();
        return NextResponse.json({ success: true, message: "Seeding complete (Lazy Instantiation)" });
    } catch (error: any) {
        const msg = String(error) + '\n' + (error.stack || '');
        console.error(msg);
        try {
            fs.writeFileSync('seed-log.txt', msg);
        } catch (e) {
            console.error("Failed to write log", e);
        }
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
