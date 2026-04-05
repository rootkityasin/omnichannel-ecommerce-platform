"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SOURCE_COLORS = ["#ea580c", "#22c55e", "#3b82f6"];

const getChartUpperBound = (dataMax: number) => {
  if (dataMax <= 0) return 5000;
  return Math.max(Math.ceil(dataMax * 1.2), dataMax + 100);
};

export default function AnalyticsCharts({
  trendData,
  sourceData,
}: {
  readonly trendData: Array<{ name: string; sales: number }>;
  readonly sourceData: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-gray-100 shadow-sm col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Revenue Trends
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
                  domain={[0, getChartUpperBound]}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px" }}
                  formatter={(value: number | string | undefined) =>
                    `৳ ${value ?? 0}`
                  }
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
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            All-Time Sales by Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">
            Recent Traffic vs Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
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
                  domain={[0, getChartUpperBound]}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "8px" }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar
                  dataKey="sales"
                  name="Sales"
                  fill="#ea580c"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
