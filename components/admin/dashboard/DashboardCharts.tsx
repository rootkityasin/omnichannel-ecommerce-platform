"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight } from "lucide-react";

const getChartUpperBound = (dataMax: number) => {
  if (dataMax <= 0) return 5000;
  return Math.max(Math.ceil(dataMax * 1.2), dataMax + 100);
};

export default function DashboardCharts({
  trendData,
}: {
  readonly trendData: Array<{ name: string; sales: number }>;
}) {
  const salesValues = trendData.map((d) => d.sales);
  const maxSales = Math.max(...salesValues, 0);
  const minSales = Math.min(...salesValues.filter((v) => v > 0), 0);
  const avgSales = salesValues.length
    ? Math.round(salesValues.reduce((a, b) => a + b, 0) / salesValues.length)
    : 0;

  const todaySales = salesValues[6] || 0;
  const yesterdaySales = salesValues[5] || 0;
  const trendPercent =
    yesterdaySales > 0
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100
      : 0;

  return (
    <Card className="lg:col-span-2 border-gray-100 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-slate-800">
          Sales Report (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `৳${value}`}
                domain={[0, getChartUpperBound]}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#ea580c"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSales)"
                activeDot={{
                  r: 6,
                  fill: "#ea580c",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                dot={{
                  r: 4,
                  fill: "#ea580c",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-50 text-center">
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">
              Trend
            </div>
            <div
              className={`text-sm font-bold flex items-center justify-center gap-1 ${trendPercent >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              <ArrowUpRight className={trendPercent < 0 ? "rotate-180" : ""} />
              {Math.abs(trendPercent).toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">
              Average
            </div>
            <div className="text-sm font-bold text-slate-700">
              ৳{avgSales.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">
              Peak
            </div>
            <div className="text-sm font-bold text-slate-700">
              ৳{maxSales.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">
              Low
            </div>
            <div className="text-sm font-bold text-slate-700">
              ৳{minSales.toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
