'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Package, Truck, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Order {
    id: string;
    item: string; // We might need to map 'items' count to a string description or just show 'X items'
    status: string;
    time: string;
    items: number;
    customer: string;
}

interface FulfillmentBoardProps {
    orders: any[]; // Using any[] to match the flexible order structure for now, ideally strictly typed
    onStatusChange: (id: string, newStatus: string) => void;
    readOnly?: boolean;
}

export function FulfillmentBoard({ orders, onStatusChange, readOnly }: FulfillmentBoardProps) {
    const columns = [
        { title: 'Pending', status: 'Placed', icon: Clock, color: 'bg-gray-100 text-gray-500' },
        { title: 'Ready to Process', status: 'Ready to Process', icon: Package, color: 'bg-indigo-100 text-indigo-600' },
        { title: 'Ready To Fry', status: 'Ready To Fry', icon: CheckCircle, color: 'bg-orange-100 text-orange-600' },
        { title: 'Dispatched', status: 'Shipped', icon: Truck, color: 'bg-blue-100 text-blue-600' },
    ];

    const getNextStatus = (current: string) => {
        if (current === 'Placed') return 'Confirmed';
        if (current === 'Confirmed') return 'Ready to Process';
        if (current === 'Ready to Process') return 'Ready To Fry';
        if (current === 'Ready To Fry') return 'Shipped';
        return 'Shipped';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4">
            {columns.map((col) => (
                <div key={col.status} className="flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-100 min-w-[280px]">
                    <div className={`p-3 border-b border-gray-100 font-bold flex items-center gap-2 ${col.color.replace('bg-', 'text-')}`}>
                        <col.icon className="w-4 h-4" />
                        {col.title}
                        <Badge variant="outline" className="ml-auto bg-white shadow-sm border-none">
                            {orders.filter(o => {
                                if (col.status === 'Placed') return o.status === 'Placed' || o.status === 'Confirmed';
                                if (col.status === 'Ready to Process') return o.status === 'Ready to Process' || o.status === 'Processing';
                                if (col.status === 'Ready To Fry') return o.status === 'Ready To Fry' || o.status === 'Ready';
                                return o.status === col.status;
                            }).length}
                        </Badge>
                    </div>

                    <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                        {orders
                            .filter(o => {
                                if (col.status === 'Placed') return o.status === 'Placed' || o.status === 'Confirmed';
                                if (col.status === 'Ready to Process') return o.status === 'Ready to Process' || o.status === 'Processing';
                                if (col.status === 'Ready To Fry') return o.status === 'Ready To Fry' || o.status === 'Ready';
                                return o.status === col.status;
                            })
                            .map(order => (
                                <Card key={order.id} className={`p-3 cursor-pointer hover:shadow-md transition-shadow group ${order.status === 'Confirmed' && col.status === 'Placed' ? 'border-l-4 border-l-green-500' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-slate-800">{order.id}</span>
                                        <span className="text-xs text-slate-400">{order.time || 'Now'}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600 mb-2">{order.items} items • {order.customer}</p>

                                    {/* Quick Actions */}
                                    {!readOnly && (
                                        <div className="flex gap-2">
                                            {order.status !== 'Shipped' && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="w-full h-7 text-xs bg-white border border-gray-100 shadow-sm hover:bg-gray-50"
                                                    onClick={() => onStatusChange(order.id, getNextStatus(order.status))}
                                                >
                                                    {order.status === 'Placed' ? 'Confirm' : 'Next'} <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            )}
                                            {col.status === 'Placed' && (
                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        {orders.filter(o => {
                            if (col.status === 'Placed') return o.status === 'Placed' || o.status === 'Confirmed';
                            if (col.status === 'Ready to Process') return o.status === 'Ready to Process' || o.status === 'Processing';
                            if (col.status === 'Ready To Fry') return o.status === 'Ready To Fry' || o.status === 'Ready';
                            return o.status === col.status;
                        }).length === 0 && (
                                <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">
                                    No Orders
                                </div>
                            )}
                    </div>
                </div>
            ))}
        </div>
    );
}
