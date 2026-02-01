'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { randomBytes } from 'crypto';

export async function checkUserExists(phone: string) {
    if (!phone) return false;
    try {
        const user = await prisma.user.findFirst({ where: { phone: phone } });
        return !!user;
    } catch (error) {
        return false;
    }
}

// Basic simplified create for signup
export async function createUser(data: { name: string; phone: string; email?: string; address?: string; password?: string, tenantId?: string }) {
    // Bot check removed


    try {
        // Note: data.tenantId should ideally be passed for multi-tenant apps so user is associated with a specific tenant
        // But Users might be global in some designs? 
        // Schema has `tenantId String?`. So it is scoped.

        let tenantId = data.tenantId;

        // If checking existence, should we check per tenant?
        // Usually phone numbers are unique system-wide OR unique per tenant.
        // If unique per tenant:
        const whereClause = tenantId ? { phone: data.phone, tenantId } : { phone: data.phone };
        const existing = await prisma.user.findFirst({ where: whereClause });

        if (existing) return { success: false, error: "User already exists" };

        const user = await prisma.user.create({
            data: {
                tenantId,
                name: data.name,
                phone: data.phone,
                email: data.email || `${data.phone}@placeholder.com`,
                password: data.password ? await bcrypt.hash(data.password, 10) : undefined,
                role: 'USER'
            }
        });
        return { success: true, user };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Admin Create User with Roles
export async function createUserWithRole(data: {
    name: string;
    email: string;
    phone: string;
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'HUB_ADMIN' | 'STAFF' | 'USER';
    password?: string;
    permissions?: string[];
    tenantId?: string;
    hubId?: string;
}) {
    const session = await auth();
    const callerRole = (session?.user as any)?.role;

    // Authorization Logic
    if (callerRole !== 'SUPER_ADMIN') {
        if (data.role === 'SUPER_ADMIN') return { success: false, error: "Unauthorized" };

        if (callerRole === 'TENANT_ADMIN') {
            // Tenant Admin can only manage their own Tenant (Hub Admins / Staff / Users)
            // And cannot create Tenant Admins (only Super Admin does that usually)
            if (['TENANT_ADMIN'].includes(data.role)) return { success: false, error: "Unauthorized" };
        } else if (callerRole === 'HUB_ADMIN') {
            // Hub Admin can only create Staff/User
            if (['SUPER_ADMIN', 'TENANT_ADMIN', 'HUB_ADMIN'].includes(data.role)) return { success: false, error: "Unauthorized" };
        } else {
            return { success: false, error: "Unauthorized" };
        }
    }

    try {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) return { success: false, error: "Email already taken" };

        // Secure default password generation
        const generatedPassword = data.password || randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const user = await prisma.user.create({
            data: {
                tenantId: data.tenantId || (session?.user as any)?.tenantId, // Inherit or Explicit
                hubId: data.hubId || (session?.user as any)?.hubId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                permissions: data.permissions || [],
                password: hashedPassword
            }
        });
        return { success: true, user };

    } catch (error: any) {
        console.error(error);
        return { success: false, error: "Failed to create user" };
    }
}

export async function updateUser(userId: string, data: {
    name: string;
    email: string;
    phone: string;
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'HUB_ADMIN' | 'STAFF' | 'USER';
    permissions: string[];
    hubId?: string;
}) {
    const session = await auth();
    const callerRole = (session?.user as any)?.role;

    // Basic Authorization (Can be refined)
    if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'TENANT_ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return { success: false, error: "User not found" };

        // Hierarchy Check: Prevent lower/equal tiers from modifying higher tiers
        if (targetUser.role === 'SUPER_ADMIN' && callerRole !== 'SUPER_ADMIN') {
            return { success: false, error: "Cannot modify Super Admin" };
        }

        // Prevent Tenant Admin from modifying other Tenant Admins (unless self?)
        if (targetUser.role === 'TENANT_ADMIN' && callerRole === 'TENANT_ADMIN' && targetUser.id !== (session?.user as any)?.id) {
            // Ideally Tenant Admin manages heirarchy below them. Modifying another Tenant Admin (peer) is usually blocked or limited.
            // Allowing for now if same tenant, but typically Owner is singular.
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                permissions: data.permissions,
                hubId: data.hubId
            }
        });
        return { success: true, user };
    } catch (error) {
        return { success: false, error: "Failed to update user" };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();
    const callerRole = (session?.user as any)?.role;

    if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'TENANT_ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return { success: false, error: "User not found" };

        // Hierarchy Protection
        if (targetUser.role === 'SUPER_ADMIN') {
            return { success: false, error: "Cannot delete Super Admin" };
        }

        if (callerRole === 'TENANT_ADMIN') {
            // Tenant Admin cannot delete other Tenant Admins or Super Admins
            if (['SUPER_ADMIN', 'TENANT_ADMIN'].includes(targetUser.role)) {
                return { success: false, error: "Unauthorized to delete this role" };
            }
            // Must belong to same tenant (implicit)
            if (targetUser.tenantId !== (session?.user as any)?.tenantId) {
                return { success: false, error: "Unauthorized" };
            }
        }

        await prisma.user.delete({ where: { id: userId } });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete" };
    }
}

