import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getSiteConfig } from "@/app/actions/settings";
import { getTenantByDomain } from "@/app/actions/tenant";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string; domain: string }>;
}) {
  const { id, domain } = await params;

  const [order, config, tenant] = await Promise.all([
    prisma.order.findUnique({
      where: { orderId: id },
      include: { items: { include: { product: true } } },
    }),
    getSiteConfig(domain),
    getTenantByDomain(domain),
  ]);

  // Verify order exists AND belongs to this tenant
  if (!order || !tenant || order.tenantId !== tenant.id) return notFound();

  const subtotal = order.items.reduce(
    (acc: number, item) => acc + item.price * item.quantity,
    0,
  );
  const discount = order.discountAmount || 0;
  const delivery = order.totalAmount - (subtotal - discount);

  const invoiceDetailsSource = config.invoiceDetails;
  const invoiceDetails =
    typeof invoiceDetailsSource === "object" &&
    invoiceDetailsSource !== null &&
    !Array.isArray(invoiceDetailsSource)
      ? (invoiceDetailsSource as Record<string, unknown>)
      : {};
  const invoicePrefs = {
    watermarkOpacity:
      typeof invoiceDetails.watermarkOpacity === "number"
        ? invoiceDetails.watermarkOpacity
        : 0.1,
    fontSize:
      typeof invoiceDetails.fontSize === "number"
        ? invoiceDetails.fontSize
        : 14,
    showLogo: invoiceDetails.showLogo !== false,
    showBuyer: invoiceDetails.showBuyer !== false,
    showSeller: invoiceDetails.showSeller !== false,
    showSignature: invoiceDetails.showSignature !== false,
    showQr: invoiceDetails.showQr !== false,
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 print:p-0 print:bg-white text-slate-900">
      <div className="max-w-[800px] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 print:shadow-none print:border-none relative text-slate-900">
        {config?.logoUrl && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
            style={{ zIndex: 0 }}
          >
            <img
              src={config.logoUrl}
              alt="Watermark"
              className="w-1/3 h-auto max-h-[40%] object-contain grayscale-[0.2]"
              style={{ opacity: invoicePrefs.watermarkOpacity }}
            />
          </div>
        )}

        <div
          className="relative z-10 p-8 sm:p-12 h-full flex flex-col"
          style={{
            fontSize: `${invoicePrefs.fontSize}px`,
            fontFamily:
              "invoiceTheme" in config && config.invoiceTheme === "classic"
                ? "Times New Roman, serif"
                : "inherit",
          }}
        >
          <div className="flex justify-between items-end border-b-4 border-slate-800 pb-2 mb-4">
            {invoicePrefs.showLogo && config?.logoUrl ? (
              <div className="relative h-12 w-48">
                <Image
                  src={config.logoUrl}
                  alt="Logo"
                  fill
                  className="object-contain object-left"
                />
              </div>
            ) : (
              <h1 className="text-2xl font-bold">{config?.shopName}</h1>
            )}
            <div className="text-right">
              <h2 className="text-xl font-bold uppercase tracking-widest text-slate-800">
                Receipt
              </h2>
              <p className="text-xs text-slate-700">Doc No: {order.orderId}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {invoicePrefs.showBuyer && (
              <div className="flex-1 border border-slate-300 p-3">
                <h3 className="font-bold text-xs uppercase mb-2 border-b border-slate-200 pb-1">
                  Billing Details:
                </h3>
                <p className="font-bold">{order.customerName}</p>
                <p className="text-sm text-slate-800">
                  {order.customerAddress}
                </p>
                <p className="text-sm font-mono mt-1 text-slate-800">
                  {order.customerPhone}
                </p>
              </div>
            )}
            {invoicePrefs.showSeller && (
              <div className="flex-1 border border-slate-300 p-3">
                <h3 className="font-bold text-xs uppercase mb-2 border-b border-slate-200 pb-1">
                  Seller Details:
                </h3>
                <p className="font-bold">{config?.shopName}</p>
                <p className="text-sm text-slate-800">
                  {config?.contactAddress}
                </p>
                <p className="text-sm font-mono mt-1 text-slate-800">
                  {config?.contactPhone}
                </p>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-3">Item</th>
                  <th className="text-center p-3">Qty</th>
                  <th className="text-right p-3">Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {item.product?.image && (
                          <div className="relative w-10 h-10 rounded-md overflow-hidden">
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-xs text-slate-700">
                            #{order.orderId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <Badge variant="outline">{item.quantity}</Badge>
                    </td>
                    <td className="text-right p-3">
                      ৳{item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-700">Subtotal</span>
                <span className="font-medium">৳{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-৳{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-700">Delivery</span>
                <span className="font-medium">৳{delivery}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>৳{order.totalAmount}</span>
              </div>
            </div>
          </div>

          {invoicePrefs.showQr && (
            <div className="mt-8 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700 mb-2">
                  receipt #{order.orderId} •{" "}
                  {order.createdAt.toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-600">
                  Keep this receipt for your records.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <QRCodeSVG value={order.orderId} size={80} />
                <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                  Scan to Verify: {order.orderId}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
