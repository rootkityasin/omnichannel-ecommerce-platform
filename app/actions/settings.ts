'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { ShopType } from '@prisma/client';
import { auth } from '@/auth';


// Internal cached function for public domain access
const getPublicSiteConfig = unstable_cache(
    async (domain: string) => {
        const defaults = {
            contactPhone: "",
            contactEmail: "",
            contactAddress: "",
            shopName: "",
            logoUrl: "",
            measurementUnit: "PCS",
            allergensText: "",
            certificates: [] as any,
            primaryColor: "#000000",
            secondaryColor: "#ffffff",
            taxPercentage: 0.0,
            shopType: 'RESTAURANT',
            weightUnitValue: 200,
            volumeUnitValue: 1000,
            privacyPolicy: "",
            refundPolicy: "",
            termsPolicy: "",
            // Tenant fields
            customDomain: "",
            slug: ""
        };

        try {
            const tenantWhere = {
                OR: [
                    { slug: domain },
                    { customDomain: domain },
                    { slug: domain.split('.')[0] }
                ]
            };
            const config = await prisma.siteConfig.findFirst({
                where: { tenant: tenantWhere },
                select: {
                    id: true,
                    tenantId: true,
                    contactPhone: true,
                    contactEmail: true,
                    contactAddress: true,
                    shopName: true,
                    // logoUrl: true, // EXCLUDED: Confirmed source of 7.56MB bloat
                    measurementUnit: true,
                    allergensText: true,
                    // certificates: true, // EXCLUDED: Suspected source of >5MB data bloat
                    primaryColor: true,
                    secondaryColor: true,
                    taxPercentage: true,
                    shopType: true,
                    weightUnitValue: true,
                    volumeUnitValue: true,
                    privacyPolicy: true,
                    refundPolicy: true,
                    termsPolicy: true,
                    tenant: {
                        select: {
                            slug: true,
                            customDomain: true
                        }
                    }
                }
            });

            if (!config) return defaults;
            return {
                ...defaults,
                ...config,
                certificates: (config as any).certificates || defaults.certificates,
                logoUrl: (config as any).logoUrl || defaults.logoUrl,
                shopType: config.shopType || defaults.shopType,
                customDomain: config.tenant?.customDomain || "",
                slug: config.tenant?.slug || ""
            };
        } catch (error) {
            console.error("Failed to fetch site config:", error);
            return defaults;
        }
    },
    ['site-config-public'],
    { revalidate: 3600, tags: ['site-config'] }
);

export async function getSiteConfig(domain?: string) {
    if (domain) {
        return getPublicSiteConfig(domain);
    }
    // Fallback to admin/auth context (uncached to prevent leaks)
    return getAdminSiteConfig();
}

export async function getAdminSiteConfig() {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;

    const defaults = {
        contactPhone: "",
        contactEmail: "",
        contactAddress: "",
        shopName: "",
        logoUrl: "",
        measurementUnit: "PCS",
        allergensText: "",
        certificates: [] as any,
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
        taxPercentage: 0.0,
        shopType: 'RESTAURANT',
        weightUnitValue: 200,
        volumeUnitValue: 1000,
        privacyPolicy: "",
        refundPolicy: "",
        termsPolicy: "",
        customDomain: "",
        slug: ""
    };

    if (!tenantId) return defaults;

    try {
        const config = await prisma.siteConfig.findFirst({
            where: { tenantId },
            select: {
                id: true,
                tenantId: true,
                contactPhone: true,
                contactEmail: true,
                contactAddress: true,
                shopName: true,
                // logoUrl: true, // EXCLUDED: Confirmed source of 7.56MB bloat
                measurementUnit: true,
                allergensText: true,
                // certificates: true, // EXCLUDED: Suspected source of >5MB data bloat
                primaryColor: true,
                secondaryColor: true,
                taxPercentage: true,
                shopType: true,
                weightUnitValue: true,
                volumeUnitValue: true,
                privacyPolicy: true,
                refundPolicy: true,
                termsPolicy: true,
                tenant: {
                    select: {
                        slug: true,
                        customDomain: true
                    }
                }
            }
        });

        if (!config) return defaults;

        return {
            ...defaults,
            ...config,
            certificates: (config as any).certificates || defaults.certificates, // Use default since we excluded it
            logoUrl: (config as any).logoUrl || defaults.logoUrl,
            shopType: (config.shopType as any) || defaults.shopType, // Ensure enum cast
            customDomain: config.tenant?.customDomain || "",
            slug: config.tenant?.slug || ""
        };
    } catch (error) {
        console.error("Failed to fetch admin site config:", error);
        return defaults;
    }
}

