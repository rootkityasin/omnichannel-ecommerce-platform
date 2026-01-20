'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Simple in-memory cache with TTL
let categoriesCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getCategories() {
    // Return cached data if still valid
    const now = Date.now();
    if (categoriesCache.data && (now - categoriesCache.timestamp) < CACHE_TTL) {
        return categoriesCache.data;
    }

    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        // Update cache
        categoriesCache = { data: categories, timestamp: now };
        return categories;
    } catch (error) {
        return categoriesCache.data || []; // Return stale cache on error
    }
}

export async function createCategory(name: string, animationType: string = "AUTO", icon: string = "Package") {
    try {
        const category = await prisma.category.create({
            data: {
                name,
                animationType,
                icon
            }
        });
        // Invalidate cache
        categoriesCache = { data: null, timestamp: 0 };
        revalidatePath('/admin/categories');
        return { success: true, category };
    } catch (error) {
        return { success: false, error: "Failed to create category" };
    }
}

export async function deleteCategory(id: string) {
    try {
        await prisma.category.delete({ where: { id } });
        // Invalidate cache
        categoriesCache = { data: null, timestamp: 0 };
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete" };
    }
}

export async function updateCategory(id: string, name: string, animationType?: string, icon?: string) {
    try {
        await prisma.category.update({
            where: { id },
            data: {
                name,
                ...(animationType && { animationType }),
                ...(icon && { icon })
            }
        });
        // Invalidate cache
        categoriesCache = { data: null, timestamp: 0 };
        revalidatePath('/admin/categories');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update" };
    }
}
