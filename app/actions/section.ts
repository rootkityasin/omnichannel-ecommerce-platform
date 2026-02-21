"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import { getTenantByDomain } from "./tenant";

export async function getSections(domain?: string) {
  try {
    const tenant = domain ? await getTenantByDomain(domain) : null;

    const sections = await prisma.productSection.findMany({
      where: domain
        ? {
            // For now, ProductSection doesn't have tenantId.
            // We handle this similarly to HeroSlide stop-gap.
          }
        : undefined,
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
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

        let sections = await prisma.productSection.findMany({
          where: {
            isActive: true,
          },
          orderBy: { order: "asc" },
          include: {
            products: {
              where: domain
                ? {
                    tenantId: tenant?.id || "none",
                    isAvailable: true,
                  }
                : { isAvailable: true },
              orderBy: { createdAt: "desc" },
              take: 12, // Limit to recent 12 products per section
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                images: true,
                sku: true,
                isAvailable: true,
                stage: true,
                categoryId: true,
                tenantId: true,
                createdAt: true,
                pieces: true,
                weight: true,
              },
            },
          },
        });

        // Auto-Seed if no sections found (Self-Healing for new envs)
        if (sections.length === 0) {
          console.log(
            "[Auto-Seed] No home sections found. Creating defaults...",
          );
          await seedDefaultSections(domain);

          // Re-fetch after seeding
          sections = await prisma.productSection.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            include: {
              products: {
                where: domain ? { tenantId: tenant?.id || "none" } : undefined,
                orderBy: { createdAt: "desc" },
                take: 12,
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                  images: true,
                  sku: true,
                  isAvailable: true,
                  stage: true,
                  categoryId: true,
                  tenantId: true,
                  createdAt: true,
                  pieces: true,
                  weight: true,
                },
              },
            },
          });
        }

        return sections.map((section) => ({
          ...section,
          createdAt: section.createdAt.toISOString(),
          updatedAt: section.updatedAt.toISOString(),
          products: section.products.map((product) => ({
            ...product,
            createdAt: product.createdAt.toISOString(),
          })),
        }));
      } catch (error) {
        console.error("Failed to fetch home sections:", error);
        return [];
      }
    },
    ["home-sections", domain ?? "global"],
    { revalidate: 60, tags: ["home-sections"] },
  )();
}

export async function createSection(data: {
  title: string;
  slug: string;
  isActive?: boolean;
  order?: number;
}) {
  try {
    const section = await prisma.productSection.create({
      data: {
        title: data.title,
        slug: data.slug,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
      },
    });
    revalidatePath("/admin/sections");
    revalidatePath("/");
    return { success: true, section };
  } catch (error) {
    console.error("Failed to create section:", error);
    return { success: false, error: "Failed to create section" };
  }
}

export async function updateSection(
  id: string,
  data: { title?: string; slug?: string; isActive?: boolean; order?: number },
) {
  try {
    const section = await prisma.productSection.update({
      where: { id },
      data,
    });
    revalidatePath("/admin/sections");
    revalidatePath("/");
    return { success: true, section };
  } catch (error) {
    console.error("Failed to update section:", error);
    return { success: false, error: "Failed to update section" };
  }
}

export async function deleteSection(id: string) {
  try {
    await prisma.productSection.delete({ where: { id } });
    revalidatePath("/admin/sections");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete section:", error);
    return { success: false, error: "Failed to delete section" };
  }
}

export async function assignProductToSections(
  productId: string,
  sectionIds: string[],
) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: {
        sections: {
          set: sectionIds.map((id) => ({ id })),
        },
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to assign sections", error);
    return { success: false, error: "Failed to assign sections" };
  }
}

const DEFAULT_SECTIONS = [
  { title: "Best Sellers", slug: "best-sellers", order: 0 },
  { title: "New Arrivals", slug: "new-arrivals", order: 1 },
  { title: "Super Savings", slug: "super-savings", order: 2 },
];

const SAMPLE_PRODUCTS = [
  {
    title: "Premium Mud Crab",
    price: 2500,
    image:
      "https://images.unsplash.com/photo-1569389397653-c04fe9b4cf26?auto=format&fit=crop&q=80&w=1000",
    category: "Live Crab",
  },
  {
    title: "Jumbo Tiger Shrimp",
    price: 1800,
    image:
      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&q=80&w=1000",
    category: "Shrimp",
  },
  {
    title: "Fresh Lobster",
    price: 4500,
    image:
      "https://images.unsplash.com/photo-1559304822-9eb2813c9844?auto=format&fit=crop&q=80&w=1000",
    category: "Lobster",
  },
  {
    title: "Atlantic Salmon",
    price: 3200,
    image:
      "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?auto=format&fit=crop&q=80&w=1000",
    category: "Fish",
  },
  {
    title: "Yellowfin Tuna",
    price: 2800,
    image:
      "https://images.unsplash.com/photo-1543336582-8998ab58022a?auto=format&fit=crop&q=80&w=1000",
    category: "Fish",
  },
  {
    title: "King Scallops",
    price: 2100,
    image:
      "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&q=80&w=1000",
    category: "Shellfish",
  },
];

