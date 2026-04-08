"use server";

import { prisma } from "@/lib/prisma";
import { logActionRequest } from "@/lib/actionLogger";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { randomBytes } from "crypto";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";

const getSessionUser = async () => (await auth())?.user;

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

const hasAdminAccess = (role?: string | null) =>
  role === "SUPER_ADMIN" ||
  role === "TENANT_ADMIN" ||
  role === "HUB_ADMIN" ||
  role === "STAFF";

const hasSuperTenantAccess = (role?: string | null) =>
  role === "SUPER_ADMIN" || role === "TENANT_ADMIN";

function invalidateCustomerCaches() {
  updateTag("customers");
  updateTag("customers-stats");
}

export async function checkUserExists(phone: string) {
  if (!phone) return false;
  try {
    const user = await prisma.user.findFirst({ where: { phone: phone } });
    return !!user;
  } catch {
    return false;
  }
}

export async function getCurrentUserRole() {
  await logActionRequest({ actionName: "getCurrentUserRole" });
  const sessionUser = await getSessionUser();
  return sessionUser?.role || null;
}

import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

const CreateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, "Invalid BD Phone Number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  tenantId: z.string().optional(),
});

// Basic simplified create for signup
export async function createUser(data: {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  password?: string;
  tenantId?: string;
}) {
  // 1. Rate Limiting (IP-based)
  await logActionRequest({ actionName: "createUser" });
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  if (!(await checkRateLimit(`signup:${ip}`, 3, 60 * 1000))) {
    return {
      success: false,
      error: "Too many signup attempts. Please try again later.",
    };
  }

  // 2. Input Validation
  const validation = CreateUserSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  try {
    // Note: data.tenantId should ideally be passed for multi-tenant apps so user is associated with a specific tenant
    // But Users might be global in some designs?
    // Schema has `tenantId String?`. So it is scoped.

    const tenantId = data.tenantId;

    // If checking existence, should we check per tenant?
    // Usually phone numbers are unique system-wide OR unique per tenant.
    // If unique per tenant:
    const whereClause = tenantId
      ? { phone: data.phone, tenantId }
      : { phone: data.phone };
    const existing = await prisma.user.findFirst({ where: whereClause });

    if (existing) return { success: false, error: "User already exists" };

    const user = await prisma.user.create({
      data: {
        tenantId,
        name: data.name,
        phone: data.phone,
        email: data.email || `${data.phone}@placeholder.com`,
        password: data.password
          ? await bcrypt.hash(data.password, 10)
          : undefined,
        role: "USER",
      },
    });
    return { success: true, user };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// Admin Create User with Roles
export async function createUserWithRole(data: {
  name: string;
  email: string;
  phone: string;
  role: "SUPER_ADMIN" | "TENANT_ADMIN" | "HUB_ADMIN" | "STAFF" | "USER";
  password?: string;
  permissions?: string[];
  tenantId?: string;
  hubId?: string;
}) {
  await logActionRequest({ actionName: "createUserWithRole" });
  const sessionUser = await getSessionUser();
  const callerRole = sessionUser?.role;

  // Authorization Logic
  if (callerRole !== "SUPER_ADMIN") {
    if (data.role === "SUPER_ADMIN")
      return {
        success: false,
        error: `Unauthorized: Cannot create SUPER_ADMIN. Your role is ${callerRole}.`,
      };

    if (callerRole === "TENANT_ADMIN") {
      // Tenant Admin can only manage their own Tenant (Hub Admins / Staff / Users)
      // And cannot create Tenant Admins (only Super Admin does that usually)
      if (["TENANT_ADMIN"].includes(data.role))
        return {
          success: false,
          error: `Unauthorized: TENANT_ADMIN cannot create ${data.role}.`,
        };
    } else if (callerRole === "HUB_ADMIN") {
      // Hub Admin can only create Staff/User
      if (["SUPER_ADMIN", "TENANT_ADMIN", "HUB_ADMIN"].includes(data.role))
        return {
          success: false,
          error: `Unauthorized: HUB_ADMIN cannot create ${data.role}.`,
        };
    } else {
      return {
        success: false,
        error: `Unauthorized: Invalid caller role [${callerRole}] trying to create [${data.role}].`,
      };
    }
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) return { success: false, error: "Email already taken" };

    // Secure default password generation
    const generatedPassword = data.password || randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const finalHubId = data.hubId || sessionUser?.hubId;
    if (finalHubId && ["HUB_ADMIN", "STAFF"].includes(data.role)) {
      const hubNameWords = finalHubId.replace(/-hub$/i, "").split("-");
      const hubName =
        hubNameWords
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ") + " Hub";
      const hubLocation = hubNameWords
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      await prisma.hub.upsert({
        where: { id: finalHubId },
        update: {},
        create: {
          id: finalHubId,
          name: hubName,
          location: hubLocation,
          tenantId: data.tenantId || sessionUser?.tenantId,
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        tenantId: data.tenantId || sessionUser?.tenantId, // Inherit or Explicit
        hubId: finalHubId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        permissions: data.permissions || [],
        password: hashedPassword,
      },
    });
    invalidateCustomerCaches();
    return { success: true, user };
  } catch (error) {
    console.error(error);
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function updateUser(
  userId: string,
  data: {
    name: string;
    email: string;
    phone: string;
    role: "SUPER_ADMIN" | "TENANT_ADMIN" | "HUB_ADMIN" | "STAFF" | "USER";
    permissions: string[];
    hubId?: string;
  },
) {
  await logActionRequest({ actionName: "updateUser" });
  const sessionUser = await getSessionUser();
  const callerRole = sessionUser?.role;

  // Basic Authorization (Can be refined)
  if (callerRole !== "SUPER_ADMIN" && callerRole !== "TENANT_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { success: false, error: "User not found" };

    // Hierarchy Check: Prevent lower/equal tiers from modifying higher tiers
    if (targetUser.role === "SUPER_ADMIN" && callerRole !== "SUPER_ADMIN") {
      return { success: false, error: "Cannot modify Super Admin" };
    }

    // Fix IDOR: Ensure Tenant Admin can only update users in their own tenant
    const sessionTenantId = sessionUser?.tenantId;
    if (
      callerRole === "TENANT_ADMIN" &&
      targetUser.tenantId !== sessionTenantId
    ) {
      return {
        success: false,
        error: "Unauthorized: Cannot modify user from another tenant",
      };
    }

    // Prevent Tenant Admin from modifying other Tenant Admins (unless self?)
    if (
      targetUser.role === "TENANT_ADMIN" &&
      callerRole === "TENANT_ADMIN" &&
      targetUser.id !== sessionUser?.id
    ) {
      // Ideally Tenant Admin manages heirarchy below them. Modifying another Tenant Admin (peer) is usually blocked or limited.
      // Allowing for now if same tenant, but typically Owner is singular.
    }

    const finalHubId = data.hubId;
    if (finalHubId && ["HUB_ADMIN", "STAFF"].includes(data.role)) {
      const hubNameWords = finalHubId.replace(/-hub$/i, "").split("-");
      const hubName =
        hubNameWords
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ") + " Hub";
      const hubLocation = hubNameWords
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      await prisma.hub.upsert({
        where: { id: finalHubId },
        update: {},
        create: {
          id: finalHubId,
          name: hubName,
          location: hubLocation,
          tenantId: targetUser.tenantId,
        },
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        permissions: data.permissions,
        hubId: finalHubId,
      },
    });
    invalidateCustomerCaches();
    return { success: true, user };
  } catch (error) {
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(userId: string) {
  await logActionRequest({ actionName: "deleteUser" });
  const sessionUser = await getSessionUser();
  const callerRole = sessionUser?.role;

  if (callerRole !== "SUPER_ADMIN" && callerRole !== "TENANT_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { success: false, error: "User not found" };

    // Hierarchy Protection
    if (targetUser.role === "SUPER_ADMIN") {
      return { success: false, error: "Cannot delete Super Admin" };
    }

    if (callerRole === "TENANT_ADMIN") {
      // Tenant Admin cannot delete other Tenant Admins or Super Admins
      if (["SUPER_ADMIN", "TENANT_ADMIN"].includes(targetUser.role)) {
        return { success: false, error: "Unauthorized to delete this role" };
      }
      // Must belong to same tenant (implicit)
      if (targetUser.tenantId !== sessionUser?.tenantId) {
        return { success: false, error: "Unauthorized" };
      }
    }

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin/customers");
    invalidateCustomerCaches();
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete" };
  }
}

export async function updateUserStatus(userId: string, status: string) {
  await logActionRequest({ actionName: "updateUserStatus" });
  const sessionUser = await getSessionUser();
  if (sessionUser?.role !== "SUPER_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update status" };
  }
}

/* 
  Re-exporting getAllUsers but careful to not break existing signature 
  The previous file had simple getAllUsers. preserving it.
*/
export async function getAllUsers() {
  await logActionRequest({ actionName: "getAllUsers" });
  const sessionUser = await getSessionUser();
  const userRole = sessionUser?.role;
  const userTenantId = sessionUser?.tenantId;
  const userHubId = sessionUser?.hubId;

  if (!hasAdminAccess(userRole)) {
    throw new Error("Unauthorized");
  }

  try {
    // Base filter: Exclude customers (role: 'USER') because they have their own section.
    // Also exclude SUPER_ADMIN from this list (System Level, not Shop Level).
    const where: Prisma.UserWhereInput = {
      role: { notIn: ["USER", "SUPER_ADMIN"] },
    };

    // Role-based scoping
    if (userRole === "SUPER_ADMIN") {
      // Super Admin sees all (or could filter by tenant if context provided, but here all)
    } else if (userRole === "TENANT_ADMIN") {
      if (userTenantId) where.tenantId = userTenantId;
    } else if (userRole === "HUB_ADMIN") {
      if (userTenantId) where.tenantId = userTenantId;
      if (userHubId) where.hubId = userHubId; // Hub Admins only see users in their hub
    } else if (userRole === "STAFF") {
      // Staff usually don't see this list, but if they do:
      if (userTenantId) where.tenantId = userTenantId;
      if (userHubId) where.hubId = userHubId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { id: "desc" },
      // Include permissions in select
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        permissions: true,
        hubId: true,
      },
    });
    return users;
  } catch (error) {
    console.error("getAllUsers Error:", error);
    return [];
  }
}

const getCachedCustomerDatasets = unstable_cache(
  async (
    userRole: string | undefined,
    userTenantId: string | null | undefined,
  ) => {
    const startMs = process.env.PERF_LOG === "true" ? Date.now() : 0;
    // 1. Base Criteria
    const orderWhere: Prisma.OrderWhereInput = {};
    if (userRole !== "SUPER_ADMIN" && userTenantId) {
      orderWhere.tenantId = userTenantId;
    }

    // 2. Fetch all orders (we need this anyway to calculate stats + guests)
    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        customerPhone: true,
        customerName: true,
        customerEmail: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    });

    if (process.env.PERF_LOG === "true") {
      const { heapUsed, rss } = process.memoryUsage();
      console.info(
        `[Perf] getCustomers orders=${orders.length} ms=${Date.now() - startMs} heapMB=${Math.round(heapUsed / 1024 / 1024)} rssMB=${Math.round(rss / 1024 / 1024)}`,
      );
    }

    // 3. Build maps from orders in a single pass
    const phoneMap = new Map<
      string,
      {
        phone: string;
        name: string;
        email: string | null;
        count: number;
        spent: number;
        firstSeen: Date;
      }
    >();
    const orderStatsByPhone = new Map<string, { orders: number; spent: number }>();
    const orderStatsByEmail = new Map<string, { orders: number; spent: number }>();

    for (const order of orders) {
      const phone = order.customerPhone;
      const isCancelled =
        order.status === "CANCELLED" || order.status === "Cancelled";
      const spentAddition = isCancelled ? 0 : order.totalAmount;
      const countAddition = isCancelled ? 0 : 1;

      if (phone) {
        const existing = phoneMap.get(phone);

        if (!existing) {
          phoneMap.set(phone, {
            phone,
            name: order.customerName || "Guest",
            email: order.customerEmail || null,
            count: countAddition,
            spent: spentAddition,
            firstSeen: order.createdAt,
          });
        } else {
          existing.count += countAddition;
          existing.spent += spentAddition;
          // Keep the older date as firstSeen
          if (order.createdAt < existing.firstSeen) {
            existing.firstSeen = order.createdAt;
          }
          // Prefer a name if it was previously just "Guest"
          if (existing.name === "Guest" && order.customerName) {
            existing.name = order.customerName;
          }
        }

        const phoneStats = orderStatsByPhone.get(phone) || {
          orders: 0,
          spent: 0,
        };
        phoneStats.orders += countAddition;
        phoneStats.spent += spentAddition;
        orderStatsByPhone.set(phone, phoneStats);
      }

      if (order.customerEmail) {
        const emailKey = order.customerEmail.toLowerCase();
        const emailStats = orderStatsByEmail.get(emailKey) || {
          orders: 0,
          spent: 0,
        };
        emailStats.orders += countAddition;
        emailStats.spent += spentAddition;
        orderStatsByEmail.set(emailKey, emailStats);
      }
    }

    // 4. Fetch registered 'USER' role accounts once
    const userWhere: Prisma.UserWhereInput = { role: "USER" };
    if (userRole !== "SUPER_ADMIN" && userTenantId) {
      userWhere.tenantId = userTenantId;
    }

    const registeredUsers = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        points: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (process.env.PERF_LOG === "true") {
      const { heapUsed, rss } = process.memoryUsage();
      console.info(
        `[Perf] getCustomers users=${registeredUsers.length} ms=${Date.now() - startMs} heapMB=${Math.round(heapUsed / 1024 / 1024)} rssMB=${Math.round(rss / 1024 / 1024)}`,
      );
    }

    // 5. Build merged customers list (registered users with orders + guests)
    const customers: any[] = [];
    const processedPhones = new Set<string>();

    for (const user of registeredUsers) {
      if (user.phone) processedPhones.add(user.phone);

      const stats = user.phone ? phoneMap.get(user.phone) : null;
      if ((stats?.count || 0) > 0) {
        customers.push({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt,
          points: user.points,
          orders: stats?.count || 0,
          spent: stats?.spent || 0,
          isGuest: false,
        });
      }
    }

    for (const [phone, guestData] of phoneMap.entries()) {
      if (!processedPhones.has(phone)) {
        customers.push({
          id: `guest_${phone}`,
          name: guestData.name,
          email: guestData.email,
          phone,
          createdAt: guestData.firstSeen,
          points: 0,
          orders: guestData.count,
          spent: guestData.spent,
          isGuest: true,
        });
      }
    }

    customers.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // 6. Build account-created users list from same stats maps
    const accountCreatedUsers = registeredUsers.map((user) => {
      const phoneStats = user.phone ? orderStatsByPhone.get(user.phone) : null;
      const emailStats = user.email
        ? orderStatsByEmail.get(user.email.toLowerCase())
        : null;
      const stats = phoneStats || emailStats;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "N/A",
        orders: stats?.orders || 0,
        spent: stats?.spent || 0,
        points: user.points || 0,
        createdAt: user.createdAt,
        isGuest: false,
      };
    });

    return {
      customers,
      accountCreatedUsers,
    };
  },
  ["customers-datasets"],
  { tags: ["customers", "customers-stats"], revalidate: 3600 },
);

