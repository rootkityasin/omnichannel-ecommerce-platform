'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';

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
export async function createUserWithRole(data: { name: string; email: string; phone: string; role: 'SUPER_ADMIN' | 'HUB_ADMIN' | 'USER'; password?: string }) {
    const session = await auth();
    // Only Super Admin can creating other Admins
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
        return { success: false, error: "Unauthorized: Only Super Admins can create users with roles." };
    }

    try {
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) return { success: false, error: "Email already taken" };

        const hashedPassword = await bcrypt.hash(data.password || '123456', 10); // Default pwd

        const user = await prisma.user.create({
            data: {
                tenantId: (session?.user as any)?.tenantId, // Inherit tenant from creator
                name: data.name,
                email: data.email,
                phone: data.phone,
                role: data.role,
                password: hashedPassword
            }
        });
        return { success: true, user };
    } catch (error: any) {
        console.error(error);
        return { success: false, error: "Failed to create user" };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await prisma.user.delete({ where: { id: userId } });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete" };
    }
}

/* 
  Re-exporting getAllUsers but careful to not break existing signature 
  The previous file had simple getAllUsers. preserving it.
*/
export async function getAllUsers() {
    const session = await auth();
    // allow HUB_ADMIN too?
    if ((session?.user as any)?.role !== 'SUPER_ADMIN' && (session?.user as any)?.role !== 'HUB_ADMIN') {
        throw new Error("Unauthorized");
    }

    try {
        const tenantId = (session?.user as any)?.tenantId; // HUB_ADMIN/SUPER_ADMIN should belong to a tenant? 
        // If SUPER_ADMIN is global, they might want to see all users OR keyset pagination.
        // Assuming strict tenancy for now.
        const where: any = { role: 'USER' };
        if (tenantId) where.tenantId = tenantId;

        const users = await prisma.user.findMany({
            where, // Only show customers, filtered by tenant
            orderBy: { id: 'desc' },
            select: { id: true, name: true, email: true, role: true, phone: true, status: true }
        });
        return users;
    } catch (error) {
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

    return { success: true, imported, skipped };
}

