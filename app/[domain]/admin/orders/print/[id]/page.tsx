import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import PrintButton from './PrintButton';
import { getAdminSiteConfig } from '@/app/actions/settings';
import { Badge } from '@/components/ui/badge';

// Force dynamic to ensure we get fresh data
export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [order, config] = await Promise.all([
        prisma.order.findUnique({
            where: { orderId: id },
            include: { items: { include: { product: true } } }
        }),
        getAdminSiteConfig()
    ]);

    if (!order) return notFound();

    const subtotal = order.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    const discount = order.discountAmount || 0;
    const delivery = order.totalAmount - (subtotal - discount);

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 print:p-0 print:bg-white">
            {/* Print Control Overlay */}
            <div className="max-w-3xl mx-auto mb-6 print:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-sm font-medium text-slate-600">Generated for #{order.orderId}</span>
                </div>
                <PrintButton />
            </div>

            {/* Main Receipt Card */}
            <div className="max-w-[800px] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 print:shadow-none print:border-none relative">

                {/* Modern Background Watermark */}
                {config?.logoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.12] pointer-events-none select-none overflow-hidden">
                        <img
                            src={config.logoUrl}
                            alt="Watermark"
                            className="w-1/3 h-auto max-h-[40%] object-contain grayscale-[0.2]"
                        />
                    </div>
                )}

                <div className="relative z-10 p-8 sm:p-12">
                    {/* Top Bar Accent */}
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: config?.primaryColor || '#F40000' }}></div>

                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
                        <div className="flex flex-col gap-4">
                            {config?.logoUrl ? (
                                <img src={config.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                            ) : (
                                <h2 className="text-2xl font-black italic tracking-tighter" style={{ color: config?.primaryColor || '#000' }}>
                                    {config?.shopName || 'CRAB & KHAI'}
                                </h2>
                            )}
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoice</h1>
                                <p className="text-slate-500 font-medium">#{order.orderId}</p>
                            </div>
                        </div>

                        <div className="text-right flex flex-col gap-1">
                            <h3 className="font-bold text-slate-900">{config?.shopName || 'Crab & Khai'}</h3>
                            <p className="text-sm text-slate-500">{config?.contactAddress || '195 Green Road, Dhaka'}</p>
                            <p className="text-sm text-slate-500">{config?.contactPhone || '+880 1804 221 161'}</p>
                            <p className="text-sm text-slate-500">{config?.contactEmail || 'crabkhaibangladesh@gmail.com'}</p>
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Issued: {order.createdAt.toLocaleDateString('en-GB')}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 pt-8 border-t border-slate-100">
                        {/* Bill To */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Bill To</p>
                            <h4 className="text-xl font-bold text-slate-900 mb-1">{order.customerName}</h4>
                            <p className="text-slate-500 font-medium">{order.customerPhone}</p>
                            <p className="text-slate-400 text-sm mt-2 whitespace-pre-wrap leading-relaxed">
                                {order.customerAddress}
                            </p>
                        </div>

                        {/* Order Details */}
                        <div className="md:text-right">
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">Details</p>
                            <div className="space-y-1">
                                <p className="text-sm text-slate-600"><span className="text-slate-400">Payment:</span> Cash on Delivery</p>
                                <p className="text-sm text-slate-600"><span className="text-slate-400">Source:</span> {order.source || 'Online'}</p>
                                <p className="text-sm text-slate-600"><span className="text-slate-400">Status:</span>
                                    <span className="ml-2 font-bold text-slate-900">{order.status}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-12">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                    <th className="text-left py-4 border-b border-slate-100 w-12">#</th>
                                    <th className="text-left py-4 border-b border-slate-100">Item Description</th>
                                    <th className="text-center py-4 border-b border-slate-100 w-20">Qty</th>
                                    <th className="text-right py-4 border-b border-slate-100 w-32">Rate</th>
                                    <th className="text-right py-4 border-b border-slate-100 w-32 font-bold text-slate-900">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {order.items.map((item: any, i: number) => (
                                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 text-slate-300 font-medium">{String(i + 1).padStart(2, '0')}</td>
                                        <td className="py-5">
                                            <p className="font-bold text-slate-800">{item.product.name}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {item.product.weight ? `${item.product.weight}g` : ''}
                                                {item.product.weight && item.product.pieces ? ' / ' : ''}
                                                {item.product.pieces ? `${item.product.pieces}pcs` : ''}
                                            </p>
                                        </td>
                                        <td className="py-5 text-center text-slate-600 font-medium">x{item.quantity}</td>
                                        <td className="py-5 text-right text-slate-500 font-medium">৳{item.price}</td>
                                        <td className="py-5 text-right font-bold text-slate-900">৳{item.price * item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Calculation Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-8 border-t border-slate-100 pt-12">
                        {/* Notes Area */}
                        <div className="max-w-xs text-xs text-slate-400 italic">
                            NB: This is a system generated invoice. Please retain this for future inquiries regarding your order.
                        </div>

                        {/* Breakdown */}
                        <div className="w-full sm:w-80 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span className="font-bold text-slate-900">৳{subtotal}</span>
                            </div>

                            {discount > 0 && (
                                <div className="flex justify-between items-center text-sm text-green-600">
                                    <span className="flex items-center gap-1">Discount <span className="text-[10px] bg-green-50 px-1.5 py-0.5 rounded font-bold">{order.couponCode}</span></span>
                                    <span className="font-bold font-mono">-৳{discount}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Delivery Charge</span>
                                <span className="font-bold text-slate-900">৳{delivery}</span>
                            </div>

                            <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center bg-slate-900 p-6 rounded-2xl -mx-4 -mb-4 mt-6 text-white shadow-lg print:bg-black print:text-white">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Charged</p>
                                    <p className="text-2xl font-black">৳{order.totalAmount}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">Taxes Incl.</Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Minimalist Signature / Stamp Area */}
                    <div className="mt-20 flex justify-between items-end gap-12">
                        <div className="text-center w-32 border-t border-slate-200 pt-2">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Customer Sign</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${order.orderId}`}
                                alt="Order QR Code"
                                className="w-20 h-20 border border-slate-100 p-1"
                            />
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Scan to Verify: {order.orderId}</p>
                        </div>
                        <div className="text-center w-32 border-t border-slate-200 pt-2 relative">
                            {/* Optional Stamp Spot */}
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Authorized By</p>
                        </div>
                    </div>

                    {/* Footer Accent */}
                    <div className="mt-20 text-center border-t border-slate-50 pt-8 opacity-50">
                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.3em]">Thank you for choosing {config?.shopName || 'CRAB & KHAI'}</p>
                        <p className="text-[10px] text-slate-400 mt-2">Driven by Excellence • Sustainable Sourcing • Quality Guaranteed</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