export async function getCustomers() {
  await logActionRequest({ actionName: "getCustomers" });
  const sessionUser = await getSessionUser();
  const userRole = sessionUser?.role;
  const userTenantId = sessionUser?.tenantId;

  if (!hasAdminAccess(userRole)) {
    throw new Error("Unauthorized");
  }

  try {
    const data = await getCachedCustomerDatasets(userRole, userTenantId);
    return data.customers;
  } catch (error) {
    console.error("getCustomers Error:", error);
    return [];
  }
}

export async function getAccountCreatedUsers() {
  await logActionRequest({ actionName: "getAccountCreatedUsers" });
  const sessionUser = await getSessionUser();
  const userRole = sessionUser?.role;
  const userTenantId = sessionUser?.tenantId;

  if (!hasAdminAccess(userRole)) {
    throw new Error("Unauthorized");
  }

  try {
    const data = await getCachedCustomerDatasets(userRole, userTenantId);
    return data.accountCreatedUsers;
  } catch (error) {
    console.error("getAccountCreatedUsers Error:", error);
    return [];
  }
}

export async function getCustomerDatasets() {
  await logActionRequest({ actionName: "getCustomerDatasets" });
  const sessionUser = await getSessionUser();
  const userRole = sessionUser?.role;
  const userTenantId = sessionUser?.tenantId;

  if (!hasAdminAccess(userRole)) {
    throw new Error("Unauthorized");
  }

  try {
    return await getCachedCustomerDatasets(userRole, userTenantId);
  } catch (error) {
    console.error("getCustomerDatasets Error:", error);
    return { customers: [], accountCreatedUsers: [] };
  }
}

