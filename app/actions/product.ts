'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

import { getTenantByDomain } from './tenant';

import { auth } from '@/auth';

export async function getAdminProducts(domain?: string) {
    try {
        let tenantId: string | undefined;

        if (domain) {
            const tenant = await getTenantByDomain(domain);
            tenantId = tenant?.id;
        } else {
            const session = await auth();
            tenantId = (session?.user as any)?.tenantId;
        }

        if (!tenantId) return [];

        const products = await (prisma.product.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }, // Latest first is usually better for admin
            select: {
                id: true,
                name: true,
                price: true,
                image: true,
                categoryId: true,
                pieces: true,
                weight: true, // Needed for unit calc
                servingSize: true,
                type: true,
                stage: true,
                sku: true,
                totalSold: true,
                comboItems: {
                    include: { child: { select: { pieces: true } } }
                }
            }
        }) as any);

        return products;
    } catch (error) {
        console.error("Get Admin Products Error:", error);
        return [];
    }
}

export async function getProductById(id: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                comboItems: true,
                sections: { select: { id: true, slug: true } } // Needed for edit form
            }
        });
        return product;
    } catch (error) {
        console.error("Get Product By ID Error:", error);
        return null;
    }
}

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

        const products = await (prisma.product.findMany({
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
                servingSize: true,
                weight: true,
                totalSold: true,
                type: true,
                createdAt: true,
                nutritionImage: true,
                cookingImage: true,
                stage: true,
                sku: true,
                isAvailable: true,
                sections: {
                    select: { slug: true }
                }
            }
        }) as any);

        return products;
    } catch (error) {
        console.error("Get Products Error:", error);
        return [];
    }
}

export async function getProduct(id: string) {
    try {
        const product = await (prisma.product.findUnique({
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
        }) as any);
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

        if (!data.categoryId) return { success: false, error: "Category is required" };

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
                servingSize: parseInt(String(data.servingSize || 1)) || 1,
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
        revalidateTag('home-sections');
        revalidatePath('/', 'layout');
        return { success: true, product };
    } catch (error: any) {
        console.error("Create Product Error:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
            return { success: false, error: "Product with this SKU already exists" };
        }
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
                servingSize: parseInt(String(data.servingSize || 1)) || 1,
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
        revalidateTag('home-sections');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        console.error("Update Product Error:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('sku')) {
            return { success: false, error: "Product with this SKU already exists" };
        }
        return { success: false, error: "Failed to update" };
    }
}

export async function deleteProduct(id: string) {
    try {
        // 1. Check for orders
        const ordersCount = await prisma.orderItem.count({
            where: { productId: id }
        });

        if (ordersCount > 0) {
            return { success: false, error: "failed to deleted ordered item" };
        }

        // 2. Delete dependencies manually (since no Cascade in schema for some)
        await prisma.$transaction([
            prisma.inventory.deleteMany({ where: { productId: id } }),
            prisma.modifier.deleteMany({ where: { productId: id } }),
            prisma.review.deleteMany({ where: { productId: id } }),
            prisma.comboItem.deleteMany({ where: { childId: id } }), // Remove as child from other combos
            prisma.comboItem.deleteMany({ where: { parentId: id } }), // Remove its own combo items
            prisma.product.delete({ where: { id } })
        ]);

        revalidatePath('/admin/products');
        revalidatePath('/admin/inventory');
        revalidateTag('home-sections');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Delete Product Error:", error);
        return { success: false, error: error.message || "Failed to delete product" };
    }
}

export async function archiveProduct(id: string) {
    try {
        await prisma.product.update({
            where: { id },
            data: {
                isAvailable: false,
                stage: "Archived"
            }
        });

        revalidatePath('/admin/products');
        revalidatePath('/admin/inventory');
        revalidateTag('home-sections');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Archive Product Error:", error);
        return { success: false, error: error.message || "Failed to archive product" };
    }
}

export async function unarchiveProduct(id: string) {
    try {
        await prisma.product.update({
            where: { id },
            data: {
                isAvailable: true,
                stage: "Draft"
            }
        });

        revalidatePath('/admin/products');
        revalidatePath('/admin/inventory');
        revalidateTag('home-sections');
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("Unarchive Product Error:", error);
        return { success: false, error: error.message || "Failed to unarchive product" };
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
