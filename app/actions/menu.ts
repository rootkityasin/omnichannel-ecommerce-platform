"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getTenantByDomain } from "./tenant";
import { auth } from "@/auth";
import { Prisma } from "@prisma/client";

const getSessionUser = async () => (await auth())?.user;

export const CARD_PRODUCT_SELECT = {
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
};

const MENU_PRODUCT_SELECT = CARD_PRODUCT_SELECT;

const MENU_BOOTSTRAP_PRODUCT_SELECT = {
  id: true,
  name: true,
  name_bn: true,
  price: true,
  image: true,
  categoryId: true,
  isAvailable: true,
};

type MenuFilterOptions = {
  category?: string;
  filter?: string;
  section?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

const getCachedMenuData = unstable_cache(
  async (tenantId: string) => {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          tenantId: tenantId,
          isAvailable: true,
        },
        orderBy: { sku: "asc" },
        select: MENU_PRODUCT_SELECT,
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

const getCachedMenuBootstrapProducts = unstable_cache(
  async (tenantId: string, limit: number) => {
    return prisma.product.findMany({
      where: {
        tenantId,
        isAvailable: true,
      },
      orderBy: { sku: "asc" },
      take: limit,
      select: MENU_BOOTSTRAP_PRODUCT_SELECT,
    });
  },
  ["menu-bootstrap-products"],
  { tags: ["menu-data", "products"], revalidate: 60 },
);

const getCachedMenuBootstrapTotal = unstable_cache(
  async (tenantId: string) => {
    return prisma.product.count({
      where: {
        tenantId,
        isAvailable: true,
      },
    });
  },
  ["menu-bootstrap-total"],
  { tags: ["menu-data", "products"], revalidate: 300 },
);

async function resolveTenantId(domain?: string) {
  let tenantId: string | undefined;

  if (domain) {
    const tenant = await getTenantByDomain(domain);
    tenantId = tenant?.id;
  }

  if (!tenantId) {
    const sessionUser = await getSessionUser();
    tenantId = sessionUser?.tenantId ?? undefined;
  }

  return tenantId;
}

export async function getMenuData(domain?: string) {
  try {
    const tenantId = await resolveTenantId(domain);

    if (!tenantId) return { products: [], categories: [] };

    return await getCachedMenuData(tenantId);
  } catch (error) {
    console.error("Get Menu Data Error:", error);
    return { products: [], categories: [] };
  }
}

export async function getMenuBootstrapData(domain: string, limit = 18) {
  try {
    const tenantId = await resolveTenantId(domain);
    if (!tenantId) {
      return { products: [], categories: [], total: 0, limit: 0 };
    }

    const safeLimit = Math.min(Math.max(limit, 8), 48);

    const [products, categories, total] = await Promise.all([
      getCachedMenuBootstrapProducts(tenantId, safeLimit),
      prisma.category.findMany({
        where: {
          tenantId,
        },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      getCachedMenuBootstrapTotal(tenantId),
    ]);

    return { products, categories, total, limit: safeLimit };
  } catch (error) {
    console.error("Get Menu Bootstrap Data Error:", error);
    return { products: [], categories: [], total: 0, limit: 0 };
  }
}

export async function getFilteredMenuData(
  domain: string,
  options: MenuFilterOptions,
) {
  try {
    const tenantId = await resolveTenantId(domain);
    if (!tenantId) {
      return { products: [], total: 0 };
    }

    const limit = Math.min(Math.max(options.limit ?? 24, 1), 120);
    const offset = Math.max(options.offset ?? 0, 0);
    const search = options.search?.trim();

    const where: Prisma.ProductWhereInput = {
      tenantId,
      isAvailable: true,
      ...(options.category && options.category !== "all"
        ? { categoryId: options.category }
        : {}),
      ...(options.filter === "super-savings" ? { type: "COMBO" } : {}),
      ...(options.section
        ? { sections: { some: { slug: options.section } } }
        : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { name_bn: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const orderBy =
      options.filter === "best-sellers"
        ? [{ totalSold: "desc" as const }, { createdAt: "desc" as const }]
        : options.filter === "new-arrivals"
          ? [{ createdAt: "desc" as const }]
          : [{ sku: "asc" as const }];

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        select: MENU_PRODUCT_SELECT,
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total };
  } catch (error) {
    console.error("Get Filtered Menu Data Error:", error);
    return { products: [], total: 0 };
  }
}
