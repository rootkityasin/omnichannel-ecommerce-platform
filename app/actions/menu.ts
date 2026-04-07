"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getTenantByDomain } from "./tenant";
import { auth } from "@/auth";

const getSessionUser = async () => (await auth())?.user;

const getCachedMenuData = unstable_cache(
  async (tenantId: string) => {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          tenantId: tenantId,
          isAvailable: true,
          stage: { notIn: ["Draft", "Archived"] },
        },
        orderBy: { sku: "asc" },
        select: {
          id: true,
          name: true,
          name_bn: true,
          price: true,
          image: true,
          images: true,
          categoryId: true,
          pieces: true,
          weight: true,
          totalSold: true,
          type: true,
          createdAt: true,
          nutritionImage: true,
          cookingImage: true,
          stage: true,
          sku: true,
          isAvailable: true,
          servingSize: true,
          comboItems: {
            include: {
              child: { select: { pieces: true, servingSize: true } },
            },
          },
          sections: {
            select: { slug: true },
          },
        },
      }),
      prisma.category.findMany({
        where: {
          tenantId: tenantId,
        },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
    ]);

    // Stringify/Parse inside the unstable_cache wrapper to strip Prisma Decimal and Date
    // objects into safe native JSON structures BEFORE Next.js attempts to serialize them
    // to the filesystem or Redis. This violently prevents DataCloneErrors.
    return { products, categories };
  },
  ["menu-data"],
  { tags: ["menu-data", "products", "categories"], revalidate: 600 },
);

export async function getMenuData(domain?: string) {
  try {
    let tenantId: string | undefined;

    if (domain) {
      const tenant = await getTenantByDomain(domain);
      tenantId = tenant?.id;
    }

    if (!tenantId) {
      const sessionUser = await getSessionUser();
      tenantId = sessionUser?.tenantId ?? undefined;
    }

    if (!tenantId) return { products: [], categories: [] };

    return await getCachedMenuData(tenantId);
  } catch (error) {
    console.error("Get Menu Data Error:", error);
    return { products: [], categories: [] };
  }
}
