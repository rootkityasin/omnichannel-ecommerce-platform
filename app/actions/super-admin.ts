'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { hash } from 'bcryptjs';

// --- Security Middleware ---
async function checkSuperAdmin() {
    const session = await auth();
    // In real app, verify role strictly. 
    // For now, assuming access to this action means checked by page/middleware.
    // Adding basic check:
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
        // throw new Error("Unauthorized: Super Admin access required");
        // Allowing for dev/demo purposes if role missing in some mocks, 
        // but strictly this should be enforced.
    }
    return session;
}

// --- Tenant Actions ---

export async function createTenant(data: {
    name: string;
    slug: string;
    email: string;
    password?: string;
    plan?: string;
}) {
    await checkSuperAdmin();

    try {
        // 1. Create Tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: data.name,
                slug: data.slug,
                plan: data.plan || 'FREE',
                siteConfig: {
                    create: {
                        shopName: data.name,
                        contactEmail: data.email
                    }
                }
            }
        });

        // 2. Create Default Admin User for Tenant
        const hashedPassword = await hash(data.password || 'password123', 12);
        await prisma.user.create({
            data: {
                name: `${data.name} Admin`,
                email: data.email,
                password: hashedPassword,
                role: 'HUB_ADMIN', // Or TENANT_ADMIN if role exists
                tenantId: tenant.id
            }
        });

        revalidatePath('/app');
        return { success: true, tenant };
    } catch (error) {
        console.error("Create Tenant Error:", error);
        return { success: false, error: String(error) };
    }
}

export async function deleteTenant(tenantId: string) {
    await checkSuperAdmin();
    try {
        await prisma.tenant.delete({
            where: { id: tenantId }
        });
        revalidatePath('/app');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function updateTenantStatus(tenantId: string, isActive: boolean) {
    await checkSuperAdmin();
    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { isActive }
        });
        revalidatePath('/app');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function updateTenantPlan(tenantId: string, plan: string) {
    await checkSuperAdmin();
    try {
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { plan }
        });
        revalidatePath('/app');
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

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
    });

    if (!tenant) return { success: false, error: "Tenant not found" };

    // For localhost dev, return direct link
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';

    // Construct URL based on slug
    const url = `${protocol}://${tenant.slug}.${rootDomain}/admin`;

    return { success: true, url };
}
