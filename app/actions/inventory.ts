"use server";

import { auth } from "@/auth";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const getSessionUser = async () => (await auth())?.user;

// --- Expenses ---
export async function addExpense(data: {
  title: string;
  amount: number;
  category: string;
  description?: string;
  hubId?: string;
}) {
  try {
    await prisma.expense.create({
      data: {
        title: data.title,
        amount: data.amount,
        category: data.category,
        description: data.description,
        hubId: data.hubId,
      },
    });
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to add expense" };
  }
}

export async function getExpenses() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: { hub: true },
  });
  return expenses.map((e) => ({ ...e, hub: e.hub || undefined }));
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete" };
  }
}

// --- Inventory Stats ---
export async function getInventoryStats() {
  // 1. Total Stock Value (Assumes quantity in Product or Inventory)
  // For now, looking at Product.pieces as simple stock representation + Inventory model
  // This is complex so we will start simple:

  // Get all products to calculate potential stock value
  const products = await prisma.product.findMany({
    include: { inventory: true },
  });

  let totalStockValue = 0;
  products.forEach((p) => {
    // Sum up inventory from hubs + base pieces if modeled that way
    const inventoryCount = p.inventory.reduce(
      (acc: number, inv) => acc + inv.quantity,
      0,
    );
    const stock = inventoryCount > 0 ? inventoryCount : p.pieces || 0;
    // FORCE ACCURACY: Stock cannot be negative for value calculations
    totalStockValue += Math.max(0, stock) * p.price;
  });

  // 2. Total Sales (Completed Orders)
  const paidOrders = await prisma.order.findMany({
    where: { status: "DELIVERED" }, // or statuses that imply payment
  });
  const totalSales = paidOrders.reduce(
    (acc: number, order) => acc + order.totalAmount,
    0,
  );

  // 3. Total Expenses
  const allExpenses = await prisma.expense.findMany();
  const totalExpenses = allExpenses.reduce(
    (acc: number, e) => acc + e.amount,
    0,
  );

  return {
    stockValue: totalStockValue,
    totalSales,
    totalExpenses,
    netProfit: totalSales - totalExpenses, // Simplified
  };
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
    return { success: true };
  } catch {
    return { success: false, error: "Failed to adjust stock" };
  }
}
