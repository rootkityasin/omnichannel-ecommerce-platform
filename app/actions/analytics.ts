"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getTenantByDomain } from "./tenant";
import { unstable_cache } from "next/cache";

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

function getRecentDaysSales(
  orders: Array<{ createdAt: Date; totalAmount: number }>,
) {
  const salesByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    salesByDay[label] = 0;
  }

  orders.forEach((o) => {
    const day = o.createdAt.toLocaleDateString("en-US", { weekday: "short" });
    if (salesByDay[day] !== undefined) {
      salesByDay[day] += o.totalAmount;
    }
  });

  return Object.keys(salesByDay).map((name) => ({
    name,
    sales: salesByDay[name],
  }));
}

const getCachedDashboardMetrics = unstable_cache(
  async (tenantId: string, hubId?: string) => {
    const baseWhere = {
      tenantId,
      ...(hubId && hubId !== "ALL" ? { hubId } : {}),
      status: { not: "Cancelled" as const },
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const distinctCustomerQuery =
      hubId && hubId !== "ALL"
        ? 'SELECT COUNT(DISTINCT "customerPhone")::bigint AS count FROM "Order" WHERE "tenantId" = $1 AND "hubId" = $2'
        : 'SELECT COUNT(DISTINCT "customerPhone")::bigint AS count FROM "Order" WHERE "tenantId" = $1';

    const [
      orderAggregations,
      pendingCount,
      uniqueCustomerCount,
      recentOrders,
      topRecentOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: baseWhere,
      }),
      prisma.order.count({
        where: {
          tenantId,
          ...(hubId && hubId !== "ALL" ? { hubId } : {}),
          status: { in: ["Placed", "Confirmed", "Cooking"] },
        },
      }),
      hubId && hubId !== "ALL"
        ? prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
            distinctCustomerQuery,
            tenantId,
            hubId,
          )
        : prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
            distinctCustomerQuery,
            tenantId,
          ),
      prisma.order.findMany({
        where: {
          ...baseWhere,
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.findMany({
        where: baseWhere,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          customerName: true,
          totalAmount: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      totalRevenue: orderAggregations._sum.totalAmount || 0,
      totalOrders: orderAggregations._count || 0,
      pendingOrders: pendingCount,
      uniqueCustomers: Number(uniqueCustomerCount[0]?.count || 0),
      trendData: getRecentDaysSales(recentOrders),
      recentOrders: topRecentOrders,
    };
  },
  ["dashboard-metrics"],
  { tags: ["dashboard-metrics"], revalidate: 60 },
);

const getCachedAnalyticsMetrics = unstable_cache(
  async (tenantId: string, hubId?: string) => {
    const baseWhere = {
      tenantId,
      ...(hubId && hubId !== "ALL" ? { hubId } : {}),
    };
    const validWhere = {
      ...baseWhere,
      status: { not: "Cancelled" as const },
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const distinctCustomerQuery =
      hubId && hubId !== "ALL"
        ? 'SELECT COUNT(DISTINCT "customerPhone")::bigint AS count FROM "Order" WHERE "tenantId" = $1 AND "hubId" = $2'
        : 'SELECT COUNT(DISTINCT "customerPhone")::bigint AS count FROM "Order" WHERE "tenantId" = $1';

    const [
      allTimeSales,
      cancelledCount,
      sourceGroups,
      uniqueCustomerCount,
      recentOrders,
    ] = await Promise.all([
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
      hubId && hubId !== "ALL"
        ? prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
            distinctCustomerQuery,
            tenantId,
            hubId,
          )
        : prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
            distinctCustomerQuery,
            tenantId,
          ),
      prisma.order.findMany({
        where: {
          ...validWhere,
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const totalRevenue = allTimeSales._sum.totalAmount || 0;
    const totalOrders = allTimeSales._count || 0;
    const avgOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const totalWithCancelled = totalOrders + cancelledCount;

    return {
      totalRevenue,
      uniqueCustomers: Number(uniqueCustomerCount[0]?.count || 0),
      avgOrderValue,
      cancellationRate:
        totalWithCancelled > 0
          ? ((cancelledCount / totalWithCancelled) * 100).toFixed(1)
          : "0",
      cancelledOrders: cancelledCount,
      sourceData: sourceGroups.map((g) => ({
        name: g.source,
        value: g._count,
      })),
      trendData: getRecentDaysSales(recentOrders),
    };
  },
  ["analytics-metrics"],
  { tags: ["analytics-metrics"], revalidate: 60 },
);

export async function getDashboardMetrics(domain?: string, hubId?: string) {
  try {
    const tenantId = await resolveTenantId(domain);
    if (!tenantId) return null;
    return getCachedDashboardMetrics(tenantId, hubId);
  } catch (error) {
    console.error("Failed to fetch dashboard metrics:", error);
    return null;
  }
}

export async function getAnalyticsMetrics(domain?: string, hubId?: string) {
  try {
    const tenantId = await resolveTenantId(domain);
    if (!tenantId) return null;
    return getCachedAnalyticsMetrics(tenantId, hubId);
  } catch (error) {
    console.error("Failed to fetch analytics metrics:", error);
    return null;
  }
}
