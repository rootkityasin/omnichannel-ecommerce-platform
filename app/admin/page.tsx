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
                    trend="+12%"
                    trendColor="text-green-500"
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
                    value="1,203"
                    icon={Users}
                    trend="+5 New"
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
                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `৳${value}`} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="sales" stroke="#ea580c" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-50 text-center">
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Trend</div>
                                <div className="text-sm font-bold text-green-500 flex items-center justify-center gap-1">
                                    <ArrowUpRight className="w-3 h-3" /> 58.7%
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Average</div>
                                <div className="text-sm font-bold text-slate-700">৳2,850</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Peak</div>
                                <div className="text-sm font-bold text-slate-700">৳4,000</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase tracking-wider">Low</div>
                                <div className="text-sm font-bold text-slate-700">৳1,890</div>
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
                        <p className="text-orange-600 font-medium mt-1">Live Mud Crab (XL)</p>
                        <p className="text-sm text-slate-500 mt-4">145 orders this month</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon: Icon, trend, trendColor }: any) {
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
