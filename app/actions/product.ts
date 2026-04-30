"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";

import { getTenantByDomain } from "./tenant";

import { auth } from "@/auth";

type ProductMutationInput = {
  name?: string;
  sku?: string;
  price?: number | string;
  description?: string;
  descriptionSwap?: boolean;
  image?: string;
  images?: string[];
  pieces?: number | string;
  weight?: number | string;
  servingSize?: number | string;
  stage?: string;
  categoryId?: string;
  type?: string;
  sections?: string[];
  comboItems?: Array<{ childId: string; quantity: number | string }>;
};

const getSessionUser = async () => (await auth())?.user;
const toStringValue = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const isUniqueSkuError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; meta?: { target?: string[] } };
  return candidate.code === "P2002" && candidate.meta?.target?.includes("sku");
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const invalidateProductCaches = () => {
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/", "layout");
  updateTag("products");
  updateTag("menu-data");
  updateTag("home-sections");
};

export async function getAdminProducts(domain?: string) {
  try {
    let tenantId: string | undefined;

    if (domain) {
      const tenant = await getTenantByDomain(domain);
      tenantId = tenant?.id;
    } else {
      const sessionUser = await getSessionUser();
      tenantId = sessionUser?.tenantId ?? undefined;
    }

    if (!tenantId) return [];

    const products = await prisma.product.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" }, // Latest first is usually better for admin
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        categoryId: true,
        pieces: true,
        weight: true, // Needed for unit calc
        type: true,
        stage: true,
        sku: true,
        totalSold: true,
        isAvailable: true,
        servingSize: true,
        comboItems: {
          include: { child: { select: { pieces: true, servingSize: true } } },
        },
        sections: { select: { id: true } },
      },
    });

    return products.map((p) => ({
      ...p,
      stock: p.pieces > 0,
    }));
  } catch (error) {
    console.error("Get Admin Products Error:", error);
    return [];
  }
}

export async function getPaginatedAdminProducts({
  domain,
  page = 1,
  limit = 50,
  search = "",
  stage = "all",
  stockStatus = "all",
}: {
  domain?: string;
  page?: number;
  limit?: number;
  search?: string;
  stage?: string;
  stockStatus?: string;
}) {
  try {
    let tenantId: string | undefined;

    if (domain) {
      const tenant = await getTenantByDomain(domain);
      tenantId = tenant?.id;
    } else {
      const sessionUser = await getSessionUser();
      tenantId = sessionUser?.tenantId ?? undefined;
    }

    if (!tenantId) return { data: [], total: 0, pages: 0 };

    const whereClause: any = { tenantId };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (stage !== "all") {
      whereClause.stage = stage;
    } else {
      whereClause.stage = { not: "Archived" }; // Hide archived by default
    }

    if (stockStatus === "instock") {
      whereClause.pieces = { gt: 0 };
    } else if (stockStatus === "outstock") {
      whereClause.pieces = { lte: 0 };
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          price: true,
          image: true,
          categoryId: true,
          pieces: true,
          weight: true,
          type: true,
          stage: true,
          sku: true,
          totalSold: true,
          isAvailable: true,
          servingSize: true,
          comboItems: {
            include: { child: { select: { pieces: true, servingSize: true } } },
          },
          sections: { select: { id: true } },
        },
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    const data = products.map((p) => ({
      ...p,
      stock: p.pieces > 0,
    }));

    return {
      data,
      total,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Get Paginated Admin Products Error:", error);
    return { data: [], total: 0, pages: 0 };
  }
}

export async function getProductById(id: string) {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return null;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        comboItems: true,
        sections: { select: { id: true, slug: true } }, // Needed for edit form
      },
    });
    if (product && product.tenantId !== tenantId) return null;
    return product;
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    return null;
  }
}

