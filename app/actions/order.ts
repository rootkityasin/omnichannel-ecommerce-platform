"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { randomUUID } from "crypto";

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
}) {
  // Bot check removed

  try {
    // 1. Resolve Tenant
    let tenantId = data.tenantId;
    if (!tenantId) {
      const sessionUser = await getSessionUser();
      tenantId = sessionUser?.tenantId ?? undefined;
    }

    if (!tenantId) {
      console.error("Create Order Failed: Missing Tenant ID");
      return { success: false, error: "System Error: Missing Tenant Context" };
    }

    // 2. Create Order
    const order = await prisma.order.create({
      data: {
        tenantId,
        // SECURE ID: randomUUID is cryptographically strong
        orderId: `ORD-${randomUUID().substring(0, 8).toUpperCase()}`,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        totalAmount: data.totalAmount,
        couponCode: data.couponCode,
        discountAmount: data.discountAmount,
        source: data.source || "WEB",
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

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
    return { success: false, error: "Failed to create order" };
  }
}

export async function getAdminOrders() {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return [];

    const orders = await prisma.order.findMany({
      where: { tenantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

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
    // Find by orderId (e.g., ORD-...)
    const order = await prisma.order.findUnique({
      where: { orderId: id },
    });

    if (!order) throw new Error("Order not found");

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
    const order = await prisma.order.findUnique({
      where: { orderId: id },
    });

    if (!order) throw new Error("Order not found");

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
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { items: true },
    });

    if (!order) return { success: false, error: "Order not found" };

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
          include: { comboItems: true },
        });

        if (!product) continue;

        if (product.type === "COMBO") {
          for (const comboItem of product.comboItems) {
            await prisma.product.update({
              where: { id: comboItem.childId },
              data: {
                pieces: { decrement: item.quantity * comboItem.quantity },
              },
            });
          }
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: { pieces: { decrement: item.quantity } },
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
