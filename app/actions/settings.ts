'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { Prisma, ShopType } from '@prisma/client';
import { auth } from '@/auth';

type JsonObject = Record<string, unknown>;
const getSessionUser = async () => (await auth())?.user;

const getString = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const getNumber = (value: unknown, fallback = 0) => Number(value ?? fallback) || fallback;
const getOptionalString = (value: unknown) => typeof value === 'string' ? value : undefined;


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
            certificates: [] as unknown[],
            primaryColor: "#F40000",
            secondaryColor: "#ffffff",
            taxPercentage: 0.0,
            shopType: 'RESTAURANT',
            weightUnitValue: 200,
            volumeUnitValue: 1000,
            privacyPolicy: "",
            refundPolicy: "",
            termsPolicy: "",
            // SEO
            seoTitle: "",
            seoDescription: "",
            seoKeywords: "",
            ogTitle: "",
            ogDescription: "",
            ogImage: "",
            twitterCard: "summary_large_image",
            twitterTitle: "",
            twitterDescription: "",
            twitterImage: "",
            jsonLdType: "Restaurant",
            robots: "index, follow",
            canonicalUrl: "",
            metaPixelId: "",
            metaAccessToken: "",
            socialFacebook: "",
            socialInstagram: "",
            socialTwitter: "",
            socialLinkedIn: "",
            socialYoutube: "",
            // Tenant fields
            tenantId: "",
            customDomain: "",
            slug: ""
        };

        try {
            console.log(`[getPublicSiteConfig] Fetching for domain: ${domain}`);

            // Normalize domain to handle www. similar to getTenantByDomain
            const normalized = domain.toLowerCase().replace('www.', '');
            const subdomain = normalized.split('.')[0];

            const tenantWhere = {
                OR: [
                    { slug: subdomain },
                    { customDomain: domain },
                    { customDomain: normalized },
                    { slug: domain }
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
                    logoUrl: true, // Re-enabled for Dynamic Invoice & Header
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
                    seoTitle: true,
                    seoDescription: true,
                    seoKeywords: true,
                    ogTitle: true,
                    ogDescription: true,
                    ogImage: true,
                    twitterCard: true,
                    twitterTitle: true,
                    twitterDescription: true,
                    twitterImage: true,
                    jsonLdType: true,
                    robots: true,
                    canonicalUrl: true,
                    metaPixelId: true,
                    metaAccessToken: true,
                    socialFacebook: true,
                    socialInstagram: true,
                    socialTwitter: true,
                    socialLinkedIn: true,
                    socialYoutube: true,
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
                logoUrl: config.logoUrl || defaults.logoUrl,
                shopType: config.shopType || defaults.shopType,
                tenantId: config.tenantId || "",
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
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;

    const defaults = {
        contactPhone: "",
        contactEmail: "",
        contactAddress: "",
        shopName: "",
        logoUrl: "",
        measurementUnit: "PCS",
        allergensText: "",
        certificates: [] as unknown[],
        primaryColor: "#F40000",
        secondaryColor: "#ffffff",
        taxPercentage: 0.0,
        shopType: 'RESTAURANT',
        weightUnitValue: 200,
        volumeUnitValue: 1000,
        privacyPolicy: "",
        refundPolicy: "",
        termsPolicy: "",
        // SEO
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        twitterCard: "summary_large_image",
        twitterTitle: "",
        twitterDescription: "",
        twitterImage: "",
        jsonLdType: "Restaurant",
        robots: "index, follow",
        canonicalUrl: "",
        metaPixelId: "",
        metaAccessToken: "",
        socialFacebook: "",
        socialInstagram: "",
        socialTwitter: "",
        socialLinkedIn: "",
        socialYoutube: "",
        // Tenant
        tenantId: "",
        customDomain: "",
        slug: "",
        invoiceTheme: "modern",
        invoiceDetails: { showSeller: true, showBuyer: true, showSignature: true, watermarkOpacity: 0.1, fontSize: 14 } as JsonObject,
        plan: "FREE"
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
                logoUrl: true, // Re-enabled for Dynamic Invoice Watermark
                measurementUnit: true,
                allergensText: true,
                // certificates: true, 
                primaryColor: true,
                secondaryColor: true,
                taxPercentage: true,
                shopType: true,
                weightUnitValue: true,
                volumeUnitValue: true,
                privacyPolicy: true,
                refundPolicy: true,
                termsPolicy: true,
                invoiceTheme: true,
                invoiceDetails: true,
                // SEO
                seoTitle: true,
                seoDescription: true,
                seoKeywords: true,
                ogTitle: true,
                ogDescription: true,
                ogImage: true,
                twitterCard: true,
                twitterTitle: true,
                twitterDescription: true,
                twitterImage: true,
                jsonLdType: true,
                robots: true,
                canonicalUrl: true,
                metaPixelId: true,
                metaAccessToken: true,
                socialFacebook: true,
                socialInstagram: true,
                socialTwitter: true,
                socialLinkedIn: true,
                socialYoutube: true,
                tenant: {
                    select: {
                        slug: true,
                        customDomain: true,
                        plan: true
                    }
                }
            }
        });

        if (!config) {
            console.log(`[getAdminSiteConfig] No config found for tenant ${tenantId}`);
            return defaults;
        }

        return {
            ...defaults,
            ...config,
            logoUrl: config.logoUrl || defaults.logoUrl,
            shopType: config.shopType || defaults.shopType,
            tenantId: config.tenantId || "",
            customDomain: config.tenant?.customDomain || "",
            slug: config.tenant?.slug || "",
            plan: config.tenant?.plan || "FREE"
        };
    } catch (error) {
        console.error("Failed to fetch admin site config:", error);
        return defaults;
    }
}

