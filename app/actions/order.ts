'use server';

import { prisma } from '@/lib/prisma';

export async function createOrder(data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: { productId: string; quantity: number; price: number }[];
    totalAmount: number;
    couponCode?: string;
    discountAmount?: number;
}) {
    // Bot check removed


    try {
        // 1. Create Order
        const order = await prisma.order.create({
            data: {
                orderId: `ORD-${Date.now()}`, // Simple ID generation
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                customerAddress: data.customerAddress,
                totalAmount: data.totalAmount,
                couponCode: data.couponCode,
                discountAmount: data.discountAmount,
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            }
        });



        // 3. Increment Coupon Usage
        if (data.couponCode) {
            // We use updateMany or try/catch to avoid error if coupon deleted/invalid race condition
            // But since we just validated effectively, update is fine.
            // Using prisma.coupon.update requires ID or unique field. Code is unique.
            try {
                await prisma.coupon.update({
                    where: { code: data.couponCode },
                    data: { usedCount: { increment: 1 } }
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
        const orders = await prisma.order.findMany({
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate order counts per phone number
        const phoneCounts = orders.reduce((acc: Record<string, number>, order) => {
            const phone = order.customerPhone;
            acc[phone] = (acc[phone] || 0) + 1;
            return acc;
        }, {});

        // Map database records to the frontend expected format if necessary
        return orders.map((o: any) => ({
            id: o.orderId,
            dbId: o.id,
            date: o.createdAt.toLocaleString(),
            customer: o.customerName,
            phone: o.customerPhone,
            items: o.items.reduce((acc: number, item: any) => acc + item.quantity, 0),
            source: o.source,
            price: o.totalAmount,
            status: o.status,
            hubId: o.hubId,
            isRepeat: (phoneCounts[o.customerPhone] || 0) > 1,
            orderCount: phoneCounts[o.customerPhone] || 1,
            stockDeducted: o.stockDeducted
        }));
    } catch (error) {
        console.error("Fetch Admin Orders Error:", error);
        return [];
    }
}

export async function updateAdminOrder(id: string, updates: any) {
    try {
        // Find by orderId (e.g., ORD-...)
        const order = await prisma.order.findUnique({
            where: { orderId: id }
        });

        if (!order) throw new Error("Order not found");

        await prisma.order.update({
            where: { id: order.id },
            data: {
                customerName: updates.customer,
                customerPhone: updates.phone,
                totalAmount: updates.price,
                status: updates.status,
                // Add other fields as needed
            }
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
            where: { orderId: id }
        });

        if (!order) throw new Error("Order not found");

        // Delete order items first (Prisma handles this if cascade is set, but let's be safe)
        await prisma.orderItem.deleteMany({
            where: { orderId: order.id }
        });

        await prisma.order.delete({
            where: { id: order.id }
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
            include: { items: true }
        });

        if (!order) return { success: false, error: "Order not found" };

        // Only deduct stock if not already deducted
        if (!order.stockDeducted) {
            // Deduct Stock Logic (Moved from createOrder)
            for (const item of order.items) {
                const product = await prisma.product.findUnique({
                    where: { id: item.productId },
                    include: { comboItems: true }
                });

                if (!product) continue;

                if (product.type === 'COMBO') {
                    for (const comboItem of product.comboItems) {
                        await prisma.product.update({
                            where: { id: comboItem.childId },
                            data: { pieces: { decrement: item.quantity * comboItem.quantity } }
                        });
                    }
                } else {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { pieces: { decrement: item.quantity } }
                    });
                }
            }

            // Update Order Status and Flag
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'Invoice Printed',
                    stockDeducted: true
                }
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Print Invoice Logic Error:", error);
        return { success: false, error: "Failed to process invoice" };
    }
}
