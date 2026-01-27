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
import { ArrowUpRight, TrendingUp, Users, ShoppingCart, Activity, DollarSign, XCircle, Download } from 'lucide-react';
import { useAdmin } from '@/components/providers/AdminProvider';

const COLORS = ['#ea580c', '#f97316', '#fbbf24', '#94a3b8'];

export default function AnalyticsPage() {
    const { orders } = useAdmin();

    const handleExport = (days: number) => {
        const now = new Date();
        const cutoffDate = new Date();
        cutoffDate.setDate(now.getDate() - days);

        const filteredOrders = orders.filter(o => {
            const orderDate = new Date(o.date); // Assumes "Oct 04, 2024..." parses correctly
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
            `"${o.date}"`, // Quote to handle commas
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
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Sales_Report_${days}Days_${now.toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // 1. Calculate Summary Metrics
    const totalRevenue = orders.reduce((acc, o) => acc + (o.status !== 'Cancelled' ? o.price : 0), 0);
    const uniqueCustomers = new Set(orders.map(o => o.phone)).size;
    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
    const cancellationRate = orders.length > 0 ? ((cancelledOrders / orders.length) * 100).toFixed(1) : '0';

    // 2. Prepare Chart Data (Sales by Source)
    const sourceData = [
        { name: 'Web', value: orders.filter(o => o.source === 'WEB').length },
        { name: 'WhatsApp', value: orders.filter(o => o.source === 'WHATSAPP').length },
        { name: 'Manual', value: orders.filter(o => o.source === 'MANUAL').length },
    ].filter(d => d.value > 0);

    // 3. Prepare Chart Data (Daily Trends - Mocking "Days" based on available data distribution for demo)
    // Since mock dates are just strings, we'll bucket them simply or map them to current week days for visual effect if real parsing is complex.
    // For now, let's map the existing orders to a simple "Last 7 Days" distribution based on their ID mod to simulate spread, 
    // OR just parse the dates if they are consistent.
    // The dates are "Oct 04, 2024". Let's try to group by date string.
    const salesByDate: Record<string, number> = {};
    orders.forEach(o => {
        if (o.status !== 'Cancelled') {
            // Simplify date to just "Oct 04"
            const dateKey = o.date.split(',')[0];
            salesByDate[dateKey] = (salesByDate[dateKey] || 0) + o.price;
        }
    });

    // Convert to array for Chart
    const trendData = Object.keys(salesByDate).map(date => ({
        name: date,
        sales: salesByDate[date],
    }));

    // If no data, provide at least one empty point to prevent chart crash
    if (trendData.length === 0) trendData.push({ name: 'No Data', sales: 0 });

    const COLORS = ['#ea580c', '#22c55e', '#3b82f6'];

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
                            <DropdownMenuItem onClick={() => handleExport(7)}>Last 7 Days</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(15)}>Last 15 Days</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport(30)}>Last 30 Days</DropdownMenuItem>
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
                <MetricCard title="Avg. Order Value" value={`৳ ${avgOrderValue}`} icon={ShoppingCart} sub="Per order" color="text-orange-600" />
                <MetricCard title="Cancellation Rate" value={`${cancellationRate}%`} icon={XCircle} sub={`${cancelledOrders} orders`} color="text-red-500" />
            </div>

            {/* Secondary Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Net Profit (Est.)" value={`৳ ${(totalRevenue * 0.35).toLocaleString()}`} icon={DollarSign} sub="~35% Margin" color="text-emerald-600" bg="bg-emerald-50" />
                <MetricCard title="Active Hub" value={orders.length > 0 ? "Active" : "No Activity"} icon={Activity} sub="System Status" color="text-slate-600" bg="bg-slate-50" />
                <MetricCard title="Avg. Prep Time" value="--" icon={Activity} sub="Calculated from status" color="text-purple-600" bg="bg-purple-50" />
                <MetricCard title="Conversion" value="--" icon={Activity} sub="Web Visitors" color="text-blue-600" bg="bg-blue-50" />
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
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(value: any) => `৳ ${value}`} />
                                    <Area type="monotone" dataKey="sales" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart (Sales by Source) */}
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800">Sales by Source</CardTitle>
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
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                        <CardTitle className="text-lg text-slate-800">Traffic vs Sales</CardTitle>
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

function MetricCard({ title, value, icon: Icon, sub, color, bg }: any) {
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
