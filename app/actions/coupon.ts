"use server";

import { prisma as globalPrisma } from "@/lib/prisma";
import type { DiscountType } from "@prisma/client";

import { auth } from "@/auth";

const prisma = globalPrisma;
import { revalidatePath } from "next/cache";

type CouponPayload = {
  code: string;
  discountType: DiscountType | string;
  discountValue: number | string;
  minOrderAmount: number | string;
  expiresAt?: string | Date | null;
  isActive?: boolean;
  usageLimit?: number | string | null;
  productId?: string | null;
};

const normalizeDiscountType = (value: string): DiscountType =>
  value === "PERCENTAGE" ? "PERCENTAGE" : "FIXED";

export async function createCoupon(data: CouponPayload) {
  try {
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    let productId: string | null = null;
    if (data.productId) {
      const product = await prisma.product.findFirst({
        where: { id: data.productId, tenantId },
        select: { id: true },
      });

      if (!product) {
        return { success: false, error: "Invalid product selection" };
      }

      productId = product.id;
    }

    const existing = await prisma.coupon.findFirst({
      where: {
        code: data.code,
        tenantId,
      },
    });

    if (existing) {
      return { success: false, error: "Coupon code already exists" };
    }

    const coupon = await prisma.coupon.create({
      data: {
        tenantId,
        code: data.code,
        productId,
        discountType: normalizeDiscountType(data.discountType),
        discountValue: Number(data.discountValue),
        minOrderAmount: Number(data.minOrderAmount),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? true,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      },
    });

    revalidatePath("/admin/promos");
    return { success: true, coupon };
  } catch (error) {
    console.error("Create coupon error:", error);
    return { success: false, error: "Failed to create coupon" };
  }
}

export async function getCoupons() {
  try {
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    if (!tenantId) return [];

    return await prisma.coupon.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: { id: true, name: true },
        },
      },
    });
  } catch {
    return [];
  }
}

export async function deleteCoupon(id: string) {
  try {
    await prisma.coupon.delete({ where: { id } });
    revalidatePath("/admin/promos");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete" };
  }
}

export async function updateCoupon(id: string, data: CouponPayload) {
  try {
    // Check availability if code changed
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code },
    });

    if (existing && existing.id !== id) {
      return { success: false, error: "Coupon code already exists" };
    }

    const currentCoupon = await prisma.coupon.findUnique({
      where: { id },
      select: { tenantId: true },
    });

    if (!currentCoupon) {
      return { success: false, error: "Coupon not found" };
    }

    let productId: string | null = null;
    if (data.productId) {
      if (currentCoupon.tenantId) {
        const product = await prisma.product.findFirst({
          where: { id: data.productId, tenantId: currentCoupon.tenantId },
          select: { id: true },
        });

        if (!product) {
          return { success: false, error: "Invalid product selection" };
        }
      }

      productId = data.productId;
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: data.code,
        productId,
        discountType: normalizeDiscountType(data.discountType),
        discountValue: Number(data.discountValue),
        minOrderAmount: Number(data.minOrderAmount),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
      },
    });

    revalidatePath("/admin/promos");
    return { success: true, coupon };
  } catch (error) {
    console.error("Update coupon error:", error);
    return { success: false, error: "Failed to update coupon" };
  }
}

export async function validateCoupon(
  code: string,
  cartTotal: number,
  tenantId?: string,
  items?: { productId: string; quantity: number; price: number }[],
) {
  try {
    if (!tenantId) {
      const session = await auth();
      tenantId = session?.user?.tenantId ?? undefined;
    }

    if (!tenantId) {
      return { success: false, error: "Missing tenant context" };
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code,
        tenantId,
      },
      include: {
        product: {
          select: { id: true, name: true },
        },
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

    const resolvedCartTotal = items?.length
      ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : cartTotal;

    let eligibleTotal = resolvedCartTotal;
    if (coupon.productId) {
      if (!items?.length) {
        return {
          success: false,
          error: "Coupon requires a specific product in the cart",
        };
      }

      eligibleTotal = items
        .filter((item) => item.productId === coupon.productId)
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (eligibleTotal <= 0) {
        return {
          success: false,
          error: `Coupon applies only to ${coupon.product?.name || "the selected product"}`,
        };
      }
    }

    const minOrderBasis = coupon.productId ? eligibleTotal : resolvedCartTotal;
    if (minOrderBasis < coupon.minOrderAmount) {
      return {
        success: false,
        error: `Minimum order amount is ${coupon.minOrderAmount}`,
      };
    }

    // Calculate discount
    let discount = 0;
    const discountBase = coupon.productId ? eligibleTotal : resolvedCartTotal;
    if (coupon.discountType === "PERCENTAGE") {
      discount = Math.floor((discountBase * coupon.discountValue) / 100);
    } else {
      discount = coupon.discountValue;
    }

    // Cap discount at total amount? usually yes
    if (discount > discountBase) {
      discount = discountBase;
    }

    return {
      success: true,
      discount, // Calculated amount for immediate display/validation
      value: coupon.discountValue, // Raw value for store
      code: coupon.code,
      type: coupon.discountType,
      productId: coupon.productId || null,
      productName: coupon.product?.name || null,
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

    revalidatePath("/admin/promos");
    return { success: true };
  } catch (error) {
    console.error("Toggle coupon status error:", error);
    return { success: false, error: "Failed to toggle status" };
  }
}
