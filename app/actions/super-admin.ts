'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { ShopType } from '@prisma/client';

import { hash } from 'bcryptjs';

// --- Security Middleware ---
async function checkSuperAdmin() {
    const sessionUser = (await auth())?.user;
    // In real app, verify role strictly. 
    // For now, assuming access to this action means checked by page/middleware.
    // Adding basic check:
    if (sessionUser?.role !== 'SUPER_ADMIN') {
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
        // 1. Create Tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: data.name,
                slug: data.slug,
                plan: data.plan || 'FREE',
                setupFee: 6000,
                setupFeePaid: data.setupFeePaid || false,
                siteConfig: {
                    create: {
                        shopName: data.name,
                        contactEmail: data.email,
                        shopType: data.shopType || 'RESTAURANT'
                    }
                }
            }
        });

        // 2. Create Default Admin User for Tenant
        const hashedPassword = await hash(data.password || 'password123', 12);
        const user = await prisma.user.create({
            data: {
                name: `${data.name} Admin`,
                email: data.email,
                password: hashedPassword,
                role: 'HUB_ADMIN', // Or TENANT_ADMIN if role exists
                tenantId: tenant.id
            }
        });

        revalidatePath('/app');
        return { success: true, tenant, user };
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

// --- User Management ---
export async function getTenantUsers(tenantId: string) {
    await checkSuperAdmin();
    try {
        const users = await prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                isBlocked: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });
        return { success: true, users };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function updateTenantUserStatus(userId: string, isBlocked: boolean) {
    await checkSuperAdmin();
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isBlocked }
        });
        revalidatePath('/app');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// --- Tenant Details Management (Super Admin) ---

export async function getTenantDetails(tenantId: string) {
    await checkSuperAdmin();
    try {
        const config = await prisma.siteConfig.findUnique({
            where: { tenantId }
        });

        // Fetch tenant to get the slug and primary admin user
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                users: {
                    where: { role: 'HUB_ADMIN' },
                    take: 1
                }
            }
        });

        if (!config || !tenant) return { success: false, error: "Tenant configuration not found" };

        return {
            success: true,
            data: {
                ...config,
                slug: tenant.slug, // Include slug for display
                tenantName: tenant.name, // Include original tenant name
                adminEmail: tenant.users[0]?.email || '' // Current primary admin email
            }
        };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function updateTenantDetails(tenantId: string, data: {
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
}) {
    await checkSuperAdmin();
    try {
        // Transaction to ensure everything is updated atomically
        await prisma.$transaction(async (tx) => {
            // 1. Update SiteConfig
            await tx.siteConfig.update({
                where: { tenantId },
                data: {
                    shopName: data.shopName,
                    shopType: data.shopType,
                    contactPhone: data.contactPhone,
                    contactEmail: data.contactEmail,
                    contactAddress: data.contactAddress,
                    logoUrl: data.logoUrl,
                    measurementUnit: data.measurementUnit,
                    weightUnitValue: data.weightUnitValue,
                    volumeUnitValue: data.volumeUnitValue
                }
            });

            // 2. Update Tenant Name
            await tx.tenant.update({
                where: { id: tenantId },
                data: { name: data.shopName }
            });

            // 3. Update Admin Credentials if provided
            if (data.adminEmail || data.adminPassword) {
                // Check if the provided email is already in use by ANYONE
                let existingUserWithEmail = null;
                if (data.adminEmail) {
                    existingUserWithEmail = await tx.user.findUnique({
                        where: { email: data.adminEmail.toLowerCase() }
                    });
                }

                if (existingUserWithEmail && existingUserWithEmail.tenantId !== tenantId) {
                    throw new Error(`Email ${data.adminEmail} is already in use by another shop or system user.`);
                }

                // Find existing primary admin (HUB_ADMIN)
                const primaryAdmin = await tx.user.findFirst({
                    where: { tenantId, role: 'HUB_ADMIN' }
                });

                if (primaryAdmin) {
                    // Update existing HUB_ADMIN
                    const updateData: any = {};
                    if (data.adminEmail) updateData.email = data.adminEmail.toLowerCase();
                    if (data.adminPassword) {
                        updateData.password = await hash(data.adminPassword, 12);
                    }

                    // If target email is taken by ANOTHER user in same tenant, we need to handle it
                    if (existingUserWithEmail && existingUserWithEmail.id !== primaryAdmin.id) {
                        // Target email belongs to another user in this tenant. 
                        // Promote that user and demote/delete the old HUB_ADMIN? 
                        // Simpler: Just error out and tell them.
                        throw new Error(`A user with email ${data.adminEmail} already exists in this shop but is not the primary admin. Please remove them or use a different email.`);
                    }

                    await tx.user.update({
                        where: { id: primaryAdmin.id },
                        data: updateData
                    });
                } else if (existingUserWithEmail) {
                    // Email exists in this tenant but not as HUB_ADMIN. Promote them.
                    const updateData: any = { role: 'HUB_ADMIN' };
                    if (data.adminPassword) {
                        updateData.password = await hash(data.adminPassword, 12);
                    }
                    await tx.user.update({
                        where: { id: existingUserWithEmail.id },
                        data: updateData
                    });
                } else if (data.adminEmail) {
                    // Create a new admin user if none exists
                    await tx.user.create({
                        data: {
                            name: `${data.shopName} Admin`,
                            email: data.adminEmail.toLowerCase(),
                            password: await hash(data.adminPassword || 'password123', 12),
                            role: 'HUB_ADMIN',
                            tenantId: tenantId
                        }
                    });
                }
            }
        });

        revalidatePath('/app');
        return { success: true };
    } catch (error) {
        console.error("Update Tenant Details Error:", error);
        return { success: false, error: String(error) };
    }
}
