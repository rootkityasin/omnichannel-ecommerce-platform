"use server";

import { platformPrisma } from "@/lib/platformPrisma";
import { isPlatformMode, isSuperAdminEnabled } from "@/lib/deployment";
import { revalidatePath } from "next/cache";
import { platformAuth } from "@/auth.platform";
import { ShopType } from "@prisma/client";

import { hash } from "bcryptjs";

// --- Security Middleware ---
async function checkSuperAdmin() {
  if (!isPlatformMode || !isSuperAdminEnabled) {
    throw new Error("Super Admin disabled in this deployment.");
  }
  const sessionUser = (await platformAuth())?.user;
  // In real app, verify role strictly.
  // For now, assuming access to this action means checked by page/middleware.
  // Adding basic check:
  if (sessionUser?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Super Admin access required");
  }
  return sessionUser;
}

// --- Tenant Actions ---

export async function createTenant(data: {
  name: string;
  slug: string;
  email: string;
  password?: string;
  plan?: string;
  setupFeePaid?: boolean;
  shopType?: ShopType;
}) {
  await checkSuperAdmin();

  try {
    const hashedPassword = await hash(data.password || "password123", 12);

    // 1. Create Tenant
    const tenant = await platformPrisma.tenantRegistry.create({
      data: {
        name: data.name,
        slug: data.slug,
        planSlug: data.plan || "FREE",
        setupFee: 6000,
        setupFeePaid: data.setupFeePaid || false,
        status: "DRAFT",
        primaryDomain: `${data.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"}`,
        adminName: `${data.name} Admin`,
        adminEmail: data.email,
        adminPasswordHash: hashedPassword,
        shopType: data.shopType || "RESTAURANT",
      },
    });

    revalidatePath("/app");
    return { success: true, tenant };
  } catch (error) {
    console.error("Create Tenant Error:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteTenant(tenantId: string) {
  await checkSuperAdmin();
  try {
    await platformPrisma.tenantRegistry.delete({
      where: { id: tenantId },
    });
    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateTenantStatus(tenantId: string, isActive: boolean) {
  await checkSuperAdmin();
  try {
    await platformPrisma.tenantRegistry.update({
      where: { id: tenantId },
      data: { status: isActive ? "ACTIVE" : "SUSPENDED" },
    });
    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateTenantPlan(tenantId: string, plan: string) {
  await checkSuperAdmin();
  try {
    await platformPrisma.tenantRegistry.update({
      where: { id: tenantId },
      data: { planSlug: plan },
    });
    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// --- Impersonation ---
export async function getImpersonationLink(tenantId: string) {
  const session = await checkSuperAdmin();

  // In a real production app, you would:
  // 1. Generate a short-lived "magic link" token stored in DB/Redis.
  // 2. Return URL: http://tenant.domain/api/auth/magic-login?token=xyz
  // 3. That endpoint sets the session cookie for that domain.

  const tenant = await platformPrisma.tenantRegistry.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) return { success: false, error: "Tenant not found" };

  // For localhost dev, return direct link
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

  // Construct URL based on slug
  const url = `${protocol}://${tenant.slug}.${rootDomain}/admin`;

  return { success: true, url };
}

// --- User Management ---
export async function getTenantUsers(tenantId: string) {
  await checkSuperAdmin();
  try {
    const tenant = await platformPrisma.tenantRegistry.findUnique({
      where: { id: tenantId },
      select: {
        adminName: true,
        adminEmail: true,
        adminPhone: true,
        status: true,
      },
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    const users = [
      {
        id: tenantId,
        name: tenant.adminName || "Tenant Admin",
        email: tenant.adminEmail || "",
        image: null,
        isActive: tenant.status !== "SUSPENDED",
        role: "TENANT_ADMIN",
      },
    ];

    return { success: true, users };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateTenantUserStatus(
  userId: string,
  isBlocked: boolean,
) {
  await checkSuperAdmin();
  try {
    await platformPrisma.tenantRegistry.update({
      where: { id: userId },
      data: { status: isBlocked ? "SUSPENDED" : "ACTIVE" },
    });
    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// --- Tenant Details Management (Super Admin) ---

export async function getTenantDetails(tenantId: string) {
  await checkSuperAdmin();
  try {
    const tenant = await platformPrisma.tenantRegistry.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    return {
      success: true,
      data: {
        shopName: tenant.name,
        slug: tenant.slug,
        shopType: tenant.shopType || "RESTAURANT",
        adminEmail: tenant.adminEmail || "",
        contactPhone: tenant.contactPhone || "",
        contactEmail: tenant.contactEmail || "",
        contactAddress: tenant.contactAddress || "",
        logoUrl: tenant.logoUrl || "",
        measurementUnit: tenant.measurementUnit || "PCS",
        weightUnitValue: tenant.weightUnitValue || 200,
        volumeUnitValue: tenant.volumeUnitValue || 1000,
        tenantName: tenant.name,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateTenantDetails(
  tenantId: string,
  data: {
    shopName: string;
    shopType: ShopType;
    contactPhone?: string;
    contactEmail?: string;
    contactAddress?: string;
    logoUrl?: string;
    measurementUnit?: string;
    weightUnitValue?: number;
    volumeUnitValue?: number;
    adminEmail?: string;
    adminPassword?: string;
  },
) {
  await checkSuperAdmin();
  try {
    // Transaction to ensure everything is updated atomically
    const nextSlug = data.shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";

    await platformPrisma.tenantRegistry.update({
      where: { id: tenantId },
      data: {
        name: data.shopName,
        slug: nextSlug,
        primaryDomain: `${nextSlug}.${rootDomain}`,
        shopType: data.shopType,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        contactAddress: data.contactAddress,
        logoUrl: data.logoUrl,
        measurementUnit: data.measurementUnit,
        weightUnitValue: data.weightUnitValue,
        volumeUnitValue: data.volumeUnitValue,
        adminEmail: data.adminEmail,
        adminPasswordHash: data.adminPassword
          ? await hash(data.adminPassword, 12)
          : undefined,
      },
    });

    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    console.error("Update Tenant Details Error:", error);
    return { success: false, error: String(error) };
  }
}
