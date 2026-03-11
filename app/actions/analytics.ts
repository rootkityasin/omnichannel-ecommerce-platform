"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getTenantByDomain } from "./tenant";

const getSessionUser = async () => (await auth())?.user;

async function resolveTenantId(domain?: string) {
  let tenantId: string | undefined;
  if (domain) {
    const tenant = await getTenantByDomain(domain);
    tenantId = tenant?.id;
  }
  if (!tenantId) {
    const sessionUser = await getSessionUser();
    tenantId = sessionUser?.tenantId || undefined;
  }
  return tenantId;
}

export async function getDashboardMetrics(domain?: string, hubId?: string) {
  try {
    const tenantId = await resolveTenantId(domain);
    if (!tenantId) return null;

    // Filters based on Role/Hub
    const baseWhere = {
      tenantId,
      ...(hubId && hubId !== "ALL" ? { hubId } : {}),
      status: { not: "Cancelled" }, // Excluding cancelled for pure sales
    };

    // 1. Total All-Time Revenue & Order Count
    const orderAggregations = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: baseWhere,
    });

    const totalRevenue = orderAggregations._sum.totalAmount || 0;
    const totalOrders = orderAggregations._count || 0;

    // 2. Pending Orders
    const pendingCount = await prisma.order.count({
      where: {
        ...baseWhere,
        status: { in: ["Placed", "Confirmed", "Cooking"] },
      },
    });

    // 3. Unique Customers (Approximate based on phone)
    // Prisma doesn't natively support count(distinct) directly in aggregate yet for all types easily,
    // but calculating unique phones by grouping is efficient.
    const uniquePhones = await prisma.order.groupBy({
      by: ["customerPhone"],
      where: { tenantId }, // Customers across all statuses
    });
    const uniqueCustomers = uniquePhones.length;

    // 4. Trend Data (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await prisma.order.findMany({
      where: {
        ...baseWhere,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const salesByDay: Record<string, number> = {};
    // Pre-fill last 7 days to ensure empty days show 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      salesByDay[label] = 0;
    }

    recentOrders.forEach((o) => {
      const day = o.createdAt.toLocaleDateString("en-US", { weekday: "short" });
      if (salesByDay[day] !== undefined) {
        salesByDay[day] += o.totalAmount;
      }
    });

    const trendData = Object.keys(salesByDay).map((name) => ({
      name,
      sales: salesByDay[name],
    }));

    const topRecentOrders = await prisma.order.findMany({
      where: baseWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        customerName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      }
    });

    return {
      totalRevenue,
      totalOrders,
      pendingOrders: pendingCount,
      uniqueCustomers,
      trendData,
      recentOrders: topRecentOrders,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard metrics:", error);
    return null;
  }
}

export async function getAnalyticsMetrics(domain?: string, hubId?: string) {
  try {
    const tenantId = await resolveTenantId(domain);
    if (!tenantId) return null;

    const baseWhere = {
      tenantId,
      ...(hubId && hubId !== "ALL" ? { hubId } : {}),
    };

    const validWhere = {
      ...baseWhere,
      status: { not: "Cancelled" },
    };

    // Aggregates
    const [allTimeSales, cancelledCount, sourceGroups] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: validWhere,
      }),
      prisma.order.count({
        where: { ...baseWhere, status: "Cancelled" },
      }),
      prisma.order.groupBy({
        by: ["source"],
        where: baseWhere,
        _count: true,
      }),
    ]);

    const totalRevenue = allTimeSales._sum.totalAmount || 0;
    const totalOrders = allTimeSales._count || 0;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    const totalWithCancelled = totalOrders + cancelledCount;
    const cancellationRate = totalWithCancelled > 0 
      ? ((cancelledCount / totalWithCancelled) * 100).toFixed(1) 
      : "0";

    const uniquePhones = await prisma.order.groupBy({
      by: ["customerPhone"],
      where: baseWhere,
    });

    // Formatting Source Data for Recharts Pie
    const sourceData = sourceGroups.map((g) => ({
      name: g.source,
      value: g._count,
    }));

    return {
      totalRevenue,
      uniqueCustomers: uniquePhones.length,
      avgOrderValue,
      cancellationRate,
      cancelledOrders: cancelledCount,
      sourceData,
    };
  } catch (error) {
    console.error("Failed to fetch analytics metrics:", error);
    return null;
  }
}
