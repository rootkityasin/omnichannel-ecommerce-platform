'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache } from 'next/cache';
import { getTenantByDomain } from './tenant';

export async function getSections(domain?: string) {
    try {
        const tenant = domain ? await getTenantByDomain(domain) : null;

        const sections = await prisma.productSection.findMany({
            where: domain ? {
                // For now, ProductSection doesn't have tenantId.
                // We handle this similarly to HeroSlide stop-gap.
            } : undefined,
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (domain && !tenant) return [];
        return sections;
    } catch (error) {
        console.error("Failed to fetch sections:", error);
        return [];
    }
}

export const getHomeSections = unstable_cache(
    async (domain?: string) => {
        try {
            const tenant = domain ? await getTenantByDomain(domain) : null;
            if (domain && !tenant) return [];

            const sections = await prisma.productSection.findMany({
                where: {
                    isActive: true,
                    // If we add tenantId to ProductSection, we'd add it here.
                },
                orderBy: { order: 'asc' },
                include: {
                    products: {
                        where: domain ? {
                            tenantId: tenant?.id || 'none'
                        } : undefined,
                        orderBy: { createdAt: 'desc' },
                    }
                }
            });
            return sections.map((section: any) => ({
                ...section,
                createdAt: section.createdAt.toISOString(),
                updatedAt: section.updatedAt.toISOString(),
                products: section.products.map((product: any) => ({
                    ...product,
                    createdAt: product.createdAt.toISOString(),
                }))
            }));
        } catch (error) {
            console.error("Failed to fetch home sections:", error);
            return [];
        }
    },
    ['home-sections'], // Warning: We need to ensure domain uniqueness.
    { revalidate: 3600, tags: ['home-sections'] }
);

export async function createSection(data: { title: string; slug: string; isActive?: boolean; order?: number }) {
    try {
        const section = await prisma.productSection.create({
            data: {
                title: data.title,
                slug: data.slug,
                isActive: data.isActive ?? true,
                order: data.order ?? 0
            }
        });
        revalidatePath('/admin/sections');
        return { success: true, section };
    } catch (error) {
        return { success: false, error: "Failed to create section" };
    }
}

export async function updateSection(id: string, data: { title?: string; slug?: string; isActive?: boolean; order?: number }) {
    try {
        const section = await prisma.productSection.update({
            where: { id },
            data
        });
        revalidatePath('/admin/sections');
        return { success: true, section };
    } catch (error) {
        return { success: false, error: "Failed to update section" };
    }
}

export async function deleteSection(id: string) {
    try {
        await prisma.productSection.delete({ where: { id } });
        revalidatePath('/admin/sections');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete section" };
    }
}

export async function assignProductToSections(productId: string, sectionIds: string[]) {
    try {
        await prisma.product.update({
            where: { id: productId },
            data: {
                sections: {
                    set: sectionIds.map(id => ({ id }))
                }
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to assign sections", error);
        return { success: false, error: "Failed to assign sections" };
    }
}

export async function seedDefaultSections() {
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

    try {
        const products = await prisma.product.findMany({
            take: 10,
            where: { stage: { in: ['Selling', 'Published'] } }
        });
        if (products.length === 0) return;

        const bestSellers = sections.find(s => s.slug === 'best-sellers');
        if (bestSellers) {
            const pIds = products.slice(0, 3).map((p: any) => ({ id: p.id }));
            if (pIds.length > 0) {
                await prisma.productSection.update({
                    where: { id: bestSellers.id },
                    data: { products: { connect: pIds } }
                });
            }
        }

        const newArrivals = sections.find(s => s.slug === 'new-arrivals');
        if (newArrivals) {
            const pIds = products.slice(3, 6).map((p: any) => ({ id: p.id }));
            if (pIds.length > 0) {
                await prisma.productSection.update({
                    where: { id: newArrivals.id },
                    data: { products: { connect: pIds } }
                });
            }
        }

        const superSavings = sections.find(s => s.slug === 'super-savings');
        if (superSavings) {
            const pIds = products.slice(6, 8).map((p: any) => ({ id: p.id }));
            if (pIds.length > 0) {
                await prisma.productSection.update({
                    where: { id: superSavings.id },
                    data: { products: { connect: pIds } }
                });
            }
        }
        revalidatePath('/');
    } catch (error) {
        console.error("Error auto-assigning products during seed:", error);
    }
}

export async function reorderSections(items: { id: string; order: number }[]) {
    try {
        await (prisma as any).$transaction(
            items.map((item) =>
                prisma.productSection.update({
                    where: { id: item.id },
                    data: { order: item.order }
                })
            )
        );
        revalidatePath('/admin/sections');
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder sections:", error);
        return { success: false, error: "Failed to reorder sections" };
    }
}