export async function updateUserStatus(userId: string, status: string) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { status }
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
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userTenantId = (session?.user as any)?.tenantId;
    const userHubId = (session?.user as any)?.hubId;

    if (!['SUPER_ADMIN', 'TENANT_ADMIN', 'HUB_ADMIN', 'STAFF'].includes(userRole)) {
        throw new Error("Unauthorized");
    }

    try {
        // Base filter: Exclude customers (role: 'USER') because they have their own section.
        // Also exclude SUPER_ADMIN from this list (System Level, not Shop Level).
        const where: any = {
            role: { notIn: ['USER', 'SUPER_ADMIN'] }
        };

        // Role-based scoping
        if (userRole === 'SUPER_ADMIN') {
            // Super Admin sees all (or could filter by tenant if context provided, but here all)
        } else if (userRole === 'TENANT_ADMIN') {
            if (userTenantId) where.tenantId = userTenantId;
        } else if (userRole === 'HUB_ADMIN') {
            if (userTenantId) where.tenantId = userTenantId;
            if (userHubId) where.hubId = userHubId; // Hub Admins only see users in their hub
        } else if (userRole === 'STAFF') {
            // Staff usually don't see this list, but if they do:
            if (userTenantId) where.tenantId = userTenantId;
            if (userHubId) where.hubId = userHubId;
        }

        const users = await prisma.user.findMany({
            where,
            orderBy: { id: 'desc' },
            // Include permissions in select
            select: { id: true, name: true, email: true, role: true, phone: true, status: true, permissions: true, hubId: true }
        });
        return users;
    } catch (error) {
        console.error("getAllUsers Error:", error);
        return [];
    }
}

export async function getUserProfile(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        return user;
    } catch (error) {
        return null;
    }
}

/**
 * Bulk import customers from AI-parsed data
 */
export async function bulkImportCustomers(customers: { name: string; phone: string; email?: string }[]) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'SUPER_ADMIN' && (session?.user as any)?.role !== 'HUB_ADMIN') {
        return { success: false, error: "Unauthorized", imported: 0, skipped: 0 };
    }

    let imported = 0;
    let skipped = 0;

    for (const customer of customers) {
        try {
            // Check if phone already exists
            const existing = await prisma.user.findFirst({ where: { phone: customer.phone } });
            if (existing) {
                skipped++;
                continue;
            }

            await prisma.user.create({
                data: {
                    name: customer.name,
                    phone: customer.phone,
                    email: customer.email || `${customer.phone}@placeholder.com`,
                    role: 'USER'
                }
            });
            imported++;
        } catch (error) {
            console.error("Import error for", customer.phone, error);
            skipped++;
        }
    }

    // ... existing code ...
    return { success: true, imported, skipped };
}

export async function resetUserPassword(userId: string, newPassword?: string) {
    const session = await auth();
    const callerRole = (session?.user as any)?.role;

    if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'TENANT_ADMIN' && callerRole !== 'HUB_ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return { success: false, error: "User not found" };

        // Hierarchy Check
        if (targetUser.role === 'SUPER_ADMIN' && callerRole !== 'SUPER_ADMIN') {
            return { success: false, error: "Cannot reset Super Admin password" };
        }
        if (targetUser.role === 'TENANT_ADMIN' && callerRole === 'HUB_ADMIN') {
            return { success: false, error: "Unauthorized" };
        }

        const passwordToSet = newPassword || randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(passwordToSet, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return { success: true, password: passwordToSet };
    } catch (error) {
        return { success: false, error: "Failed to reset password" };
    }
}

export async function generateImpersonationToken(targetUserId: string) {
    const session = await auth();
    const callerRole = (session?.user as any)?.role;

    // Only Admins can impersonate
    if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'TENANT_ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) return { success: false, error: "User not found" };

        // Cannot impersonate a Super Admin unless you are one
        if (targetUser.role === 'SUPER_ADMIN' && callerRole !== 'SUPER_ADMIN') {
            return { success: false, error: "Cannot impersonate Super Admin" };
        }

        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Use VerificationToken table
        const identifier = `impersonate:${targetUserId}`;

        // Cleanup old tokens
        await prisma.verificationToken.deleteMany({
            where: { identifier }
        });

        await prisma.verificationToken.create({
            data: {
                identifier,
                token,
                expires
            }
        });

        return { success: true, token };
    } catch (error) {
        console.error("Impersonation error:", error);
        return { success: false, error: "Failed to generate token" };
    }
}

