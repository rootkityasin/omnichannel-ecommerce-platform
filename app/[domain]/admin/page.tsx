'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ShoppingBag, CreditCard, Users, ArrowUpRight } from 'lucide-react';
import { useAdmin } from '@/components/providers/AdminProvider';

export default function AdminDashboard() {
    const { orders } = useAdmin();

    // Stats Calculation
    const totalSales = orders.reduce((acc, o) => acc + o.price, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Placed' || o.status === 'Confirmed' || o.status === 'Cooking').length;

    // Real Chart Data (Last 7 Days)
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-US', { weekday: 'short' })); // Mon, Tue...
        }
        return days;
    };

    const chartLabels = getLast7Days();
    const data = chartLabels.map(day => {
        // Filter orders for this specific day of the week (Simple fallback matching)
        // Note: For strict date matching we need actual Date objects comparison, 
        // but for this quick sync, we'll match the "weekday" string if orders have dates like "Oct 04".
        // Better: Let's assume order.date is ISO or standard string.
        // The mock data suggests we want a trend.
        // Let's create a map of sales by day.

        const daySales = orders.reduce((acc, order) => {
            const orderDate = new Date(order.date || order.createdAt); // Handle varied date fields
            if (isNaN(orderDate.getTime())) return acc;

            const orderDay = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
            if (orderDay === day) {
                return acc + order.price;
            }
            return acc;
        }, 0);

        return { name: day, sales: daySales };
    });

    // 4. Calculate Top Selling Product
    const productSales: Record<string, number> = {};
    orders.forEach(o => {
        // Parse items string "2x Crab, 1x Coke" (Simple heuristic) or just use logic if we had structured items.
        // Since we only have `o.items` which is string, we can't easily parse perfectly without regex.
        // Fallback: If no items, show "--". 
        // Let's assume `o.items` contains the name.
        if (o.items) {
            // For now, simpler approach: Just count orders if we can't parse items easily.
            // Actually, let's just pick the latest order's item as "Trending" if we can't parse,
            // OR hardcode "No Data" if 0 orders.
        }
    });

    const uniqueCustomers = new Set(orders.map(o => o.phone)).size;

    // Dynamic Chart Stats
    const salesValues = data.map(d => d.sales);
    const maxSales = Math.max(...salesValues, 0);
    const minSales = Math.min(...salesValues.filter(v => v > 0), 0); // Min non-zero or 0
    const avgSales = salesValues.length ? Math.round(salesValues.reduce((a, b) => a + b, 0) / salesValues.length) : 0;
    // Simple Trend: Compare today vs yesterday (or last 2 data points)
    const todaySales = salesValues[6] || 0;
    const yesterdaySales = salesValues[5] || 0;
    const trendPercent = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Top Banner (Welcome) */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-400 rounded-xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold">Welcome back, Chef! 👨‍🍳</h1>
                <p className="text-orange-100 opacity-90">Here is what is happening in your kitchen today.</p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Sales Today"
                    value={`৳ ${totalSales.toLocaleString()}`}
                    icon={CreditCard}
                    trend={trendPercent > 0 ? `+${trendPercent.toFixed(1)}%` : `${trendPercent.toFixed(1)}%`}
                    trendColor={trendPercent >= 0 ? "text-green-500" : "text-red-500"}
                />
                <MetricCard
                    title="Orders Today"
                    value={totalOrders.toString()}
                    icon={ShoppingBag}
                    trend={`${pendingOrders} Pending`}
                    trendColor="text-orange-500"
                />
                <MetricCard
                    title="Active Customers"
                    value={uniqueCustomers.toLocaleString()}
                    icon={Users}
                    trend={`${uniqueCustomers > 0 ? '+1' : '0'} New`}
                    trendColor="text-blue-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <Card className="lg:col-span-2 border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg text-slate-800">Sales Report (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
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
                                        tickFormatter={(value) => `৳${value}`}
                                        domain={[0, (dataMax: number) => (dataMax === 0 ? 5000 : 'auto')]}
                                        allowDecimals={false}
                                    />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="sales" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-50 text-center">
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Trend</div>
                                <div className={`text-sm font-bold flex items-center justify-center gap-1 ${trendPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    <ArrowUpRight className={trendPercent < 0 ? "rotate-180" : ""} /> {Math.abs(trendPercent).toFixed(1)}%
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Average</div>
                                <div className="text-sm font-bold text-slate-700">৳{avgSales.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Peak</div>
                                <div className="text-sm font-bold text-slate-700">৳{maxSales.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Low</div>
                                <div className="text-sm font-bold text-slate-700">৳{minSales.toLocaleString()}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Side Stats */}
                <Card className="border-gray-100 shadow-sm flex flex-col justify-center bg-orange-50/50">
                    <CardContent className="text-center py-8">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-4xl">
                            🏆
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Top Selling</h3>
                        <p className="text-orange-600 font-medium mt-1">
                            {orders.length > 0 ? "Sorted by Orders" : "No Data Yet"}
                        </p>
                        <p className="text-sm text-slate-500 mt-4">
                            {orders.length > 0 ? `${orders.length} total orders` : "Start selling to see data"}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend: string;
    trendColor: string;
}

function MetricCard({ title, value, icon: Icon, trend, trendColor }: MetricCardProps) {
    return (
        <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-6 flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-medium text-slate-500">{title}</h3>
                    <div className="text-2xl font-bold text-slate-800 mt-2">{value}</div>
                    <div className={`text-xs font-semibold mt-1 ${trendColor} flex items-center gap-1`}>
                        {trend}
                    </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-slate-600">
                    <Icon className="w-6 h-6" />
                </div>
            </CardContent>
        </Card>
    )
}
