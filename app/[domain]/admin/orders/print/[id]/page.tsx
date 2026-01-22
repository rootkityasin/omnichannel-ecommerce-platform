import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Image from 'next/image';

// Force dynamic to ensure we get fresh data
export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch by DB ID or Order ID? Let's assume passed param is OrderID (e.g. ORD-123) for friendliness, 
    // or checks both. The action uses OrderId.
    const order = await prisma.order.findUnique({
        where: { orderId: id },
        include: { items: { include: { product: true } } }
    });

    if (!order) return notFound();

    // Calculate Subtotal
    const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const delivery = 60; // Standard delivery, or should be stored in order? 
    // Schema doesn't have deliveryCharge field on Order, assuming standard or included in total?
    // Wait, Order.totalAmount is stored.
    // So Delivery = Total - Subtotal + Discount
    // Let's rely on stored total.
    const discount = order.discountAmount || 0;
    const calcTotal = subtotal - discount + delivery;
    // If order.totalAmount differs, we should respect order.totalAmount as the truth.

    return (
        <div className="min-h-screen bg-white text-black p-8 font-mono text-sm max-w-3xl mx-auto">
            {/* Print Trigger */}
            <div className="print:hidden mb-8 flex justify-end">
                <button
                    onClick={() => window.print()}
                    className="bg-black text-white px-4 py-2 rounded-md font-sans font-bold hover:bg-gray-800"
                >
                    Print Invoice
                </button>
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-8 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-bold mb-2">INVOICE</h1>
                    <p className="text-gray-500">Order #{order.orderId}</p>
                    <p className="text-gray-500">{order.createdAt.toLocaleDateString()} {order.createdAt.toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">Crab & Khai</h2>
                    <p>195 Green Road, Dhaka</p>
                    <p>+880 1804 221 161</p>
                    <p>crabkhaibangladesh@gmail.com</p>
                </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
                <h3 className="font-bold text-gray-500 mb-2 uppercase text-xs tracking-wider">Bill To</h3>
                <p className="font-bold text-lg">{order.customerName}</p>
                <p>{order.customerPhone}</p>
                <p className="whitespace-pre-wrap max-w-xs">{order.customerAddress}</p>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left py-2">Item</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Price</th>
                        <th className="text-right py-2">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {order.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100">
                            <td className="py-2">
                                <span className="block font-bold">{item.product.name}</span>
                                <span className="text-xs text-gray-500">{item.product.weight}g / {item.product.pieces}pcs</span>
                            </td>
                            <td className="text-right py-2">{item.quantity}</td>
                            <td className="text-right py-2">৳{item.price}</td>
                            <td className="text-right py-2">৳{item.price * item.quantity}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>৳{subtotal}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-৳{discount}</span>
                        </div>
                    )}
                    {/* Heuristic delivery calc if not explicitly stored */}
                    <div className="flex justify-between text-gray-500">
                        <span>Delivery</span>
                        <span>৳{order.totalAmount - (subtotal - discount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl pt-4 border-t-2 border-black">
                        <span>Total</span>
                        <span>৳{order.totalAmount}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-400 mt-16 border-t pt-8">
                <p>Thank you for choosing Crab & Khai!</p>
                <p>For any queries, please contact us at +880 1804 221 161</p>
            </div>

            {/* Print Script Injection for simpler auto-print if likely desired, but button is safer */}
            <script dangerouslySetInnerHTML={{
                __html: `
                // Optional: window.onload = () => window.print();
            `}} />
        </div>
    );
}