export async function updateSiteConfig<T extends object>(data: T) {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    const input = data as Record<string, unknown>;

    if (!tenantId) {
        return { success: false, error: "Unauthorized: Tenant ID not found in session." };
    }

    try {


        // 1. Fetch Tenant Plan for Gating
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { plan: true }
        });
        const plan = tenant?.plan || 'FREE';
        const isStandardOrHigher = ['STANDARD', 'PLATINUM', 'ENTERPRISE'].includes(plan);

        // 2. Validate SEO Access
        // Identify if SEO fields are present in the update payload
        const seoFields = [
            'seoTitle', 'seoDescription', 'seoKeywords',
            'ogTitle', 'ogDescription', 'ogImage',
            'twitterCard', 'twitterTitle', 'twitterDescription', 'twitterImage',
            'jsonLdType', 'robots', 'canonicalUrl', 'sitelinks',
            'socialFacebook', 'socialInstagram', 'socialTwitter', 'socialLinkedIn', 'socialYoutube',
            'metaPixelId', 'metaAccessToken'
        ];

        // Construct safe SEO payload based on plan
        const seoPayload: Record<string, unknown> = {};

        for (const field of seoFields) {
                const fieldValue = input[field];
            if (fieldValue !== undefined) {
                if (isStandardOrHigher) {
                    // Premium users get everything
                    seoPayload[field] = fieldValue;
                } else {
                    // Free/Basic users ONLY get Basic SEO + Social Image
                    if (['seoTitle', 'seoDescription', 'seoKeywords', 'ogImage'].includes(field)) {
                        seoPayload[field] = fieldValue;
                    }
                }
            }
        }


        const existing = await prisma.siteConfig.findFirst({
            where: { tenantId },
            select: {
                id: true,
                tenantId: true,
                tenant: {
                    select: {
                        customDomain: true,
                        slug: true
                    }
                }
            }
        });

        const commonData = {
            contactPhone: getString(input.contactPhone),
            contactEmail: getString(input.contactEmail),
            contactAddress: getString(input.contactAddress),
            shopName: getString(input.shopName),
            logoUrl: getString(input.logoUrl),
            measurementUnit: getString(input.measurementUnit, 'PCS'),
            allergensText: getString(input.allergensText),
            certificates: Array.isArray(input.certificates) ? input.certificates : [],
            primaryColor: getString(input.primaryColor, '#F40000'),
            secondaryColor: getString(input.secondaryColor, '#ffffff'),
            taxPercentage: getNumber(input.taxPercentage, 0),
            shopType: (typeof input.shopType === 'string' ? (input.shopType as ShopType) : ShopType.RESTAURANT),
            weightUnitValue: getNumber(input.weightUnitValue, 200),
            volumeUnitValue: getNumber(input.volumeUnitValue, 1000),
            privacyPolicy: getString(input.privacyPolicy),
            refundPolicy: getString(input.refundPolicy),
            termsPolicy: getString(input.termsPolicy),
            ...seoPayload, // Apply filtered SEO fields
            metaPixelId: getString(input.metaPixelId),
            metaAccessToken: getString(input.metaAccessToken),
            invoiceTheme: getString(input.invoiceTheme, 'modern'),
            invoiceDetails: (typeof input.invoiceDetails === 'object' && input.invoiceDetails !== null ? input.invoiceDetails : {}) as Prisma.InputJsonValue
        };

        const customDomain = getOptionalString(input.customDomain);
        const slug = getOptionalString(input.slug);

        if (existing) {
            // Update Site Config
            await prisma.siteConfig.update({
                where: { id: existing.id },
                data: commonData
            });

            // Update Tenant Domain if changed
            if (customDomain !== undefined) {
                if (customDomain !== existing.tenant?.customDomain) {
                    await prisma.tenant.update({
                        where: { id: existing.tenantId! },
                        data: {
                            customDomain: customDomain || null
                        }
                    });
                }
            }

            // Update Tenant Slug if changed
            if (slug !== undefined && slug !== existing.tenant?.slug) {
                // Check if slug is taken
                const slugTaken = await prisma.tenant.findUnique({
                    where: { slug }
                });

                if (slugTaken) {
                    return { success: false, error: "This shop name is already taken." };
                }

                await prisma.tenant.update({
                        where: { id: existing.tenantId! },
                        data: {
                            slug
                        }
                    });
            }

        } else {
            // Create Logic
            await prisma.siteConfig.create({
                data: {
                    tenantId,
                    ...commonData,
                    primaryColor: getString(input.primaryColor, '#F40000'),
                    secondaryColor: getString(input.secondaryColor, '#0f172a')
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
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;

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
                bkashLogo: '',
                nagadLogo: '',
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

export async function updatePaymentConfig<T extends object>(data: T) {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;

    if (!tenantId) return { success: false, error: "Unauthorized" };

    try {
        const updateData: Record<string, unknown> = { ...(data as Record<string, unknown>) };
        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.tenantId;
        delete updateData.bkashImage;
        delete updateData.tenant;

        await prisma.paymentConfig.upsert({
            where: { tenantId },
            update: updateData as Prisma.PaymentConfigUncheckedUpdateInput,
            create: {
                ...(updateData as Prisma.PaymentConfigUncheckedCreateInput),
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
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;

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

export async function updateDeliveryConfig<T extends object>(data: T) {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    const input = data as Record<string, unknown>;

    if (!tenantId) return { success: false, error: "Unauthorized" };

    try {
        const updateData: Record<string, unknown> = { ...input };
        delete updateData.id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        delete updateData.tenantId;
        delete updateData.tenant;

        await prisma.deliveryConfig.upsert({
            where: { tenantId },
            update: {
                ...(updateData as Prisma.DeliveryConfigUpdateInput),
                defaultCharge: getNumber(input.defaultCharge, 0),
            },
            create: {
                ...(updateData as Prisma.DeliveryConfigUncheckedCreateInput),
                tenantId,
                defaultCharge: getNumber(input.defaultCharge, 0),
            }
        });

        revalidatePath('/admin/shop', 'page');
        return { success: true };
    } catch (error) {
        console.error("Failed to update delivery config:", error);
        return { success: false, error: "Failed to save delivery config" };
    }
}
