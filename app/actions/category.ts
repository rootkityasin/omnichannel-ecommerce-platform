"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache, revalidatePath, updateTag } from "next/cache";
import { getTenantByDomain } from "./tenant";

import { auth } from "@/auth";

const getCachedCategoriesByTenant = unstable_cache(
  async (tenantId: string) => {
    return await prisma.category.findMany({
      where: {
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  },
  ["categories-list"],
  { tags: ["categories"], revalidate: 3600 }
);

export async function getCategories(domain?: string) {
  try {
    let tenantId: string | undefined;

    if (domain) {
      const tenant = await getTenantByDomain(domain);
      tenantId = tenant?.id;
    }

    if (!tenantId) {
      const session = await auth();
      tenantId = session?.user?.tenantId ?? undefined;
    }

    if (!tenantId) return [];

    return await getCachedCategoriesByTenant(tenantId);
  } catch (error) {
    console.error("Get Categories Error:", error);
    return [];
  }
}


export async function createCategory(
  name: string,
  animationType: string = "AUTO",
  icon: string = "Package",
) {
  try {
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    if (!name || !name.trim())
      return { success: false, error: "Category name is required" };

    const category = await prisma.category.create({
      data: {
        tenantId,
        name,
        animationType,
        icon,
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/");
    updateTag("categories");
    return { success: true, category };
  } catch (error) {
    console.error("Create Category Error:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({ where: { id } });
    revalidatePath("/admin/categories");
    revalidatePath("/");
    updateTag("categories");
    return { success: true };
  } catch (error) {
    console.error("Delete Category Error:", error);
    return { success: false, error: "Failed to delete" };
  }
}

export async function updateCategory(
  id: string,
  name: string,
  animationType?: string,
  icon?: string,
) {
  try {
    await prisma.category.update({
      where: { id },
      data: {
        name,
        ...(animationType && { animationType }),
        ...(icon && { icon }),
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/");
    updateTag("categories");
    return { success: true };
  } catch (error) {
    console.error("Update Category Error:", error);
    return { success: false, error: "Failed to update" };
  }
}