async function upsertDefaultSections() {
  const sections = [];
  for (const section of DEFAULT_SECTIONS) {
    const createdSection = await prisma.productSection.upsert({
      where: { slug: section.slug },
      update: { isActive: true, order: section.order },
      create: { ...section, isActive: true },
    });
    sections.push(createdSection);
  }
  return sections;
}

async function ensureCategoryId(categoryName: string) {
  let category = await prisma.category.findFirst({
    where: { name: categoryName },
  });
  category ??= await prisma.category.create({ data: { name: categoryName } });
  return category.id;
}

async function createSampleProducts(tenantId?: string) {
  const createdProducts: Array<{ id: string }> = [];

  for (const product of SAMPLE_PRODUCTS) {
    const categoryId = await ensureCategoryId(product.category);
    const sku = `${product.title.toUpperCase().replaceAll(" ", "-")}-${Date.now().toString().slice(-4)}`;

    const createdProduct = await prisma.product.create({
      data: {
        tenantId,
        name: product.title,
        price: product.price,
        image: product.image,
        categoryId,
        stage: "Published",
        description: "Fresh premium seafood sourced daily.",
        sku,
      },
    });

    createdProducts.push(createdProduct);
  }

  return createdProducts;
}

async function connectProductsToSection(
  sectionId: string,
  productIds: string[],
) {
  if (productIds.length === 0) return;

  await prisma.productSection.update({
    where: { id: sectionId },
    data: { products: { connect: productIds.map((id) => ({ id })) } },
  });
}

async function assignProductsBySectionSlug(
  sections: Array<{ id: string; slug: string }>,
  bySlug: Record<string, string[]>,
) {
  for (const section of sections) {
    await connectProductsToSection(section.id, bySlug[section.slug] ?? []);
  }
}

async function assignSampleProducts(
  sections: Array<{ id: string; slug: string }>,
  createdProducts: Array<{ id: string }>,
) {
  await assignProductsBySectionSlug(sections, {
    "best-sellers": createdProducts.slice(0, 3).map((p) => p.id),
    "new-arrivals": createdProducts.slice(3, 6).map((p) => p.id),
    "super-savings": [createdProducts[0]?.id, createdProducts[4]?.id].filter(
      (id): id is string => Boolean(id),
    ),
  });
}

async function assignExistingProducts(
  sections: Array<{ id: string; slug: string }>,
  tenantId?: string,
) {
  const products = await prisma.product.findMany({
    take: 10,
    where: {
      stage: { in: ["Selling", "Published"] },
      tenantId: tenantId || undefined,
    },
  });

  await assignProductsBySectionSlug(sections, {
    "best-sellers": products.slice(0, 3).map((p) => p.id),
    "new-arrivals": products.slice(3, 6).map((p) => p.id),
    "super-savings": products.slice(6, 8).map((p) => p.id),
  });
}

export async function seedDefaultSections(domain?: string) {
  const tenant = domain ? await getTenantByDomain(domain) : null;
  const tenantId = tenant?.id;
  const sections = await upsertDefaultSections();

  try {
    // Check if products exist for this tenant
    const productCount = await prisma.product.count({
      where: tenantId ? { tenantId } : undefined,
    });

    if (productCount === 0) {
      console.log(
        `No products found for tenant ${tenantId || "global"}. Creating sample products...`,
      );
      const createdProducts = await createSampleProducts(tenantId);
      await assignSampleProducts(sections, createdProducts);
    } else {
      await assignExistingProducts(sections, tenantId);
    }

    revalidateTag("home-sections", {});
    revalidatePath("/");
  } catch (error) {
    console.error("Error auto-assigning products during seed:", error);
  }
}

export async function reorderSections(items: { id: string; order: number }[]) {
  try {
    await prisma.$transaction(
      items.map((item) =>
        prisma.productSection.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );
    revalidatePath("/admin/sections");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder sections:", error);
    return { success: false, error: "Failed to reorder sections" };
  }
}
