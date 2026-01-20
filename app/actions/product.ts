'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Simple in-memory cache with TTL for products
let productsCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function getProducts() {
    const now = Date.now();
    if (productsCache.data && (now - productsCache.timestamp) < CACHE_TTL) {
        return productsCache.data;
    }

    try {
        const products = await prisma.product.findMany({
            orderBy: { sku: 'asc' },
            select: {
                id: true,
                name: true,
                name_bn: true,
                price: true,
                image: true,
                images: true,
                categoryId: true,
                pieces: true,
                totalSold: true,
                type: true,
                createdAt: true,
                nutritionImage: true,
                cookingImage: true,
                stage: true,
                // Only select what's absolutely necessary for the menu and modal
                // to keep the payload size small and query fast.
            }
        });

        productsCache = { data: products, timestamp: now };
        return products;
    } catch (error) {
        console.error("Get Products Error:", error);
        return productsCache.data || [];
    }
}

export async function getProduct(id: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                sections: true,
                comboItems: {
                    include: {
                        child: true
                    }
                }
            }
        });
        return product;
    } catch (error) {
        return null;
    }
}

export async function createProduct(data: any) {
    try {
        const product = await prisma.product.create({
            data: {
                name: data.name,
                sku: data.sku, // Added SKU
                price: parseInt(String(data.price || 0)) || 0,
                description: data.description,
                descriptionSwap: data.descriptionSwap || false,
                image: data.image,
                pieces: parseInt(String(data.pieces || 0)) || 0, // Initial Stock
                weight: parseInt(String(data.weight || 0)) || 0,
                stage: data.stage, // Add Stage
                categoryId: data.categoryId,
                images: data.images || [], // Add images
                type: data.type || 'SINGLE', // Default to SINGLE
                sections: data.sections && data.sections.length > 0 ? {
                    connect: data.sections.map((id: string) => ({ id }))
                } : undefined,
                comboItems: data.type === 'COMBO' && data.comboItems ? {
                    create: data.comboItems.map((item: any) => ({
                        childId: item.childId,
                        quantity: parseInt(item.quantity)
                    }))
                } : undefined
            }
        });
        // Invalidate cache
        productsCache = { data: null, timestamp: 0 };
        revalidatePath('/admin/products');
        revalidatePath('/admin/inventory');
        return { success: true, product };
    } catch (error) {
        console.error("Create Product Error:", error);
        return { success: false, error: "Failed to create product" };
    }
}

export async function updateProduct(id: string, data: any) {
    try {
        await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                sku: data.sku, // Added SKU
                price: parseInt(String(data.price || 0)) || 0,
                pieces: parseInt(String(data.pieces || 0)) || 0, // Explicit stock update
                image: data.image,
                images: data.images || [], // Add images
                weight: parseInt(String(data.weight || 0)) || 0,
                description: data.description,
                descriptionSwap: data.descriptionSwap,
                stage: data.stage, // Add Stage
                sections: data.sections ? {
                    set: data.sections.map((id: string) => ({ id }))
                } : undefined,
                // Add other fields
            }
        });
        // Invalidate cache
        productsCache = { data: null, timestamp: 0 };
        revalidatePath('/admin/products');
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to update" };
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({ where: { id } });
        // Invalidate cache
        productsCache = { data: null, timestamp: 0 };
        revalidatePath('/admin/products');
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete" };
    }
}

export async function generateUniqueSku() {
    try {
        // Fetch all SKUs to find the highest number
        const products = await prisma.product.findMany({
            select: { sku: true }
        });

        let maxId = 0;

        for (const p of products) {
            // Strictly parse integers, ignoring anything with non-digits
            // "0005" -> 5
            // "SKU-123" -> NaN (ignored so it won't break sequence)
            if (p.sku && /^\d+$/.test(p.sku)) {
                const num = parseInt(p.sku, 10);
                if (num > maxId) maxId = num;
            }
        }

        // Increment
        const nextId = maxId + 1;
        // Pad to ensure at least 4 digits: 1 -> "0001"
        const sku = nextId.toString().padStart(4, '0');

        return { success: true, sku };
    } catch (error) {
        console.error("SKU Gen Error:", error);
        return { success: false, error: "Generation failed" };
    }
}
