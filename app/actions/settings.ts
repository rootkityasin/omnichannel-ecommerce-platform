'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { ShopType } from '@prisma/client';

export const getSiteConfig = unstable_cache(
    async () => {
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
            termsPolicy: ""
        };

        try {
            const config = await prisma.siteConfig.findFirst();
            if (!config) return defaults;
            return {
                ...defaults,
                ...config,
                shopType: config.shopType || defaults.shopType,
            };
        } catch (error) {
            console.error("Failed to fetch site config:", error);
            return defaults;
        }
    },
    ['site-config'],
    { revalidate: 3600, tags: ['site-config'] }
);

export async function updateSiteConfig(data: any) {
    try {
        const existing = await prisma.siteConfig.findFirst();

        if (existing) {
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
        } else {
            await prisma.siteConfig.create({
                data: {
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

        // revalidateTag('site-config');
        revalidatePath('/', 'layout'); // Revalidate all pages layout
        revalidatePath('/admin/shop');
        return { success: true };
    } catch (error) {
        console.error("Failed to update settings:", error);
        return { success: false, error: String(error) };
    }
}

export async function getPaymentConfig() {
    try {
        const config = await prisma.paymentConfig.findFirst();
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
    try {
        const existing = await prisma.paymentConfig.findFirst();

        if (existing) {
            await prisma.paymentConfig.update({
                where: { id: existing.id },
                data: {
                    ...data
                }
            });
        } else {
            await prisma.paymentConfig.create({
                data: {
                    ...data
                }
            });
        }

        revalidatePath('/admin/shop');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to save payment config" };
    }
}

export async function getDeliveryConfig() {
    try {
        const config = await prisma.deliveryConfig.findFirst();
        if (!config) {
            return {
                defaultCharge: 0,
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
    try {
        const existing = await prisma.deliveryConfig.findFirst();

        if (existing) {
            await prisma.deliveryConfig.update({
                where: { id: existing.id },
                data: {
                    defaultCharge: parseInt(data.defaultCharge || 0),
                    defaultCodEnabled: data.defaultCodEnabled,
                    nonRefundable: data.nonRefundable,
                    weightBasedCharges: data.weightBasedCharges || [],
                    deliveryZones: data.deliveryZones || [],
                    courierPathaoEnabled: data.courierPathaoEnabled,
                    courierPathaoCredentials: data.courierPathaoCredentials
                }
            });
        } else {
            await prisma.deliveryConfig.create({
                data: {
                    defaultCharge: parseInt(data.defaultCharge || 0),
                    defaultCodEnabled: data.defaultCodEnabled,
                    nonRefundable: data.nonRefundable,
                    weightBasedCharges: data.weightBasedCharges || [],
                    deliveryZones: data.deliveryZones || [],
                    courierPathaoEnabled: data.courierPathaoEnabled,
                    courierPathaoCredentials: data.courierPathaoCredentials
                }
            });
        }

        revalidatePath('/admin/shop');
        return { success: true };
    } catch (error) {
        console.error("Failed to update delivery config:", error);
        return { success: false, error: "Failed to save delivery config" };
    }
}