export async function getUserProfile(userId: string) {
  await logActionRequest({ actionName: "getUserProfile" });
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Bulk import customers from AI-parsed data
 */
export async function bulkImportCustomers(
  customers: { name: string; phone: string; email?: string }[],
) {
  await logActionRequest({ actionName: "bulkImportCustomers" });
  const sessionUser = await getSessionUser();
  const role = sessionUser?.role;
  const tenantId = sessionUser?.tenantId;

  if (!hasSuperTenantAccess(role)) {
    return { success: false, error: "Unauthorized", imported: 0, skipped: 0 };
  }

  let imported = 0;
  let skipped = 0;

  for (const customer of customers) {
    try {
      // Check if phone already exists
      const existing = await prisma.user.findFirst({
        where: { phone: customer.phone },
      });
      if (existing) {
        skipped++;
        continue;
      }

      await prisma.user.create({
        data: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email || `${customer.phone}@placeholder.com`,
          role: "USER",
          tenantId: tenantId,
        },
      });
      imported++;
    } catch (error) {
      console.error("Import error for", customer.phone, error);
      skipped++;
    }
  }

  // ... existing code ...
  revalidatePath("/admin/customers");
  return { success: true, imported, skipped };
}

export async function resetUserPassword(userId: string, newPassword?: string) {
  await logActionRequest({ actionName: "resetUserPassword" });
  const sessionUser = await getSessionUser();
  const callerRole = sessionUser?.role;

  if (
    callerRole !== "SUPER_ADMIN" &&
    callerRole !== "TENANT_ADMIN" &&
    callerRole !== "HUB_ADMIN"
  ) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { success: false, error: "User not found" };

    // Hierarchy Check
    if (targetUser.role === "SUPER_ADMIN" && callerRole !== "SUPER_ADMIN") {
      return { success: false, error: "Cannot reset Super Admin password" };
    }
    if (targetUser.role === "TENANT_ADMIN" && callerRole === "HUB_ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const passwordToSet = newPassword || randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(passwordToSet, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, password: passwordToSet };
  } catch (error) {
    return { success: false, error: "Failed to reset password" };
  }
}

