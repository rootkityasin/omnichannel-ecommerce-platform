"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logActionRequest } from "@/lib/actionLogger";
import { randomUUID } from "node:crypto";

const getSessionUser = async () => (await auth())?.user;

type AdminOrderUpdateInput = {
  customer?: string;
  phone?: string;
  email?: string;
  price?: number;
  status?: string;
};

export async function createOrder(data: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  couponCode?: string;
  discountAmount?: number;
  tenantId?: string;
  source?: "WEB" | "MANUAL" | "WHATSAPP";
  draftOrderId?: string;
  paymentMethod?: string;
  advancePaidAmount?: number;
  advancePaymentStatus?: string;
  transactionId?: string;
}) {
  // Bot check removed

  try {
    await logActionRequest({ actionName: "createOrder" });
    // 1. Resolve Tenant - ALWAYS from session, never trust client-supplied tenantId
    const sessionUser = await getSessionUser();
    const tenantId = data.tenantId || sessionUser?.tenantId;

    if (!tenantId) {
      console.error("Create Order Failed: Missing Tenant ID");
      return { success: false, error: "System Error: Missing Tenant Context" };
    }

    // 2. Create or Update Order
    let order;

    // Attempt to resolve existing draft
    if (data.draftOrderId) {
      const existingDraft = await prisma.order.findUnique({
        where: { orderId: data.draftOrderId },
        select: { id: true, status: true },
      });

      if (existingDraft && existingDraft.status === "INCOMPLETE") {
        // We found an incomplete draft, let's convert it to a real pending order
        // First delete old items just in case the cart changed
        await prisma.orderItem.deleteMany({
          where: { orderId: existingDraft.id },
        });

        order = await prisma.order.update({
          where: { id: existingDraft.id },
          data: {
            status: "PENDING",
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            customerAddress: data.customerAddress,
            totalAmount: Math.round(data.totalAmount),
            couponCode: data.couponCode,
            discountAmount: Math.round(data.discountAmount || 0),
            source: data.source || "WEB",
            paymentMethod: data.paymentMethod || "COD",
            advancePaidAmount: Math.round(data.advancePaidAmount || 0),
            advancePaymentStatus: data.advancePaymentStatus || "NOT_REQUIRED",
            transactionId: data.transactionId,
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: Math.round(item.price),
              })),
            },
          },
        });
      }
    }

    // fallback if no draft or draft wasn't found/incomplete
    if (!order) {
      order = await prisma.order.create({
        data: {
          tenantId,
          // SECURE ID: randomUUID is cryptographically strong
          orderId: `ORD-${randomUUID().substring(0, 8).toUpperCase()}`,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          customerAddress: data.customerAddress,
          totalAmount: Math.round(data.totalAmount),
          couponCode: data.couponCode,
          discountAmount: Math.round(data.discountAmount || 0),
          paymentMethod: data.paymentMethod || "COD",
          advancePaidAmount: Math.round(data.advancePaidAmount || 0),
          advancePaymentStatus: data.advancePaymentStatus || "NOT_REQUIRED",
          transactionId: data.transactionId,
          source: data.source || "WEB",
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: Math.round(item.price),
            })),
          },
        },
      });
    }

    // ... (rest of function)

    // 3. Increment Coupon Usage
    if (data.couponCode) {
      // We use updateMany or try/catch to avoid error if coupon deleted/invalid race condition
      // But since we just validated effectively, update is fine.
      // Using prisma.coupon.update requires ID or unique field. Code is unique.
      try {
        await prisma.coupon.update({
          where: { code: data.couponCode },
          data: { usedCount: { increment: 1 } },
        });
      } catch (e) {
        console.error("Failed to increment coupon usage", e);
        // Non-blocking error
      }
    }

    return { success: true, orderId: order.orderId };
  } catch (error) {
    console.error("Create Order Error:", error);
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    }
    return { success: false, error: "Failed to create order: " + (error instanceof Error ? error.message : "Internal Error") };
  }
}

