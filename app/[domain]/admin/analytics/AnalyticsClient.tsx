"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  XCircle,
  Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

const AnalyticsCharts = dynamic(
  () => import("@/components/admin/analytics/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => (
      <Card className="border-gray-100 shadow-sm col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Revenue Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse rounded-lg bg-slate-100" />
        </CardContent>
      </Card>
    ),
  },
);

export default function AnalyticsClient({
  metrics,
}: {
  readonly metrics: any;
}) {
  const handleExport = (days: number) => {
    toast.info(
      `CSV Export for ${days} days is currently being migrated to background jobs.`,
    );
  };

  if (!metrics) {
    return (
      <div className="p-8 text-center text-slate-500">
        Failed to load metrics.
      </div>
    );
  }

  const {
    totalRevenue,
    uniqueCustomers,
    avgOrderValue,
    cancellationRate,
    cancelledOrders,
    sourceData,
    trendData = [],
  } = metrics;

  if (trendData.length === 0) trendData.push({ name: "No Data", sales: 0 });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            📊 Analytics Reports
          </h1>
          <p className="text-sm text-slate-500">
            Real-time business performance based on your orders.
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-sm gap-2">
                <Download className="w-4 h-4" /> Export Excel
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Duration</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport(7)}>
                Last 7 Days (Max 1000 orders)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(15)}>
                Last 15 Days (Max 1000 orders)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(30)}>
                Last 30 Days (Max 1000 orders)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-md border border-gray-200 flex items-center">
            Live Data
          </div>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`৳ ${totalRevenue.toLocaleString()}`}
          icon={TrendingUp}
          sub="All time"
          color="text-green-600"
        />
        <MetricCard
          title="Unique Customers"
          value={uniqueCustomers}
          icon={Users}
          sub="Based on phone #"
          color="text-blue-600"
        />
        <MetricCard
          title="Avg. Order Value"
          value={`৳ ${avgOrderValue}`}
          icon={ShoppingCart}
          sub="All time average"
          color="text-orange-600"
        />
        <MetricCard
          title="Cancellation Rate"
          value={`${cancellationRate}%`}
          icon={XCircle}
          sub={`${cancelledOrders} cancelled`}
          color="text-red-500"
        />
      </div>

      <AnalyticsCharts trendData={trendData} sourceData={sourceData} />
    </div>
  );
}

interface MetricCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly icon: LucideIcon;
  readonly sub: string;
  readonly color: string;
  readonly bg?: string;
}

function MetricCard({
  title,
  value,
  icon: Icon,
  sub,
  color,
  bg,
}: MetricCardProps) {
  return (
    <Card
      className={`border-none shadow-sm ${bg || "bg-white border border-gray-100"}`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-500">{title}</span>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-400 mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}
