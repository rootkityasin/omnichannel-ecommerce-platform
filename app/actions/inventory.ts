"use server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";

const getSessionUser = async () => (await auth())?.user;

const getCachedExpensesByTenant = unstable_cache(
  async (tenantId: string) => {
    return prisma.expense.findMany({
      where: { hub: { tenantId } },
      orderBy: { date: "desc" },
      include: { hub: true },
    });
  },
  ["inventory-expenses"],
  { tags: ["inventory-expenses"], revalidate: 60 },
);

const getCachedInventoryStats = unstable_cache(
  async (tenantId: string) => {
    const products = await prisma.product.findMany({
      where: { tenantId },
      select: {
        price: true,
        pieces: true,
        inventory: {
          select: {
            quantity: true,
          },
        },
      },
    });

    let totalStockValue = 0;
    products.forEach((p) => {
      const inventoryCount = p.inventory.reduce(
        (acc: number, inv) => acc + inv.quantity,
        0,
      );
      const stock = inventoryCount > 0 ? inventoryCount : p.pieces || 0;
      totalStockValue += Math.max(0, stock) * p.price;
    });

    const [salesAggregation, expenseAggregation] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { tenantId, status: "DELIVERED" },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { hub: { tenantId } },
      }),
    ]);

    const totalSales = salesAggregation._sum.totalAmount || 0;
    const totalExpenses = Math.abs(expenseAggregation._sum.amount || 0);

    return {
      stockValue: totalStockValue,
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
    };
  },
  ["inventory-stats"],
  { tags: ["inventory-stats"], revalidate: 60 },
);

// --- Expenses ---
export async function addExpense(data: {
  title: string;
  amount: number;
  category: string;
  description?: string;
  hubId?: string;
}) {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    if (data.hubId) {
      const hub = await prisma.hub.findFirst({
        where: { id: data.hubId, tenantId },
        select: { id: true },
      });
      if (!hub) return { success: false, error: "Invalid hub" };
    }

    await prisma.expense.create({
      data: {
        title: data.title,
        amount: Math.abs(data.amount), // Force positive amount
        category: data.category,
        description: data.description,
        hubId: data.hubId,
      },
    });
    revalidatePath("/admin/inventory");
    updateTag("inventory-expenses");
    updateTag("inventory-stats");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to add expense" };
  }
}

export async function getExpenses() {
  const sessionUser = await getSessionUser();
  const tenantId = sessionUser?.tenantId;
  if (!tenantId) return [];

  const expenses = await getCachedExpensesByTenant(tenantId);
  return expenses.map((e) => ({ ...e, hub: e.hub || undefined }));
}

export async function deleteExpense(id: string) {
  try {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return { success: false, error: "Unauthorized" };

    const expense = await prisma.expense.findFirst({
      where: { id, hub: { tenantId } },
      select: { id: true },
    });
    if (!expense) return { success: false, error: "Expense not found" };

    await prisma.expense.delete({ where: { id } });
    revalidatePath("/admin/inventory");
    updateTag("inventory-expenses");
    updateTag("inventory-stats");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete" };
  }
}

// --- Inventory Stats ---
export async function getInventoryStats() {
  const sessionUser = await getSessionUser();
  const tenantId = sessionUser?.tenantId;
  if (!tenantId) {
    return {
      stockValue: 0,
      totalSales: 0,
      totalExpenses: 0,
      netProfit: 0,
    };
  }

  return getCachedInventoryStats(tenantId);
}

// --- Stock Management ---
export async function getProductsForStock() {
  const sessionUser = await getSessionUser();
  const tenantId = sessionUser?.tenantId;

  if (!tenantId) return [];

  const products = await prisma.product.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      image: true,
      sku: true,
      pieces: true,
      price: true,
      type: true,
      weight: true,
      comboItems: {
        include: { child: { select: { pieces: true } } },
      },
      category: { select: { name: true } },
      isAvailable: true,
    },
    orderBy: { name: "asc" },
  });
  return products.map((p) => ({
    ...p,
    stock: p.isAvailable,
    image: p.image || undefined,
    // Ensure strictly typed fields for StockProduct are present
    pieces: p.pieces ?? 0,
    weight: p.weight ?? 0,
    type: (p.type as "SINGLE" | "COMBO") || "SINGLE",
  }));
}

export async function updateStock(productId: string, quantity: number) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { pieces: Math.max(0, quantity) },
    });
    revalidatePath("/admin/inventory");
    updateTag("inventory-stats");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to update stock" };
  }
}

export async function adjustStock(productId: string, delta: number) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { pieces: true },
    });

    if (!product) return { success: false, error: "Product not found" };

    await prisma.product.update({
      where: { id: productId },
      data: { pieces: Math.max(0, (product.pieces || 0) + delta) },
    });
    revalidatePath("/admin/inventory");
    updateTag("inventory-stats");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to adjust stock" };
  }
}