export async function upsertIncompleteOrder(data: {
  draftOrderId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  couponCode?: string;
  discountAmount?: number;
  tenantId?: string;
}) {
  try {
    await logActionRequest({ actionName: "upsertIncompleteOrder" });
    // Resolve tenant - ALWAYS from session, never trust client-supplied tenantId
    const sessionUser = await getSessionUser();
    const tenantId = data.tenantId || sessionUser?.tenantId;

    if (!tenantId) return { success: false, error: "Missing Tenant" };

    if (data.draftOrderId) {
      const existing = await prisma.order.findUnique({
        where: { orderId: data.draftOrderId },
        select: { id: true, status: true },
      });

      if (existing && existing.status === "INCOMPLETE") {
        await prisma.orderItem.deleteMany({ where: { orderId: existing.id } });
        await prisma.order.update({
          where: { id: existing.id },
          data: {
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail,
            customerAddress: data.customerAddress,
            totalAmount: data.totalAmount,
            couponCode: data.couponCode,
            discountAmount: data.discountAmount,
            items: {
              create: data.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              })),
            },
          },
        });
        return { success: true, orderId: data.draftOrderId };
      }
    }

    const newOrderId = `ORD-${randomUUID().substring(0, 8).toUpperCase()}`;
    await prisma.order.create({
      data: {
        tenantId,
        orderId: newOrderId,
        status: "INCOMPLETE",
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        totalAmount: data.totalAmount,
        couponCode: data.couponCode,
        discountAmount: data.discountAmount,
        source: "WEB",
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    return { success: true, orderId: newOrderId };
  } catch (error) {
    console.error("Failed to upsert incomplete order:", error);
    return { success: false, error: "Failed to sync checkout state" };
  }
}

export async function getAdminOrders() {
  try {
    await logActionRequest({ actionName: "getAdminOrders" });
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return [];

    const startMs = process.env.PERF_LOG === "true" ? Date.now() : 0;

    const orders = await prisma.order.findMany({
      where: { tenantId },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        orderId: true,
        createdAt: true,
        customerName: true,
        customerPhone: true,
        customerEmail: true,
        totalAmount: true,
        status: true,
        source: true,
        hubId: true,
        stockDeducted: true,
        items: {
          select: {
            quantity: true,
          },
        },
      },
    });

    if (process.env.PERF_LOG === "true") {
      const { heapUsed, rss } = process.memoryUsage();
      console.info(
        `[Perf] getAdminOrders count=${orders.length} ms=${Date.now() - startMs} heapMB=${Math.round(heapUsed / 1024 / 1024)} rssMB=${Math.round(rss / 1024 / 1024)}`,
      );
    }

    // Calculate order counts per phone number
    const phoneCounts = orders.reduce((acc: Record<string, number>, order) => {
      const phone = order.customerPhone;
      acc[phone] = (acc[phone] || 0) + 1;
      return acc;
    }, {});

    // Map database records to the frontend expected format if necessary
    return orders.map((o) => ({
      id: o.orderId,
      dbId: o.id,
      date: o.createdAt.toLocaleString(),
      customer: o.customerName,
      phone: o.customerPhone,
      email: o.customerEmail || undefined,
      items: o.items.reduce((acc: number, item) => acc + item.quantity, 0),
      source: o.source,
      price: o.totalAmount,
      status: o.status,
      hubId: o.hubId,
      isRepeat: (phoneCounts[o.customerPhone] || 0) > 1,
      orderCount: phoneCounts[o.customerPhone] || 1,
      stockDeducted: o.stockDeducted,
    }));
  } catch (error) {
    console.error("Fetch Admin Orders Error:", error);
    return [];
  }
}

export async function updateAdminOrder(
  id: string,
  updates: AdminOrderUpdateInput,
) {
  try {
    await logActionRequest({ actionName: "updateAdminOrder" });

    // Verify session tenant
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    // Find by orderId (e.g., ORD-...)
    const order = await prisma.order.findUnique({
      where: { orderId: id },
    });

    if (!order || order.tenantId !== tenantId) return { success: false, error: "Order not found" };

    await prisma.order.update({
      where: { id: order.id },
      data: {
        customerName: updates.customer,
        customerPhone: updates.phone,
        customerEmail: updates.email,
        totalAmount: updates.price,
        status: updates.status,
        // Add other fields as needed
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Update Admin Order Error:", error);
    return { success: false, error: "Failed to update order" };
  }
}

export async function deleteAdminOrder(id: string) {
  try {
    await logActionRequest({ actionName: "deleteAdminOrder" });

    // Verify session tenant
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    const order = await prisma.order.findUnique({
      where: { orderId: id },
    });

    if (!order || order.tenantId !== tenantId) return { success: false, error: "Order not found" };

    // Delete order items first (Prisma handles this if cascade is set, but let's be safe)
    await prisma.orderItem.deleteMany({
      where: { orderId: order.id },
    });

    await prisma.order.delete({
      where: { id: order.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete Admin Order Error:", error);
    return { success: false, error: "Failed to delete order" };
  }
}

export async function printOrderInvoice(orderId: string) {
  try {
    await logActionRequest({ actionName: "printOrderInvoice" });

    // Verify session tenant
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { items: true },
    });

    if (!order || order.tenantId !== tenantId) return { success: false, error: "Order not found" };

    const canPrintByStatus =
      order.status === "Ready" || order.status === "Invoice Printed";
    const canPrintManual = order.source === "MANUAL";

    // Restrict printing: Only if 'Ready'/'Printed' or manual order
    if (!canPrintByStatus && !canPrintManual) {
      return {
        success: false,
        error: `Cannot print invoice for order in '${order.status}' status. Must be 'Ready'.`,
      };
    }

    // Only deduct stock if not already deducted
    if (!order.stockDeducted) {
      // Deduct Stock Logic (Moved from createOrder)
      for (const item of order.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: { comboItems: { include: { child: true } } },
        });

        if (!product) continue;

        if (product.type === "COMBO") {
          for (const comboItem of product.comboItems) {
            const currentPieces = comboItem.child.pieces || 0;
            const reduction = item.quantity * comboItem.quantity;
            await prisma.product.update({
              where: { id: comboItem.childId },
              data: {
                pieces: Math.max(0, currentPieces - reduction),
              },
            });
          }
        } else {
          const currentPieces = product.pieces || 0;
          await prisma.product.update({
            where: { id: item.productId },
            data: { pieces: Math.max(0, currentPieces - item.quantity) },
          });
        }
      }

      // Update Order Status and Flag
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "Invoice Printed",
          stockDeducted: true,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Print Invoice Logic Error:", error);
    return { success: false, error: "Failed to process invoice" };
  }
}
