"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateDomainSettings(data: {
  slug?: string;
  customDomain?: string | null;
}) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    // 1. Handle Slug Update
    if (data.slug !== undefined && data.slug !== tenant.slug) {
      // Check availability
      const existing = await prisma.tenant.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        return { success: false, error: "This shop name is already taken." };
      }
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { slug: data.slug },
      });
    }

    // 2. Handle Custom Domain Update
    if (data.customDomain !== undefined) {
      // If removing domain
      if (data.customDomain === null || data.customDomain === "") {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { customDomain: null },
        });
      }
      // If adding/changing domain
      else if (data.customDomain !== tenant.customDomain) {
        // Check if taken in DB
        const existingDomain = await prisma.tenant.findUnique({
          where: { customDomain: data.customDomain },
        });
        if (existingDomain) {
          return {
            success: false,
            error: "This domain is already connected to another shop.",
          };
        }

        await prisma.tenant.update({
          where: { id: tenantId },
          data: { customDomain: data.customDomain },
        });
      }
    }

    revalidatePath("/admin/shop");
    return { success: true };
  } catch (error) {
    console.error("Update Domain Settings Error:", error);
    return { success: false, error: "An unexpected error occurred." };
  }
}