const getCachedProducts = unstable_cache(
  async (tenantId: string) => {
    return await prisma.product.findMany({
      where: {
        tenantId: tenantId,
        isAvailable: true,
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
          include: { child: { select: { pieces: true, servingSize: true } } },
        },
        sections: {
          select: { slug: true },
        },
      },
    });
  },
  ["products-public-list"],
  { tags: ["products"], revalidate: 3600 },
);

export async function getProducts(domain?: string) {
  try {
    let tenantId: string | undefined;

    if (domain) {
      const tenant = await getTenantByDomain(domain);
      tenantId = tenant?.id;
    }

    if (!tenantId) {
      const sessionUser = await getSessionUser();
      tenantId = sessionUser?.tenantId || undefined;
    }

    if (!tenantId) {
      // If we can't determine context, return empty to be safe/fast
      // or return strictly public variants? For Admin, empty is safer.
      return [];
    }

    const products = await getCachedProducts(tenantId);

    return products;
  } catch (error) {
    console.error("Get Products Error:", error);
    return [];
  }
}

export async function getProduct(id: string, domain?: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sections: true,
        comboItems: {
          include: {
            child: true,
          },
        },
      },
    });
    // Verify tenant ownership when domain is provided
    if (domain && product) {
      const tenant = await getTenantByDomain(domain);
      if (!tenant || product.tenantId !== tenant.id) return null;
    }
    return product;
  } catch {
    return null;
  }
}

export async function createProduct(data: ProductMutationInput) {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    if (!data.categoryId)
      return { success: false, error: "Category is required" };

    const product = await prisma.product.create({
      data: {
        tenantId,
        name: toStringValue(data.name),
        sku: toStringValue(data.sku),
        price: Number.parseInt(String(data.price || 0), 10) || 0,
        description: data.description,
        descriptionSwap: data.descriptionSwap || false,
        image: data.image,
        pieces: Number.parseInt(String(data.pieces || 0), 10) || 0,
        weight: Number.parseInt(String(data.weight || 0), 10) || 0,
        servingSize: Number.parseInt(String(data.servingSize || 0), 10) || 0,
        stage: data.stage,
        categoryId: toStringValue(data.categoryId),
        images: data.images || [],
        type: data.type === "COMBO" ? "COMBO" : "SINGLE",
        sections:
          data.sections && data.sections.length > 0
            ? {
                connect: data.sections.map((id: string) => ({ id })),
              }
            : undefined,
        comboItems:
          data.type === "COMBO" && data.comboItems
            ? {
                create: data.comboItems.map((item) => ({
                  childId: item.childId,
                  quantity: Number.parseInt(String(item.quantity), 10),
                })),
              }
            : undefined,
      },
    });
    invalidateProductCaches();
    return { success: true, product };
  } catch (error) {
    console.error("Create Product Error:", error);
    if (isUniqueSkuError(error)) {
      return { success: false, error: "Product with this SKU already exists" };
    }
    return { success: false, error: "Failed to create product" };
  }
}

export async function updateProduct(id: string, data: ProductMutationInput) {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    // Verify ownership before update
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!existing || existing.tenantId !== tenantId)
      return { success: false, error: "Product not found" };

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = toStringValue(data.name);
    if (data.sku !== undefined) updateData.sku = toStringValue(data.sku);
    if (data.price !== undefined)
      updateData.price = Number.parseInt(String(data.price || 0), 10) || 0;
    if (data.pieces !== undefined)
      updateData.pieces = Number.parseInt(String(data.pieces || 0), 10) || 0;
    if (data.servingSize !== undefined)
      updateData.servingSize =
        Number.parseInt(String(data.servingSize || 0), 10) || 0;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.images !== undefined) updateData.images = data.images || [];
    if (data.weight !== undefined)
      updateData.weight = Number.parseInt(String(data.weight || 0), 10) || 0;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.descriptionSwap !== undefined)
      updateData.descriptionSwap = data.descriptionSwap;
    if (data.categoryId !== undefined)
      updateData.categoryId = toStringValue(data.categoryId);
    if (data.stage !== undefined) {
      const stage = toStringValue(data.stage, "Draft");
      updateData.stage = stage;
    }
    if (data.sections !== undefined) {
      updateData.sections = {
        set: data.sections.map((sectionId: string) => ({ id: sectionId })),
      };
    }

    if (data.type === "COMBO") {
      updateData.type = "COMBO";
      updateData.comboItems = {
        deleteMany: {},
        create: (data.comboItems || []).map((item) => ({
          childId: item.childId,
          quantity: Number.parseInt(String(item.quantity || 0), 10) || 0,
        })),
      };
    } else if (data.type === "SINGLE") {
      updateData.type = "SINGLE";
      updateData.comboItems = { deleteMany: {} };
    }

    await prisma.product.update({
      where: { id },
      data: updateData,
    });
    invalidateProductCaches();
    return { success: true };
  } catch (error) {
    console.error("Update Product Error:", error);
    if (isUniqueSkuError(error)) {
      return { success: false, error: "Product with this SKU already exists" };
    }
    return { success: false, error: "Failed to update" };
  }
}

