import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { Activity, User, Phone, MapPin, Eye, ShoppingCart, CheckCircle, Globe, Smartphone } from 'lucide-react';
import { SignalDataCell } from '@/components/admin/SignalDataCell';
import { EventExportButton } from '@/components/admin/EventExportButton';

export const dynamic = 'force-dynamic';

export default async function EventMatrixPage() {
    const events = await prisma.trackingEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
    });

    const getEventIcon = (name: string) => {
        switch (name) {
            case 'ViewContent': return <Eye className="w-4 h-4 text-blue-500" />;
            case 'AddToCart': return <ShoppingCart className="w-4 h-4 text-orange-500" />;
            case 'InitiateCheckout': return <Activity className="w-4 h-4 text-purple-500" />;
            case 'Purchase': return <CheckCircle className="w-4 h-4 text-green-500" />;
            default: return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">EVENT MATRIX</h1>
                    <p className="text-slate-500 font-medium">Real-time customer signals & conversion logs</p>
                </div>
                <div className="flex items-center gap-3">
                    <EventExportButton />
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 h-10">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">Live Monitoring Active</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Time</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Event</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Signal Data</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Device / IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {events.length > 0 ? (
                                events.map((event) => (
                                    <tr key={event.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-[11px] font-bold text-slate-400 font-mono">
                                                {format(event.createdAt, 'HH:mm:ss')}
                                            </span>
                                            <div className="text-[10px] text-slate-300">
                                                {format(event.createdAt, 'MMM dd')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getEventIcon(event.eventName)}
                                                <span className="text-sm font-black text-slate-800 tracking-tight">
                                                    {event.eventName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                    <User className="w-3 h-3 text-slate-400" />
                                                    {event.customerName || 'Anonymous User'}
                                                </div>
                                                {event.customerPhone && (
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                        <Phone className="w-3 h-3 text-slate-400" />
                                                        {event.customerPhone}
                                                    </div>
                                                )}
                                                {(event.customerCity || event.customerArea) && (
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 italic">
                                                        <MapPin className="w-3 h-3" />
                                                        {event.customerCity} {event.customerArea && `(${event.customerArea})`}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <SignalDataCell data={event.eventData} eventName={event.eventName} />
                                            <div className="text-[10px] text-slate-400 truncate mt-1">
                                                URL: {event.sourceUrl ? new URL(event.sourceUrl).pathname : '/'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                                    <Globe className="w-3 h-3 text-slate-300" />
                                                    {event.ipAddress || 'Unknown IP'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 max-w-[150px] truncate">
                                                    <Smartphone className="w-3 h-3 text-slate-300" />
                                                    {event.userAgent || 'Unknown Device'}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                        No signals captured yet...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
