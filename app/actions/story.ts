'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getStorySections() {
    try {
        const sections = await prisma.storySection.findMany();
        return sections.map((section: any) => ({
            ...section,
            updatedAt: section.updatedAt.toISOString()
        }));
    } catch (error) {
        console.error("Failed to fetch story sections:", error);
        return [];
    }
}

export async function updateStorySection(type: string, content: any) {
    try {
        await prisma.storySection.upsert({
            where: { type },
            update: { content },
            create: { type, content }
        });
        revalidatePath('/story'); // Update the public page
        revalidatePath('/admin/landing'); // Update the admin page
        return { success: true };
    } catch (error) {
        console.error(`Failed to update story section ${type}:`, error);
        return { success: false, error: "Failed to update section" };
    }
}

export async function getAllProductsSimple() {
    try {
        const products = await prisma.product.findMany({
            select: { id: true, name: true, image: true, price: true }
        });
        return products;
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

export async function getProductsByIds(ids: string[]) {
    try {
        if (!ids || ids.length === 0) return [];
        const products = await prisma.product.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, image: true, price: true, description: true }
        });
        return products;
    } catch (error) {
        console.error("Failed to fetch products by IDs:", error);
        return [];
    }
}
