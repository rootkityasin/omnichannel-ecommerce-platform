"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getTenantByDomain } from "./tenant";
import { unstable_cache } from "next/cache";

const getSessionUser = async () => (await auth())?.user;
const DHAKA_TIME_ZONE = "Asia/Dhaka";
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const SALE_STATUS = "Payment Received";
const NON_DRAFT_STATUSES = ["Incomplete", "INCOMPLETE"];
const SALES_TREND_STATUSES = [
  "Placed",
  "Confirmed",
  "Ready",
  "Invoice Printed",
  "Delivered",
  "Payment OnProcess",
  "Payment Received",
] as const;
const PENDING_ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Ready",
  "Invoice Printed",
  "Delivered",
  "Payment OnProcess",
];

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

function getDhakaDayStart(daysAgo = 0) {
  const now = new Date();
  const dhakaNow = new Date(now.getTime() + DHAKA_OFFSET_MS);

  return new Date(
    Date.UTC(
      dhakaNow.getUTCFullYear(),
      dhakaNow.getUTCMonth(),
      dhakaNow.getUTCDate() - daysAgo,
      0,
      0,
      0,
      0,
    ) - DHAKA_OFFSET_MS,
  );
}

function formatDhakaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDhakaWeekday(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIME_ZONE,
    weekday: "short",
  }).format(date);
}

function getRecentDaysSales(
  orders: Array<{ createdAt: Date; totalAmount: number }>,
) {
  const salesByDay = new Map<string, { name: string; sales: number }>();
  for (let i = 6; i >= 0; i--) {
    const day = getDhakaDayStart(i);
    salesByDay.set(formatDhakaDateKey(day), {
      name: formatDhakaWeekday(day),
      sales: 0,
    });
  }

  orders.forEach((o) => {
    const key = formatDhakaDateKey(o.createdAt);
    const entry = salesByDay.get(key);
    if (entry) {
      entry.sales += o.totalAmount;
    }
  });

  return Array.from(salesByDay.values());
}

async function getRecentDaysSalesFromDb(tenantId: string, hubId?: string) {
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      ...(hubId && hubId !== "ALL" ? { hubId } : {}),
      status: { in: [...SALES_TREND_STATUSES] },
      createdAt: { gte: getDhakaDayStart(6) },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
  });

  return getRecentDaysSales(orders);
}

const getCachedDashboardMetrics = unstable_cache(
  async (tenantId: string, hubId?: string) => {
    const saleWhere = {
      tenantId,
      ...(hubId && hubId !== "ALL" ? { hubId } : {}),
      status: SALE_STATUS,
    };
    const allOrdersWhere = {
      tenantId,
      ...(hubId && hubId !== "ALL" ? { hubId } : {}),
      status: { notIn: NON_DRAFT_STATUSES },
    };

    const distinctCustomerQuery =
      hubId && hubId !== "ALL"
        ? 'SELECT COUNT(DISTINCT "customerPhone")::bigint AS count FROM "Order" WHERE "tenantId" = $1 AND "hubId" = $2'
        : 'SELECT COUNT(DISTINCT "customerPhone")::bigint AS count FROM "Order" WHERE "tenantId" = $1';

    const [
      orderAggregations,
      totalOrderCount,
      pendingCount,
      uniqueCustomerCount,
      trendData,
      topRecentOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: saleWhere,
      }),
      prisma.order.count({
        where: allOrdersWhere,
      }),
      prisma.order.count({
        where: {
          tenantId,
          ...(hubId && hubId !== "ALL" ? { hubId } : {}),
          status: { in: PENDING_ORDER_STATUSES },
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
      getRecentDaysSalesFromDb(tenantId, hubId),
      prisma.order.findMany({
        where: allOrdersWhere,
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
      totalOrders: totalOrderCount || 0,
      pendingOrders: pendingCount,
      uniqueCustomers: Number(uniqueCustomerCount[0]?.count || 0),
      trendData,
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
      status: SALE_STATUS,
    };
    const allOrdersWhere = {
      ...baseWhere,
      status: { notIn: NON_DRAFT_STATUSES },
    };

    const distinctCustomerQuery =
      hubId && hubId !== "ALL"
        ? 'SELECT COUNT(DISTINCT "customerPhone")::bigint AS count FROM "Order" WHERE "tenantId" = $1 AND "hubId" = $2'
        : 'SELECT COUNT(DISTINCT "customerPhone")::bigint AS count FROM "Order" WHERE "tenantId" = $1';

    const [
      allTimeSales,
      cancelledCount,
      sourceGroups,
      uniqueCustomerCount,
      trendData,
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
        where: allOrdersWhere,
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
      getRecentDaysSalesFromDb(tenantId, hubId),
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
      trendData,
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
