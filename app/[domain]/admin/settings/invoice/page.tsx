"use client";

import { useState, useEffect } from "react";
import { useAdmin } from "@/components/providers/AdminProvider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface InvoiceConfig {
  invoiceTheme: string;
  invoiceDetails: {
    showSeller: boolean;
    showBuyer: boolean;
    showSignature: boolean;
    watermarkOpacity: number;
    fontSize: number;
    showQr: boolean;
    showLogo: boolean;
  };
}

export default function InvoiceSettingsPage() {
  const { settings, updateSettings } = useAdmin();
  const [config, setConfig] = useState<InvoiceConfig>({
    invoiceTheme: "modern",
    invoiceDetails: {
      showSeller: true,
      showBuyer: true,
      showSignature: true,
      watermarkOpacity: 0.1,
      fontSize: 14,
      showQr: true,
      showLogo: true,
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      // Safe casting as settings might have extra properties not in InvoiceConfig yet
      const currentSettings = settings as unknown as Record<string, unknown>;
      const incomingDetails =
        (currentSettings.invoiceDetails as Partial<
          InvoiceConfig["invoiceDetails"]
        >) || {};

      setConfig({
        invoiceTheme: (currentSettings.invoiceTheme as string) || "modern",
        invoiceDetails: {
          showSeller: incomingDetails.showSeller ?? true,
          showBuyer: incomingDetails.showBuyer ?? true,
          showSignature: incomingDetails.showSignature ?? true,
          watermarkOpacity: incomingDetails.watermarkOpacity ?? 0.1,
          fontSize: incomingDetails.fontSize ?? 14,
          showQr: incomingDetails.showQr ?? true,
          showLogo: incomingDetails.showLogo ?? true,
        },
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(config);
      toast.success("Invoice settings updated!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateDetail = <K extends keyof InvoiceConfig["invoiceDetails"]>(
    key: K,
    value: InvoiceConfig["invoiceDetails"][K],
  ) => {
    setConfig((prev) => ({
      ...prev,
      invoiceDetails: {
        ...prev.invoiceDetails,
        [key]: value,
      },
    }));
  };

  // ... rest of component

  // Dummy Order for Preview
  const dummyOrder = {
    orderId: "ORD-12345678",
    date: new Date().toLocaleDateString("en-GB"),
    customerName: "Rahim Uddin",
    customerPhone: "01712345678",
    customerAddress: "House 12, Road 5, Dhanmondi, Dhaka",
    items: [
      {
        id: "1",
        name: "Spicy Crab Masala",
        quantity: 2,
        price: 1200,
        total: 2400,
      },
      { id: "2", name: "Steamed Rice", quantity: 2, price: 100, total: 200 },
    ],
    subtotal: 2600,
    delivery: 60,
    total: 2660,
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">
              Invoice
            </h1>
            <p className="text-sm text-slate-500">
              Customize your receipt layout and style.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-slate-900 hover:bg-orange-600"
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-6 overflow-y-auto pb-10 pr-2">
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
              General
            </h3>

            <div className="space-y-2">
              <Label>Theme Style</Label>
              <Select
                value={config.invoiceTheme}
                onValueChange={(val) =>
                  setConfig({ ...config, invoiceTheme: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern (Card Style)</SelectItem>
                  <SelectItem value="minimal">Minimal (Clean)</SelectItem>
                  <SelectItem value="classic">Classic (Daraz Style)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Base Font Size ({config.invoiceDetails.fontSize}px)</Label>
              <Slider
                value={[config.invoiceDetails.fontSize]}
                min={10}
                max={18}
                step={1}
                onValueChange={([val]) => updateDetail("fontSize", val)}
              />
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
              Visibility
            </h3>

            <div className="flex items-center justify-between">
              <Label>Show Shop Logo</Label>
              <Switch
                checked={config.invoiceDetails.showLogo}
                onCheckedChange={(val) => updateDetail("showLogo", val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Seller Details</Label>
              <Switch
                checked={config.invoiceDetails.showSeller}
                onCheckedChange={(val) => updateDetail("showSeller", val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Buyer Details</Label>
              <Switch
                checked={config.invoiceDetails.showBuyer}
                onCheckedChange={(val) => updateDetail("showBuyer", val)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Signature Area</Label>
              <Switch
                checked={config.invoiceDetails.showSignature}
                onCheckedChange={(val) => updateDetail("showSignature", val)}
              />
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
              Branding
            </h3>

            <div className="space-y-4">
              <Label>
                Watermark Opacity (
                {Math.round(config.invoiceDetails.watermarkOpacity * 100)}%)
              </Label>
              <Slider
                value={[config.invoiceDetails.watermarkOpacity]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([val]) => updateDetail("watermarkOpacity", val)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Show QR Code</Label>
              <Switch
                checked={config.invoiceDetails.showQr}
                onCheckedChange={(val) => updateDetail("showQr", val)}
              />
            </div>
          </Card>
        </div>

        {/* Live Preview Area */}
        <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden shadow-inner flex flex-col">
          <div className="bg-white border-b p-2 flex justify-end">
            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest px-3 py-1">
              Live Preview
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start">
            {/* THE INVOICE PREVIEW CONTAINER */}
            <div
              className="bg-white shadow-2xl min-h-[800px] w-full max-w-[700px] relative transition-all duration-300"
              style={{
                fontSize: `${config.invoiceDetails.fontSize}px`,
                fontFamily:
                  config.invoiceTheme === "classic"
                    ? "Times New Roman, serif"
                    : "inherit",
              }}
            >
              {/* Watermark */}
              {settings?.logoUrl && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
                  <img
                    src={settings.logoUrl}
                    alt="Watermark"
                    className="w-1/3 object-contain grayscale-[0.2]"
                    style={{ opacity: config.invoiceDetails.watermarkOpacity }}
                  />
                </div>
              )}

              <div className="relative z-10 p-8 h-full flex flex-col">
                {/* Theme: Classic (Daraz Style) */}
                {config.invoiceTheme === "classic" && (
                  <>
                    {/* Header */}
                    <div className="flex justify-between items-end border-b-4 border-slate-800 pb-2 mb-4">
                      {config.invoiceDetails.showLogo && settings?.logoUrl ? (
                        <img
                          src={settings.logoUrl}
                          alt="Logo"
                          className="h-12 w-auto object-contain"
                        />
                      ) : (
                        <h1 className="text-2xl font-bold">
                          {settings?.shopName}
                        </h1>
                      )}
                      <div className="text-right">
                        <h2 className="text-xl font-bold uppercase tracking-widest text-slate-800">
                          Invoice
                        </h2>
                        <p className="text-xs text-slate-500">
                          Doc No: {dummyOrder.orderId}
                        </p>
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="flex gap-4 mb-6">
                      {config.invoiceDetails.showBuyer && (
                        <div className="flex-1 border border-slate-300 p-2">
                          <h3 className="font-bold text-xs uppercase mb-2 border-b border-slate-200 pb-1">
                            Billing Details:
                          </h3>
                          <p className="font-bold">{dummyOrder.customerName}</p>
                          <p className="text-sm">
                            {dummyOrder.customerAddress}
                          </p>
                          <p className="text-sm font-mono mt-1">
                            {dummyOrder.customerPhone}
                          </p>
                        </div>
                      )}
                      {config.invoiceDetails.showSeller && (
                        <div className="flex-1 border border-slate-300 p-2">
                          <h3 className="font-bold text-xs uppercase mb-2 border-b border-slate-200 pb-1">
                            Seller Details:
                          </h3>
                          <p className="font-bold">{settings?.shopName}</p>
                          <p className="text-sm">{settings?.contactAddress}</p>
                          <p className="text-sm">{settings?.contactPhone}</p>
                        </div>
                      )}
                    </div>

                    {/* Order Info Strip */}
                    <div className="border border-slate-400 flex text-sm mb-6 bg-slate-50">
                      <div className="flex-1 p-1 border-r border-slate-400 px-2">
                        Order Number: <strong>{dummyOrder.orderId}</strong>
                      </div>
                      <div className="flex-1 p-1 border-r border-slate-400 px-2 text-center">
                        Payment: <strong>Cash on Delivery</strong>
                      </div>
                      <div className="flex-1 p-1 px-2 text-right">
                        Date: <strong>{dummyOrder.date}</strong>
                      </div>
                    </div>

                    {/* Table */}
                    <table className="w-full text-sm border-collapse border border-slate-300 mb-6">
                      <thead className="bg-slate-100">
                        <tr className="border-b border-slate-300">
                          <th className="border-r border-slate-300 p-2 w-10">
                            S/N
                          </th>
                          <th className="border-r border-slate-300 p-2 text-left">
                            Description
                          </th>
                          <th className="border-r border-slate-300 p-2 w-16">
                            Qty
                          </th>
                          <th className="border-r border-slate-300 p-2 text-right w-24">
                            Unit Price
                          </th>
                          <th className="p-2 text-right w-24">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dummyOrder.items.map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-200"
                          >
                            <td className="border-r border-slate-300 p-2 text-center">
                              {item.id}
                            </td>
                            <td className="border-r border-slate-300 p-2">
                              {item.name}
                            </td>
                            <td className="border-r border-slate-300 p-2 text-center">
                              {item.quantity}
                            </td>
                            <td className="border-r border-slate-300 p-2 text-right">
                              {item.price}
                            </td>
                            <td className="p-2 text-right">{item.total}</td>
                          </tr>
                        ))}
                        <tr>
                          <td
                            colSpan={4}
                            className="text-right p-2 font-bold bg-slate-50 border-r border-slate-300"
                          >
                            Total Unit Price
                          </td>
                          <td className="text-right p-2 bg-slate-50">
                            {dummyOrder.subtotal}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={4}
                            className="text-right p-2 font-bold bg-slate-50 border-r border-slate-300"
                          >
                            Shipping
                          </td>
                          <td className="text-right p-2 bg-slate-50">
                            {dummyOrder.delivery}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={4}
                            className="text-right p-2 font-bold bg-slate-100 border-r border-slate-300 text-base"
                          >
                            Total Payable Amount
                          </td>
                          <td className="text-right p-2 bg-slate-100 font-bold text-base border-b-2 border-slate-800">
                            {dummyOrder.total}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Footer / QR */}
                    <div className="flex justify-between items-end mt-auto">
                      <div>
                        {config.invoiceDetails.showQr && (
                          <div className="flex flex-col items-center gap-1">
                            <QRCodeSVG value={dummyOrder.orderId} size={96} />
                            <span className="text-[10px] font-mono">
                              {dummyOrder.orderId}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>
                          **This is a computer generated copy. No signature is
                          required**
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Theme: Modern (Current) */}
                {config.invoiceTheme === "modern" && (
                  <>
                    <div
                      className="absolute top-0 left-0 w-full h-1.5"
                      style={{
                        backgroundColor: settings?.primaryColor || "#F40000",
                      }}
                    ></div>

                    <div className="flex justify-between items-start mb-10 mt-2">
                      <div>
                        {config.invoiceDetails.showLogo && settings?.logoUrl ? (
                          <img
                            src={settings.logoUrl}
                            alt="Logo"
                            className="h-12 w-auto object-contain mb-2"
                          />
                        ) : (
                          <h2
                            className="text-xl font-bold"
                            style={{ color: settings?.primaryColor }}
                          >
                            {settings?.shopName}
                          </h2>
                        )}
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                          Invoice
                        </h1>
                        <p className="text-slate-500 font-medium">
                          #{dummyOrder.orderId}
                        </p>
                      </div>
                      {config.invoiceDetails.showSeller && (
                        <div className="text-right text-sm text-slate-500">
                          <p className="font-bold text-slate-900">
                            {settings?.shopName}
                          </p>
                          <p>{settings?.contactAddress}</p>
                          <p>{settings?.contactPhone}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8 border-t border-b border-slate-200 py-6">
                      {config.invoiceDetails.showBuyer && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                            Bill To
                          </p>
                          <p className="font-bold text-slate-900">
                            {dummyOrder.customerName}
                          </p>
                          <p className="text-sm text-slate-700">
                            {dummyOrder.customerAddress}
                          </p>
                          <p className="text-sm text-slate-700">
                            {dummyOrder.customerPhone}
                          </p>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Details
                        </p>
                        <p className="text-sm text-slate-800">
                          <span className="text-slate-600">Date:</span>{" "}
                          {dummyOrder.date}
                        </p>
                        <p className="text-sm text-slate-800">
                          <span className="text-slate-600">Payment:</span> Cash
                          on Delivery
                        </p>
                      </div>
                    </div>

                    <table className="w-full text-sm mb-8">
                      <thead className="border-b border-slate-100 text-slate-400 font-medium text-xs uppercase tracking-wider">
                        <tr>
                          <th className="py-3 text-left">Item</th>
                          <th className="py-3 text-center">Qty</th>
                          <th className="py-3 text-right">Price</th>
                          <th className="py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {dummyOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3 font-medium text-slate-800">
                              {item.name}
                            </td>
                            <td className="py-3 text-center text-slate-500">
                              x{item.quantity}
                            </td>
                            <td className="py-3 text-right text-slate-500">
                              {item.price}
                            </td>
                            <td className="py-3 text-right font-bold text-slate-900">
                              {item.total}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="flex justify-end border-t border-slate-100 pt-6">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="font-bold">
                            {dummyOrder.subtotal}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Delivery</span>
                          <span className="font-bold">
                            {dummyOrder.delivery}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-black bg-slate-900 text-white p-4 rounded-lg mt-4 shadow-lg">
                          <span>Total</span>
                          <span>{dummyOrder.total}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-10 flex justify-between items-end">
                      {config.invoiceDetails.showSignature && (
                        <div className="text-center pt-2 border-t border-slate-200 w-32">
                          <p className="text-[10px] uppercase font-bold text-slate-400">
                            Authorized By
                          </p>
                        </div>
                      )}
                      {config.invoiceDetails.showQr && (
                        <div className="flex flex-col items-center gap-1">
                          <QRCodeSVG value={dummyOrder.orderId} size={80} />
                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                            Order Verification
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Theme: Minimal */}
                {config.invoiceTheme === "minimal" && (
                  <div className="text-center">
                    <h1 className="text-3xl font-light mb-2">
                      {settings?.shopName}
                    </h1>
                    <p className="text-sm text-slate-500 mb-8 lowercase tracking-wide">
                      receipt #{dummyOrder.orderId} • {dummyOrder.date}
                    </p>

                    <div className="border border-slate-200 rounded-lg p-6 mb-8 text-left">
                      {dummyOrder.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between py-2 border-b border-dashed border-slate-100 last:border-0"
                        >
                          <span className="font-medium">
                            {item.name}{" "}
                            <span className="text-slate-400 text-xs">
                              x{item.quantity}
                            </span>
                          </span>
                          <span>{item.total}</span>
                        </div>
                      ))}
                      <div className="flex justify-between py-2 font-bold pt-4 mt-2 border-t border-slate-200">
                        <span>Total</span>
                        <span>{dummyOrder.total}</span>
                      </div>
                    </div>

                    <div className="flex justify-center flex-col items-center gap-4">
                      {config.invoiceDetails.showQr && (
                        <QRCodeSVG value={dummyOrder.orderId} size={64} />
                      )}
                      <p className="text-xs text-slate-400">
                        Thank you for your business
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
