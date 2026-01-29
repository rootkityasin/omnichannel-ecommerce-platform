'use server';

import { prisma as globalPrisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

import { auth } from '@/auth';

// Fallback to local instance if global is stale (missing coupon delegate)
const prisma = (globalPrisma as any).coupon
    ? globalPrisma
    : new PrismaClient();
import { revalidatePath } from "next/cache";

export async function createCoupon(data: any) {
    try {
        const session = await auth();
        const tenantId = (session?.user as any)?.tenantId;
        if (!tenantId) return { success: false, error: "Unauthorized" };

        const existing = await prisma.coupon.findFirst({
            where: {
                code: data.code,
                tenantId
            },
        });

        if (existing) {
            return { success: false, error: "Coupon code already exists" };
        }

        const coupon = await prisma.coupon.create({
            data: {
                tenantId,
                code: data.code,
                discountType: data.discountType,
                discountValue: Number(data.discountValue),
                minOrderAmount: Number(data.minOrderAmount),
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                isActive: data.isActive ?? true,
                usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
            },
        });

        revalidatePath('/admin/promos');
        return { success: true, coupon };
    } catch (error) {
        console.error("Create coupon error:", error);
        return { success: false, error: "Failed to create coupon" };
    }
}

export async function getCoupons() {
    try {
        const session = await auth();
        const tenantId = (session?.user as any)?.tenantId;
        if (!tenantId) return [];

        return await prisma.coupon.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error) {
        return [];
    }
}

export async function deleteCoupon(id: string) {
    try {
        await prisma.coupon.delete({ where: { id } });
        revalidatePath('/admin/promos');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete" };
    }
}

export async function updateCoupon(id: string, data: any) {
    try {
        // Check availability if code changed
        const existing = await prisma.coupon.findUnique({
            where: { code: data.code },
        });

        if (existing && existing.id !== id) {
            return { success: false, error: "Coupon code already exists" };
        }

        const coupon = await prisma.coupon.update({
            where: { id },
            data: {
                code: data.code,
                discountType: data.discountType,
                discountValue: Number(data.discountValue),
                minOrderAmount: Number(data.minOrderAmount),
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
                usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
            },
        });

        revalidatePath('/admin/promos');
        return { success: true, coupon };
    } catch (error) {
        console.error("Update coupon error:", error);
        return { success: false, error: "Failed to update coupon" };
    }
}

export async function validateCoupon(code: string, cartTotal: number, tenantId?: string) {
    try {
        // If tenantId is not provided, we can't safely validate in multi-tenant env unless code is globally unique (which it isn't)
        if (!tenantId) {
            console.warn("Validating coupon without tenantId - checking all (unsafe?)");
        }

        const coupon = await prisma.coupon.findFirst({
            where: {
                code,
                ...(tenantId && { tenantId })
            },
        });

        if (!coupon) {
            return { success: false, error: "Invalid coupon code" };
        }

        if (!coupon.isActive) {
            return { success: false, error: "Coupon is inactive" };
        }

        if (coupon.expiresAt && new Date() > coupon.expiresAt) {
            return { success: false, error: "Coupon has expired" };
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return { success: false, error: "Coupon usage limit reached" };
        }

        if (cartTotal < coupon.minOrderAmount) {
            return { success: false, error: `Minimum order amount is ${coupon.minOrderAmount}` };
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discount = Math.floor((cartTotal * coupon.discountValue) / 100);
        } else {
            discount = coupon.discountValue;
        }

        // Cap discount at total amount? usually yes
        if (discount > cartTotal) {
            discount = cartTotal;
        }

        return {
            success: true,
            discount, // Calculated amount for immediate display/validation
            value: coupon.discountValue, // Raw value for store
            code: coupon.code,
            type: coupon.discountType
        };

    } catch (error) {
        console.error("Validate coupon error:", error);
        return { success: false, error: "Validation failed" };
    }
}

export async function toggleCouponStatus(id: string, isActive: boolean) {
    try {
        await prisma.coupon.update({
            where: { id },
            data: { isActive },
        });

        revalidatePath('/admin/promos');
        return { success: true };
    } catch (error) {
        console.error("Toggle coupon status error:", error);
        return { success: false, error: "Failed to toggle status" };
    }
}
