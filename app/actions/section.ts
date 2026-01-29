'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
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

export async function getHomeSections(domain?: string) {
    return unstable_cache(
        async () => {
            try {
                const tenant = domain ? await getTenantByDomain(domain) : null;
                if (domain && !tenant) return [];

                const sections = await prisma.productSection.findMany({
                    where: {
                        isActive: true,
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
        ['home-sections', domain ?? 'global'],
        { revalidate: 3600, tags: ['home-sections'] }
    )();
}

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
        revalidatePath('/');
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
        revalidatePath('/');
        return { success: true, section };
    } catch (error) {
        return { success: false, error: "Failed to update section" };
    }
}

export async function deleteSection(id: string) {
    try {
        await prisma.productSection.delete({ where: { id } });
        revalidatePath('/admin/sections');
        revalidatePath('/');
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

export async function seedDefaultSections(domain?: string) {
    const tenant = domain ? await getTenantByDomain(domain) : null;
    const tenantId = tenant?.id;

    const defaults = [
        { title: 'Best Sellers', slug: 'best-sellers', order: 0 },
        { title: 'New Arrivals', slug: 'new-arrivals', order: 1 },
        { title: 'Super Savings', slug: 'super-savings', order: 2 },
    ];

    const sections = [];
    for (const s of defaults) {
        // Upsert to ensure they exist and are active
        const section = await prisma.productSection.upsert({
            where: { slug: s.slug },
            update: { isActive: true, order: s.order },
            create: { ...s, isActive: true }
        });
        sections.push(section);
    }

    try {
        // Check if products exist for this tenant
        const productCount = await prisma.product.count({
            where: tenantId ? { tenantId } : undefined
        });

        if (productCount === 0) {
            console.log(`No products found for tenant ${tenantId || 'global'}. Creating sample products...`);
            const sampleProducts = [
                {
                    title: "Premium Mud Crab",
                    price: 2500,
                    image: "https://images.unsplash.com/photo-1569389397653-c04fe9b4cf26?auto=format&fit=crop&q=80&w=1000",
                    category: "Live Crab"
                },
                {
                    title: "Jumbo Tiger Shrimp",
                    price: 1800,
                    image: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&q=80&w=1000",
                    category: "Shrimp"
                },
                {
                    title: "Fresh Lobster",
                    price: 4500,
                    image: "https://images.unsplash.com/photo-1559304822-9eb2813c9844?auto=format&fit=crop&q=80&w=1000",
                    category: "Lobster"
                },
                {
                    title: "Atlantic Salmon",
                    price: 3200,
                    image: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&q=80&w=1000",
                    category: "Fish"
                },
                {
                    title: "Yellowfin Tuna",
                    price: 2800,
                    image: "https://images.unsplash.com/photo-1543336582-8998ab58022a?auto=format&fit=crop&q=80&w=1000",
                    category: "Fish"
                },
                {
                    title: "King Scallops",
                    price: 2100,
                    image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&q=80&w=1000",
                    category: "Shellfish"
                }
            ];

            // Create Sample Products
            const createdProducts = [];
            for (const p of sampleProducts) {
                // Ensure Category Exists
                const catSlug = p.category.toLowerCase().replace(/ /g, '-');
                const category = await prisma.category.upsert({
                    where: { slug: catSlug }, // Categories are currently global, or we need to scope them too? 
                    // To be safe, if we have tenant, we should scope. But schema says Category has tenantId.
                    // Let's assume global categories for now to minimize breakage, as existing code might rely on it.
                    // Or actually, let's try to fetch active category for tenant?
                    // For now, let's stick to global categories to avoid "category not found" in other parts if they are shared.
                    // BUT products MUST be scoped.
                    update: {},
                    create: { title: p.category, slug: catSlug, imageUrl: p.image }
                });

                const product = await prisma.product.create({
                    data: {
                        tenantId, // Assign to tenant!
                        title: p.title,
                        slug: p.title.toLowerCase().replace(/ /g, '-'),
                        price: p.price,
                        image: p.image,
                        categoryId: category.id,
                        stage: 'Published',
                        stock: 50,
                        description: "Fresh premium seafood sourced daily.",
                        isNonVeg: true
                    }
                });
                createdProducts.push(product);
            }

            // Assign created products to sections
            // Best Sellers
            const bestSellers = sections.find(s => s.slug === 'best-sellers');
            if (bestSellers) {
                await prisma.productSection.update({
                    where: { id: bestSellers.id },
                    data: { products: { connect: createdProducts.slice(0, 3).map(p => ({ id: p.id })) } }
                });
            }
            // New Arrivals
            const newArrivals = sections.find(s => s.slug === 'new-arrivals');
            if (newArrivals) {
                await prisma.productSection.update({
                    where: { id: newArrivals.id },
                    data: { products: { connect: createdProducts.slice(3, 6).map(p => ({ id: p.id })) } }
                });
            }

            // Super Savings (Mix)
            const superSavings = sections.find(s => s.slug === 'super-savings');
            if (superSavings) {
                await prisma.productSection.update({
                    where: { id: superSavings.id },
                    data: { products: { connect: [{ id: createdProducts[0].id }, { id: createdProducts[4].id }] } }
                });
            }

        } else {
            // Existing Logic for assigning existing products
            const products = await prisma.product.findMany({
                take: 10,
                where: {
                    stage: { in: ['Selling', 'Published'] },
                    tenantId: tenantId || undefined // Filter by tenant if present
                }
            });

            // Same logic as before if products exist
            const bestSellers = sections.find(s => s.slug === 'best-sellers');
            if (bestSellers) {
                await prisma.productSection.update({
                    where: { id: bestSellers.id },
                    data: { products: { connect: products.slice(0, 3).map((p: any) => ({ id: p.id })) } }
                });
            }

            const newArrivals = sections.find(s => s.slug === 'new-arrivals');
            if (newArrivals) {
                await prisma.productSection.update({
                    where: { id: newArrivals.id },
                    // Disconnect all first to avoid duplicates? No, connect is additive.
                    data: { products: { connect: products.slice(3, 6).map((p: any) => ({ id: p.id })) } }
                });
            }
            const superSavings = sections.find(s => s.slug === 'super-savings');
            if (superSavings) {
                await prisma.productSection.update({
                    where: { id: superSavings.id },
                    data: { products: { connect: products.slice(6, 8).map((p: any) => ({ id: p.id })) } }
                });
            }
        }

        revalidateTag('home-sections', {});
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
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to reorder sections:", error);
        return { success: false, error: "Failed to reorder sections" };
    }
}