export async function deleteProduct(id: string) {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    // Verify ownership before delete
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!existing || existing.tenantId !== tenantId)
      return { success: false, error: "Product not found" };

    // 1. Check for orders
    const ordersCount = await prisma.orderItem.count({
      where: { productId: id },
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
      prisma.product.delete({ where: { id } }),
    ]);

    invalidateProductCaches();
    return { success: true };
  } catch (error) {
    console.error("Delete Product Error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "Failed to delete product"),
    };
  }
}

export async function deleteArchivedProduct(id: string) {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    const product = await prisma.product.findUnique({
      where: { id },
      select: { stage: true, tenantId: true },
    });

    if (!product || product.tenantId !== tenantId) {
      return { success: false, error: "Product not found" };
    }

    if (product.stage !== "Archived") {
      return {
        success: false,
        error: "Product must be archived before permanent delete",
      };
    }

    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { productId: id } }),
      prisma.inventory.deleteMany({ where: { productId: id } }),
      prisma.modifier.deleteMany({ where: { productId: id } }),
      prisma.review.deleteMany({ where: { productId: id } }),
      prisma.comboItem.deleteMany({ where: { childId: id } }),
      prisma.comboItem.deleteMany({ where: { parentId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    invalidateProductCaches();
    return { success: true };
  } catch (error) {
    console.error("Delete Archived Product Error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "Failed to delete archived product"),
    };
  }
}

export async function archiveProduct(id: string) {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!existing || existing.tenantId !== tenantId)
      return { success: false, error: "Product not found" };

    await prisma.product.update({
      where: { id },
      data: {
        isAvailable: false,
        stage: "Archived",
      },
    });

    invalidateProductCaches();
    return { success: true };
  } catch (error) {
    console.error("Archive Product Error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "Failed to archive product"),
    };
  }
}

export async function unarchiveProduct(id: string) {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!existing || existing.tenantId !== tenantId)
      return { success: false, error: "Product not found" };

    await prisma.product.update({
      where: { id },
      data: {
        isAvailable: true,
        stage: "Draft",
      },
    });

    invalidateProductCaches();
    return { success: true };
  } catch (error) {
    console.error("Unarchive Product Error:", error);
    return {
      success: false,
      error: getErrorMessage(error, "Failed to unarchive product"),
    };
  }
}

export async function generateUniqueSku() {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    const products = await prisma.product.findMany({
      where: { tenantId },
      select: { sku: true },
    });

    let maxId = 0;
    for (const p of products) {
      if (p.sku && /^\d+$/.test(p.sku)) {
        const num = Number.parseInt(p.sku, 10);
        if (num > maxId) maxId = num;
      }
    }
    const nextId = maxId + 1;
    const sku = nextId.toString().padStart(4, "0");
    return { success: true, sku };
  } catch (error) {
    console.error("SKU Gen Error:", error);
    return { success: false, error: "Generation failed" };
  }
}
