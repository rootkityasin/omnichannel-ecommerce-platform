"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, CreditCard, Users, ArrowUpRight } from "lucide-react";

const DashboardCharts = dynamic(
  () => import("@/components/admin/dashboard/DashboardCharts"),
  {
    ssr: false,
    loading: () => (
      <Card className="lg:col-span-2 border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Sales Report (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" />
        </CardContent>
      </Card>
    ),
  },
);

export default function DashboardClient({
  metrics,
}: {
  readonly metrics: any;
}) {
  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-500">
        Failed to load metrics.
      </div>
    );
  }

  const {
    totalRevenue,
    totalOrders,
    pendingOrders,
    uniqueCustomers,
    trendData,
    recentOrders,
  } = metrics;
  const salesValues = trendData.map((d: any) => d.sales);
  const todaySales = salesValues[6] || 0;
  const yesterdaySales = salesValues[5] || 0;
  const trendPercent =
    yesterdaySales > 0
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner (Welcome) */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Welcome back, Chef! 👨‍🍳</h1>
        <p className="text-orange-100 opacity-90">
          Here is what is happening in your kitchen today.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="All Time Revenue"
          value={`৳ ${totalRevenue.toLocaleString()}`}
          icon={CreditCard}
          trend={
            trendPercent > 0
              ? `+${trendPercent.toFixed(1)}% vs yesterday`
              : `${trendPercent.toFixed(1)}% vs yesterday`
          }
          trendColor={trendPercent >= 0 ? "text-green-500" : "text-red-500"}
        />
        <MetricCard
          title="Total Orders"
          value={totalOrders.toLocaleString()}
          icon={ShoppingBag}
          trend={`${pendingOrders} Pending`}
          trendColor="text-orange-500"
        />
        <MetricCard
          title="Unique Customers"
          value={uniqueCustomers.toLocaleString()}
          icon={Users}
          trend="All Time"
          trendColor="text-blue-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DashboardCharts trendData={trendData} />

        {/* Side Stats */}
        <Card className="border-gray-100 shadow-sm flex flex-col justify-start bg-slate-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
              <span className="text-xl">🏆</span> Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-xs"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-600">
                        ৳{order.totalAmount}
                      </p>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-slate-500 mt-4">
                  Waiting for incoming orders
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon: React.ElementType;
  readonly trend: string;
  readonly trendColor: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendColor,
}: MetricCardProps) {
  return (
    <Card className="border-gray-100 shadow-sm">
      <CardContent className="p-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <div className="text-2xl font-bold text-slate-800 mt-2">{value}</div>
          <div
            className={`text-xs font-semibold mt-1 ${trendColor} flex items-center gap-1`}
          >
            {trend}
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-slate-600">
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}