export async function updateSiteConfig(data: any) {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) {
        return { success: false, error: "Unauthorized: Tenant ID not found in session." };
    }

    try {
        const existing = await prisma.siteConfig.findFirst({
            where: { tenantId },
            include: { tenant: true }
        });

        if (existing) {
            // Update Site Config
            await prisma.siteConfig.update({
                where: { id: existing.id },
                data: {
                    contactPhone: data.contactPhone,
                    contactEmail: data.contactEmail,
                    contactAddress: data.contactAddress,
                    shopName: data.shopName,
                    logoUrl: data.logoUrl,
                    measurementUnit: data.measurementUnit,
                    allergensText: data.allergensText,
                    certificates: data.certificates || [],
                    secondaryColor: data.secondaryColor,
                    taxPercentage: parseFloat(data.taxPercentage || 0),
                    shopType: (data.shopType as ShopType) || ShopType.RESTAURANT,
                    weightUnitValue: parseInt(data.weightUnitValue || 200),
                    volumeUnitValue: parseInt(data.volumeUnitValue || 1000)
                }
            });

            // Update Tenant Domain if changed
            if (data.customDomain !== undefined) {
                if (data.customDomain !== existing.tenant?.customDomain) {
                    await prisma.tenant.update({
                        where: { id: existing.tenantId! },
                        data: {
                            customDomain: data.customDomain || null
                        }
                    });
                }
            }

            // Update Tenant Slug if changed
            if (data.slug !== undefined && data.slug !== existing.tenant?.slug) {
                // Check if slug is taken
                const slugTaken = await prisma.tenant.findUnique({
                    where: { slug: data.slug }
                });

                if (slugTaken) {
                    return { success: false, error: "This shop name is already taken." };
                }

                await prisma.tenant.update({
                    where: { id: existing.tenantId! },
                    data: {
                        slug: data.slug
                    }
                });
            }

        } else {
            // Create Logic
            await prisma.siteConfig.create({
                data: {
                    tenantId,
                    contactPhone: data.contactPhone,
                    contactEmail: data.contactEmail,
                    contactAddress: data.contactAddress,
                    shopName: data.shopName,
                    logoUrl: data.logoUrl,
                    measurementUnit: data.measurementUnit,
                    allergensText: data.allergensText,
                    certificates: data.certificates || [],
                    primaryColor: data.primaryColor || "#ea0000",
                    secondaryColor: data.secondaryColor || "#0f172a",
                    taxPercentage: parseFloat(data.taxPercentage || 0),
                    shopType: (data.shopType as ShopType) || ShopType.RESTAURANT,
                    weightUnitValue: parseInt(data.weightUnitValue || 200),
                    volumeUnitValue: parseInt(data.volumeUnitValue || 1000)
                }
            });
        }

        revalidateTag('site-config', {});
        revalidatePath('/', 'layout');
        revalidatePath('/admin/shop', 'page');
        return { success: true };
    } catch (error) {
        console.error("Failed to update settings:", error);
        if (String(error).includes('Unique constraint failed')) {
            return { success: false, error: "This domain is already taken." };
        }
        return { success: false, error: String(error) };
    }
}


export async function getPaymentConfig() {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) return null;

    try {
        const config = await prisma.paymentConfig.findUnique({
            where: { tenantId }
        });

        if (!config) {
            return {
                isActive: true,
                codEnabled: true,
                bkashEnabled: false,
                bkashAppKey: '',
                bkashSecretKey: '',
                bkashUsername: '',
                bkashPassword: '',
                nagadEnabled: false,
                nagadMerchantNumber: '',
                nagadPublicKey: '',
                nagadPrivateKey: '',
                selfMfsEnabled: false,
                selfMfsType: 'bkash',
                selfMfsPhone: '',
                selfMfsInstruction: '',
                selfMfsQrCode: '',
                advancePaymentType: 'FULL',
                advancePaymentValue: 0
            };
        }
        return config;
    } catch (error) {
        console.error("Failed to fetch payment config:", error);
        return null;
    }
}

export async function updatePaymentConfig(data: any) {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) return { success: false, error: "Unauthorized" };

    try {
        const { id, createdAt, updatedAt, tenantId: _, ...updateData } = data;

        await prisma.paymentConfig.upsert({
            where: { tenantId },
            update: updateData,
            create: {
                ...updateData,
                tenantId
            }
        });

        revalidatePath('/admin/shop', 'page');
        return { success: true };
    } catch (error) {
        console.error("Update Payment Config Error:", error);
        return { success: false, error: "Failed to save payment config" };
    }
}

export async function getDeliveryConfig() {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) return null;

    try {
        const config = await prisma.deliveryConfig.findUnique({
            where: { tenantId }
        });
        if (!config) {
            return {
                defaultCharge: 60,
                defaultCodEnabled: true,
                nonRefundable: false,
                weightBasedCharges: [],
                deliveryZones: [],
                courierPathaoEnabled: false,
                courierPathaoCredentials: null
            };
        }
        return config;
    } catch (error) {
        console.error("Failed to fetch delivery config:", error);
        return null;
    }
}

export async function updateDeliveryConfig(data: any) {
    const session = await auth();
    const tenantId = (session?.user as any)?.tenantId;

    if (!tenantId) return { success: false, error: "Unauthorized" };

    try {
        const { id, createdAt, updatedAt, tenantId: _, ...updateData } = data;

        await prisma.deliveryConfig.upsert({
            where: { tenantId },
            update: {
                ...updateData,
                defaultCharge: parseInt(data.defaultCharge || 0),
            },
            create: {
                ...updateData,
                tenantId,
                defaultCharge: parseInt(data.defaultCharge || 0),
            }
        });

        revalidatePath('/admin/shop', 'page');
        return { success: true };
    } catch (error) {
        console.error("Failed to update delivery config:", error);
        return { success: false, error: "Failed to save delivery config" };
    }
}