export async function generateImpersonationToken(targetUserId: string) {
  await logActionRequest({ actionName: "generateImpersonationToken" });
  const sessionUser = await getSessionUser();
  const callerRole = sessionUser?.role;

  // Only Admins can impersonate
  if (callerRole !== "SUPER_ADMIN" && callerRole !== "TENANT_ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) return { success: false, error: "User not found" };

    // Cannot impersonate a Super Admin unless you are one
    if (targetUser.role === "SUPER_ADMIN" && callerRole !== "SUPER_ADMIN") {
      return { success: false, error: "Cannot impersonate Super Admin" };
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Use VerificationToken table
    const identifier = `impersonate:${targetUserId}`;

    // Cleanup old tokens
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });

    return { success: true, token };
  } catch (error) {
    console.error("Impersonation error:", error);
    return { success: false, error: "Failed to generate token" };
  }
}

export async function createCustomer(data: {
  name: string;
  phone: string;
  email?: string;
}) {
  await logActionRequest({ actionName: "createCustomer" });
  const sessionUser = await getSessionUser();
  const role = sessionUser?.role;

  if (!hasAdminAccess(role)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const tenantId = sessionUser?.tenantId;

    // Check duplicate
    const existing = await prisma.user.findFirst({
      where: { phone: data.phone },
    });
    if (existing)
      return { success: false, error: "Phone number already exists" };

    const user = await prisma.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || `${data.phone}@placeholder.com`, // Fallback email
        role: "USER",
        tenantId: tenantId, // Bind to tenant if available
      },
    });
    revalidatePath("/admin/customers");
    return { success: true, user };
  } catch (error) {
    console.error("createCustomer Error:", error);
    return {
      success: false,
      error: getErrorMessage(error) || "Failed to create customer",
    };
  }
}

export async function updateCustomer(
  id: string,
  data: { name: string; phone: string; email?: string },
) {
  await logActionRequest({ actionName: "updateCustomer" });
  const sessionUser = await getSessionUser();
  const role = sessionUser?.role;

  if (!hasAdminAccess(role)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
      },
    });
    revalidatePath("/admin/customers");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update customer" };
  }
}
