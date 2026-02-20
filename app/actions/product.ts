"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
        comboItems: {
          include: { child: { select: { pieces: true } } },
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

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        comboItems: true,
        sections: { select: { id: true, slug: true } }, // Needed for edit form
      },
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

    const products = await prisma.product.findMany({
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
        sections: {
          select: { slug: true },
        },
      },
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
            child: true,
          },
        },
      },
    });
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
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/", "layout");
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
    await prisma.product.update({
      where: { id },
      data: {
        name: toStringValue(data.name),
        sku: toStringValue(data.sku),
        price: Number.parseInt(String(data.price || 0), 10) || 0,
        pieces: Number.parseInt(String(data.pieces || 0), 10) || 0,
        servingSize: Number.parseInt(String(data.servingSize || 0), 10) || 0,
        image: data.image,
        images: data.images || [],
        weight: Number.parseInt(String(data.weight || 0), 10) || 0,
        description: data.description,
        descriptionSwap: data.descriptionSwap,
        stage: data.stage,
        sections: data.sections
          ? {
              set: data.sections.map((id: string) => ({ id })),
            }
          : undefined,
      },
    });
    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/", "layout");
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

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
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
    const product = await prisma.product.findUnique({
      where: { id },
      select: { stage: true },
    });

    if (!product) {
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

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
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
    await prisma.product.update({
      where: { id },
      data: {
        isAvailable: false,
        stage: "Archived",
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
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
    await prisma.product.update({
      where: { id },
      data: {
        isAvailable: true,
        stage: "Draft",
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory");
    revalidatePath("/");
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
    const products = await prisma.product.findMany({
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
