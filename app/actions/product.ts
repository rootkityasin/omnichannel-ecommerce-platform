'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getTenantByDomain } from './tenant';

import { auth } from '@/auth';

export async function getProducts(domain?: string) {
    try {
        let tenantId: string | undefined;

        if (domain) {
            const tenant = await getTenantByDomain(domain);
            tenantId = tenant?.id;
        } else {
            const session = await auth();
            tenantId = (session?.user as any)?.tenantId;
        }

        if (!tenantId) {
            // If we can't determine context, return empty to be safe/fast
            // or return strictly public variants? For Admin, empty is safer.
            return [];
        }

        const products = await prisma.product.findMany({
            where: {
                tenantId: tenantId
            },
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
            }
        });

        return products;
    } catch (error) {
        console.error("Get Products Error:", error);
        return [];
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
        const session = await auth();
        const tenantId = (session?.user as any)?.tenantId;
        if (!tenantId) return { success: false, error: "Unauthorized" };

        const product = await prisma.product.create({
            data: {
                tenantId,
                name: data.name,
                sku: data.sku,
                price: parseInt(String(data.price || 0)) || 0,
                description: data.description,
                descriptionSwap: data.descriptionSwap || false,
                image: data.image,
                pieces: parseInt(String(data.pieces || 0)) || 0,
                weight: parseInt(String(data.weight || 0)) || 0,
                stage: data.stage,
                categoryId: data.categoryId,
                images: data.images || [],
                type: data.type || 'SINGLE',
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
                sku: data.sku,
                price: parseInt(String(data.price || 0)) || 0,
                pieces: parseInt(String(data.pieces || 0)) || 0,
                image: data.image,
                images: data.images || [],
                weight: parseInt(String(data.weight || 0)) || 0,
                description: data.description,
                descriptionSwap: data.descriptionSwap,
                stage: data.stage,
                sections: data.sections ? {
                    set: data.sections.map((id: string) => ({ id }))
                } : undefined,
            }
        });
        revalidatePath('/admin/products');
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        console.error("Update Product Error:", error);
        return { success: false, error: "Failed to update" };
    }
}

export async function deleteProduct(id: string) {
    try {
        await prisma.product.delete({ where: { id } });
        revalidatePath('/admin/products');
        revalidatePath('/admin/inventory');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete" };
    }
}

export async function generateUniqueSku() {
    try {
        const products = await prisma.product.findMany({
            select: { sku: true }
        });

        let maxId = 0;
        for (const p of products) {
            if (p.sku && /^\d+$/.test(p.sku)) {
                const num = parseInt(p.sku, 10);
                if (num > maxId) maxId = num;
            }
        }
        const nextId = maxId + 1;
        const sku = nextId.toString().padStart(4, '0');
        return { success: true, sku };
    } catch (error) {
        console.error("SKU Gen Error:", error);
        return { success: false, error: "Generation failed" };
    }
}
