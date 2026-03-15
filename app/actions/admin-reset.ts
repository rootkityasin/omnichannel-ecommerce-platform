"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function resetDatabaseAction() {
  try {
    const sessionUser = (await auth())?.user;
    const tenantId = sessionUser?.tenantId;

    // 1. Security Check: Must be tenant admin
    if (
      !sessionUser?.id ||
      !tenantId ||
      sessionUser.role !== Role.TENANT_ADMIN
    ) {
      return {
        success: false,
        message: "Unauthorized: Only tenant admins can reset this database.",
      };
    }

    const currentUserId = sessionUser.id;
    console.log(
      `⚠️  Tenant Reset Initiated by User: ${currentUserId} (${sessionUser.email}) for tenant ${tenantId}`,
    );

    const [tenantProducts, tenantOrders, tenantHubs, tenantUsers] =
      await Promise.all([
        prisma.product.findMany({ where: { tenantId }, select: { id: true } }),
        prisma.order.findMany({ where: { tenantId }, select: { id: true } }),
        prisma.hub.findMany({ where: { tenantId }, select: { id: true } }),
        prisma.user.findMany({
          where: { tenantId, id: { not: currentUserId } },
          select: { id: true },
        }),
      ]);

    const productIds = tenantProducts.map((product) => product.id);
    const orderIds = tenantOrders.map((order) => order.id);
    const hubIds = tenantHubs.map((hub) => hub.id);
    const userIds = tenantUsers.map((user) => user.id);

    // 2. Delete tenant-scoped business data in FK-safe order
    await prisma.$transaction(async (tx) => {
      if (productIds.length > 0 || userIds.length > 0) {
        await tx.review.deleteMany({
          where: {
            OR: [
              ...(productIds.length > 0
                ? [{ productId: { in: productIds } }]
                : []),
              ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
            ],
          },
        });
      }

      if (orderIds.length > 0) {
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
      }

      if (productIds.length > 0 || hubIds.length > 0) {
        await tx.inventory.deleteMany({
          where: {
            OR: [
              ...(productIds.length > 0
                ? [{ productId: { in: productIds } }]
                : []),
              ...(hubIds.length > 0 ? [{ hubId: { in: hubIds } }] : []),
            ],
          },
        });
      }

      if (productIds.length > 0) {
        await tx.modifier.deleteMany({
          where: { productId: { in: productIds } },
        });
        await tx.comboItem.deleteMany({
          where: {
            OR: [
              { parentId: { in: productIds } },
              { childId: { in: productIds } },
            ],
          },
        });
      }

      if (userIds.length > 0) {
        await tx.account.deleteMany({ where: { userId: { in: userIds } } });
        await tx.session.deleteMany({ where: { userId: { in: userIds } } });
      }

      await tx.user.update({
        where: { id: currentUserId },
        data: { hubId: null },
      });

      await tx.order.deleteMany({ where: { tenantId } });
      await tx.product.deleteMany({ where: { tenantId } });
      await tx.category.deleteMany({ where: { tenantId } });
      await tx.coupon.deleteMany({ where: { tenantId } });
      await tx.promoCard.deleteMany({ where: { tenantId } });

      if (hubIds.length > 0) {
        await tx.expense.deleteMany({ where: { hubId: { in: hubIds } } });
        await tx.freezer.deleteMany({ where: { hubId: { in: hubIds } } });
      }

      await tx.auditLog.deleteMany({ where: { tenantId } });
      await tx.hub.deleteMany({ where: { tenantId } });

      if (userIds.length > 0) {
        await tx.user.deleteMany({ where: { id: { in: userIds } } });
      }
    });

    console.log(`✅ Tenant reset complete for ${tenantId} (Admin preserved).`);

    revalidatePath("/");
    revalidatePath("/menu");
    revalidatePath("/admin/security");
    revalidatePath("/admin/products");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/customers");
    revalidatePath("/admin/categories");
    return {
      success: true,
      message:
        "Tenant data reset successfully. Your admin account was preserved.",
    };
  } catch (error) {
    console.error("❌ Database Reset Failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message: `Reset failed: ${message}` };
  }
}
