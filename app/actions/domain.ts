'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { addDomainToVercel, removeDomainFromVercel, verifyDomainOnVercel, getDomainResponse } from '@/lib/vercel';

export async function updateDomainSettings(data: { slug?: string; customDomain?: string | null }) {
    const session = await auth();
    const tenantId = session?.user?.tenantId;

    if (!tenantId) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });

        if (!tenant) return { success: false, error: "Tenant not found" };

        // 1. Handle Slug Update
        if (data.slug !== undefined && data.slug !== tenant.slug) {
            // Check availability
            const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } });
            if (existing) {
                return { success: false, error: "This shop name is already taken." };
            }
            await prisma.tenant.update({
                where: { id: tenantId },
                data: { slug: data.slug }
            });
        }

        // 2. Handle Custom Domain Update
        if (data.customDomain !== undefined) {
            // If removing domain
            if (data.customDomain === null || data.customDomain === '') {
                if (tenant.customDomain) {
                    // Try to remove from Vercel (don't block if fails)
                    try {
                        await removeDomainFromVercel(tenant.customDomain);
                    } catch (e) {
                        console.error("Failed to remove domain from Vercel:", e);
                    }
                }
                await prisma.tenant.update({
                    where: { id: tenantId },
                    data: { customDomain: null }
                });
            }
            // If adding/changing domain
            else if (data.customDomain !== tenant.customDomain) {
                // Check if taken in DB
                const existingDomain = await prisma.tenant.findUnique({ where: { customDomain: data.customDomain } });
                if (existingDomain) {
                    return { success: false, error: "This domain is already connected to another shop." };
                }

                // Add to Vercel
                try {
                    const vercelRes = await addDomainToVercel(data.customDomain);
                    if (vercelRes.error) {
                        console.error("Vercel Add Domain Error:", vercelRes.error);
                        return { success: false, error: `Failed to add domain provider: ${vercelRes.error.message}` };
                    }
                } catch (e) {
                    console.error("Vercel Add Domain Exception:", e);
                    // proceed anyway? No, strict mode.
                    return { success: false, error: "Failed to configure domain on server provider." };
                }

                await prisma.tenant.update({
                    where: { id: tenantId },
                    data: { customDomain: data.customDomain }
                });
            }
        }

        revalidatePath('/admin/shop');
        return { success: true };

    } catch (error) {
        console.error("Update Domain Settings Error:", error);
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function verifyDomain(domain: string) {
    if (!domain) return { success: false, error: "No domain provided" };

    try {
        const response = await verifyDomainOnVercel(domain);
        if (response.error) {
            return { success: false, error: response.error.message };
        }
        return { success: true, verified: response.verified };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function checkDomainStatus(domain: string) {
    if (!domain) return { success: false, error: "No domain provided" };

    try {
        const response = await getDomainResponse(domain);
        if (response.error) {
            return { success: false, error: response.error.message };
        }

        // Vercel response structure
        // verified: boolean
        // verification: array or object details
        // misconfigured: boolean

        return {
            success: true,
            status: response
        };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}
