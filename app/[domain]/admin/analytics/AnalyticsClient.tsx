'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, ShoppingCart, XCircle, Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAdmin } from '@/components/providers/AdminProvider';

const SOURCE_COLORS = ['#ea580c', '#22c55e', '#3b82f6'];

export default function AnalyticsClient({ metrics }: { readonly metrics: any }) {
    const { orders } = useAdmin(); // Using AdminProvider specifically for CSV export feature (limited to last 1000 in memory)

    const handleExport = (days: number) => {
        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - days);

        const filteredOrders = orders.filter(o => {
            const orderDate = new Date(o.date); 
            return orderDate >= cutoffDate;
        });

        if (filteredOrders.length === 0) {
            alert(`No orders found for the last ${days} days.`);
            return;
        }

        // CSV Creation
        const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Items', 'Total Price', 'Status', 'Source'];
        const rows = filteredOrders.map(o => [
            o.id,
            `"${o.date}"`, 
            `"${o.customer}"`,
            o.phone,
            o.items,
            o.price,
            o.status,
            o.source
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sales_Report_${days}Days_${now.toISOString().split('T')[0]}.csv`;
        a.click();
        globalThis.URL.revokeObjectURL(url);
    };

    if (!metrics) {
        return <div className="p-8 text-center text-slate-500">Failed to load metrics.</div>;
    }

    const { totalRevenue, uniqueCustomers, avgOrderValue, cancellationRate, cancelledOrders, sourceData } = metrics;

    // Trend Data - Keeping the simple trend based on the latest orders chunk in the admin store for the charts
    // (This prevents needing complex date bucketing logic on the server for full-time graph generation immediately)
    const salesByDate: Record<string, number> = {};
    orders.forEach(o => {
        if (o.status !== 'Cancelled') {
            const dateKey = o.date.split(',')[0];
            salesByDate[dateKey] = (salesByDate[dateKey] || 0) + o.price;
        }
    });

    const trendData = Object.keys(salesByDate).map(date => ({
        name: date,
        sales: salesByDate[date],
    }));

    if (trendData.length === 0) trendData.push({ name: 'No Data', sales: 0 });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">📊 Analytics Reports</h1>
                    <p className="text-sm text-slate-500">Real-time business performance based on your orders.</p>
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
                            <DropdownMenuItem onClick={() => handleExport(7)}>Last 7 Days (Max 1000 orders)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(15)}>Last 15 Days (Max 1000 orders)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(30)}>Last 30 Days (Max 1000 orders)</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-md border border-gray-200 flex items-center">
                        Live Data
                    </div>
                </div>
            </div>

            {/* Primary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Total Revenue" value={`৳ ${totalRevenue.toLocaleString()}`} icon={TrendingUp} sub="All time" color="text-green-600" />
                <MetricCard title="Unique Customers" value={uniqueCustomers} icon={Users} sub="Based on phone #" color="text-blue-600" />
                <MetricCard title="Avg. Order Value" value={`৳ ${avgOrderValue}`} icon={ShoppingCart} sub="All time average" color="text-orange-600" />
                <MetricCard title="Cancellation Rate" value={`${cancellationRate}%`} icon={XCircle} sub={`${cancelledOrders} cancelled`} color="text-red-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Chart (Area) */}
                <Card className="border-gray-100 shadow-sm col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800">Revenue Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ea580c" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[0, (dataMax: number) => (dataMax === 0 ? 5000 : 'auto')]}
                                        allowDecimals={false}
                                    />
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(value: number | string | undefined) => `৳ ${value ?? 0}`} />
                                    <Area type="monotone" dataKey="sales" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart (Sales by Source) */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800">All-Time Sales by Source</CardTitle>
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
                                        {sourceData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${entry.name}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Bar Chart (Traffic vs Sales) */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800">Recent Traffic vs Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData}>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[0, (dataMax: number) => (dataMax === 0 ? 5000 : 'auto')]}
                                        allowDecimals={false}
                                    />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                    <Legend verticalAlign="bottom" height={36} />
                                    <Bar dataKey="sales" name="Sales" fill="#ea580c" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
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

function MetricCard({ title, value, icon: Icon, sub, color, bg }: MetricCardProps) {
    return (
        <Card className={`border-none shadow-sm ${bg || 'bg-white border border-gray-100'}`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">{title}</span>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
                <div className="text-xs text-slate-400 mt-1">{sub}</div>
            </CardContent>
        </Card>
    )
}
