"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Star, ShoppingBag, Phone, MapPin, Truck, AlertCircle, Loader2 } from "lucide-react";
import { createOrder } from "@/app/actions/order";
import { toast } from "sonner";
import { trackEvent } from "@/lib/track";

type Product = {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  sku: string;
  weight?: number;
};

type KhaiKhaiClientProps = {
  initialPaymentConfig: any;
  initialDeliveryConfig: any;
  initialSiteConfig: any;
  products: Product[];
  domain: string;
};

export default function KhaiKhaiClient({
  initialPaymentConfig,
  initialDeliveryConfig,
  initialSiteConfig,
  products,
  domain,
}: KhaiKhaiClientProps) {
  const [selectedWeight, setSelectedWeight] = useState<"0.5" | "1" | "2">("1");
  const [shippingArea, setShippingArea] = useState<"inside" | "outside">("inside");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; total: number } | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Resolve prices based on selected weight
  const priceMap = {
    "0.5": 500,
    "1": 850,
    "2": 1600,
  };

  const productPrice = priceMap[selectedWeight];
  const deliveryFee = selectedWeight === "2" ? 0 : (shippingArea === "inside" ? 60 : 120);
  const totalAmount = productPrice + deliveryFee;

  // Resolve DB Product ID
  const getTargetProduct = () => {
    if (!products || products.length === 0) return null;
    const khaiProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes("khai") ||
        p.name.toLowerCase().includes("bucket")
    );
    if (khaiProducts.length === 0) return products[0];

    // Try to match based on weight substring
    const match = khaiProducts.find((p) => {
      const nameLower = p.name.toLowerCase();
      if (selectedWeight === "0.5") return nameLower.includes("0.5") || nameLower.includes("500g");
      if (selectedWeight === "1") return nameLower.includes("1kg") || nameLower.includes("1 kg") || (!nameLower.includes("0.5") && !nameLower.includes("2"));
      if (selectedWeight === "2") return nameLower.includes("2kg") || nameLower.includes("2 kg");
      return false;
    });

    return match || khaiProducts[0];
  };

  const targetProduct = getTargetProduct();

  // Tracking
  useEffect(() => {
    if (targetProduct) {
      trackEvent({
        eventName: "ViewContent",
        eventData: {
          content_name: `Khai Khai Bucket - ${selectedWeight} Kg`,
          content_ids: [targetProduct.id],
          content_type: "product",
          value: productPrice,
          currency: "BDT",
        },
      });
    }
  }, [selectedWeight, targetProduct, productPrice]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "আপনার নাম লিখুন";
    if (!phone.trim()) {
      errors.phone = "মোবাইল নাম্বার লিখুন";
    } else if (!/^01[3-9]\d{8}$/.test(phone.trim())) {
      errors.phone = "সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন (যেমন: 017XXXXXXXX)";
    }
    if (!address.trim()) errors.address = "আপনার পূর্ণাঙ্গ ঠিকানা লিখুন";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("অনুগ্রহ করে ফর্মের তথ্যগুলো সঠিক উপায়ে পূরণ করুন।");
      return;
    }

    if (!targetProduct) {
      toast.error("দুঃখিত, বর্তমানে এই পণ্যটি অর্ডারের জন্য উপলব্ধ নেই।");
      return;
    }

    setIsSubmitting(true);
    const purchaseEventId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const orderData = {
      customerName: name,
      customerPhone: phone,
      customerAddress: address,
      items: [
        {
          productId: targetProduct.id,
          quantity: 1,
          price: productPrice,
        },
      ],
      totalAmount: totalAmount,
      tenantId: initialSiteConfig?.tenantId || targetProduct.sku.split("-")[0],
      source: "WEB" as const,
      paymentMethod: "COD",
      eventId: purchaseEventId,
    };

    try {
      const res = await createOrder(orderData);
      if (res.success) {
        trackEvent({
          eventName: "Purchase",
          eventId: purchaseEventId,
          eventData: {
            content_ids: [targetProduct.id],
            contents: [{ id: targetProduct.id, quantity: 1 }],
            num_items: 1,
            value: totalAmount,
            currency: "BDT",
            order_id: res.orderId,
          },
          userData: {
            phone: phone,
            name: name,
          },
          browserOnly: true,
        });

        toast.success("অর্ডারটি সফলভাবে সম্পন্ন হয়েছে!");
        setOrderSuccess({ id: res.orderId as string, total: totalAmount });
      } else {
        toast.error(res.error || "অর্ডার সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    } catch (error) {
      console.error("Order Submit Error:", error);
      toast.error("একটি ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-amber-50/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-8 text-center border-0 shadow-2xl rounded-3xl bg-white">
          <div className="w-32 h-32 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center text-green-500">
            <Check className="w-16 h-16 stroke-[3]" />
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-2">
            অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে!
          </h2>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            আমরা শীঘ্রই আপনার দেওয়া মোবাইল নাম্বার <strong>{phone}</strong>-এ কল করে অর্ডারটি নিশ্চিত করব।
          </p>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 w-full max-w-sm mx-auto mb-8 text-left space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                ডেলিভারি ঠিকানা
              </h3>
              <div className="mt-2 text-sm text-slate-700">
                <p className="font-bold text-slate-900">{name}</p>
                <p>{phone}</p>
                <p>{address}</p>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-3 space-y-1">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>অর্ডার আইডি</span>
                <span className="font-mono font-bold text-slate-900">{orderSuccess.id}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>পণ্য</span>
                <span className="font-bold text-slate-900">খাই খাই বাকেট ({selectedWeight} Kg)</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                <span className="font-bold text-slate-900 text-sm">সর্বমোট মূল্য</span>
                <span className="font-black text-crab-red text-lg">৳{orderSuccess.total}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                globalThis.location.href = "/";
              }}
              className="px-6 h-12 bg-crab-red hover:bg-crab-red/90 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-crab-red/30"
            >
              আরো কেনাকাটা করুন
            </Button>
            <Button
              variant="outline"
              asChild
              className="px-6 h-12 border-slate-200 text-slate-700 font-bold rounded-xl"
            >
              <a href={`/orders/receipt/${orderSuccess.id}`} target="_blank">
                রশিদ ডাউনলোড করুন
              </a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30">
      {/* Decorative Ornaments */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-crab-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header Section */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-crab-red/10 border border-crab-red/20 text-crab-red text-sm font-black mb-6 animate-pulse">
          <Star className="w-4 h-4 fill-current" />
          <span>১০০% খাঁটি ও ঐতিহ্যবাহী মিষ্টি</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight max-w-4xl mx-auto mb-6">
          খাঁটি ও সুস্বাদু <span className="text-crab-red">&quot;খাই খাই বাকেট&quot;</span>
          <br className="hidden md:inline" /> সারা বাংলাদেশে দ্রুত হোম ডেলিভারি!
        </h1>

        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
          আমাদের নিজস্ব ফ্যাক্টরিতে তৈরি প্রিমিয়াম খাই খাই বাকেট। প্রতিটি কামড়ে খাঁটি ক্ষীর, মালাই ও দুধের অপূর্ব সংমিশ্রণ যা আপনার মিষ্টির স্বাদকে নতুন মাত্রা দেবে!
        </p>

        <div className="flex justify-center gap-4 mb-12">
          <Button
            onClick={() => {
              const el = document.getElementById("order-form-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 h-14 bg-crab-red hover:bg-crab-red/90 text-white text-lg font-extrabold rounded-2xl shadow-xl shadow-crab-red/20 transform hover:-translate-y-0.5 transition-all"
          >
            অর্ডার করুন <ShoppingBag className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Gallery & Details Section */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Left: Product Image Showcase */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-0 shadow-xl rounded-3xl bg-slate-50 flex items-center justify-center p-6 min-h-[300px] md:min-h-[450px]">
            {/* Displaying Khai Khai Bucket text since we do not have an image path */}
            <div className="text-center p-8 space-y-4">
              <div className="text-8xl">🍨</div>
              <h3 className="text-2xl font-black text-crab-red">খাই খাই বাকেট</h3>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">PREMIUM SWEETS BUCKET</p>
            </div>
          </Card>

          {/* Core Trust Badges */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 text-center shadow-sm">
              <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">✓</div>
              <p className="text-xs font-black text-slate-800">১০০% স্বাস্থ্যসম্মত</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 text-center shadow-sm">
              <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">✓</div>
              <p className="text-xs font-black text-slate-800">খাঁটি গরুর দুধ</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 text-center shadow-sm">
              <div className="w-10 h-10 bg-crab-red/10 text-crab-red rounded-full flex items-center justify-center mx-auto mb-2 font-bold">✓</div>
              <p className="text-xs font-black text-slate-800">নিজস্ব উৎপাদন</p>
            </div>
          </div>
        </div>

        {/* Right: Specifications & Features */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 border-b pb-4">
              পণ্যের বিবরণ
            </h2>
            <div className="space-y-4 text-slate-700">
              <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">নাম</span>
                <span className="col-span-2 font-bold text-slate-900">খাই খাই বাকেট (Khai Khai Bucket)</span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">ধরন</span>
                <span className="col-span-2 text-slate-800">ক্ষীর, মালাই ও ঘীরের তৈরি ঐতিহ্যবাহী মিষ্টি</span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">স্বাদ</span>
                <span className="col-span-2 text-slate-800">সুস্বাদু মালাই ও এলাচির সুবাসযুক্ত অপূর্ব মিষ্টি স্বাদ</span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">উপাদান</span>
                <span className="col-span-2 text-slate-800">খাঁটি গরুর দুধের ছানা, ক্ষীর, মালাই, চিনি ও এলাচ</span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-500">পরিবেশন</span>
                <span className="col-span-2 text-slate-800">সরাসরি খাওয়ার উপযোগী</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-black text-slate-900 mb-4">
              কেন আমাদের খাই খাই বাকেট সেরা?
            </h3>
            <ul className="space-y-3">
              {[
                "খাঁটি গরুর দুধ, ক্ষীর ও মালাইয়ের নিখুঁত ও সমৃদ্ধ কারিগরী প্রসেস।",
                "প্রতিটি বাকেটে পাবেন শরীরের জন্য প্রয়োজনীয় ভরপুর পুষ্টিগুণ।",
                "সুন্দর ও চমৎকার প্যাকেজিং, যা উপহার দেওয়ার জন্য একদম সেরা ও মানানসই।",
                "সম্পূর্ণ স্বাস্থ্যসম্মত ও হাইজেনিক ফ্যাক্টরি প্রসেসে প্রস্তুতকৃত।",
                "কোনো প্রকার ক্ষতিকর রাসায়নিক বা প্রিজারভেটিভ ব্যবহার করা হয় না।",
              ].map((text, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Checkout Form Section */}
      <div id="order-form-section" className="max-w-4xl mx-auto px-4 py-16 scroll-mt-6">
        <Card className="border-0 shadow-2xl rounded-3xl bg-white overflow-hidden">
          <div className="bg-crab-red px-6 py-8 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-black mb-2">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h2>
            <p className="text-white/80 text-sm">নিরাপদ ডেলিভারি ও ক্যাশ অন ডেলিভারি (হাতে পেয়ে টাকা পরিশোধ করবেন)</p>
          </div>

          <CardContent className="p-6 md:p-10">
            <form onSubmit={handleOrderSubmit} className="space-y-8">
              {/* Step 1: Product Weight Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-crab-red/10 text-crab-red flex items-center justify-center text-xs font-bold">১</span>
                  পরিমাণ নির্বাচন করুন
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { val: "0.5", label: "0.5 Kg", price: 500, tag: "Good Sell" },
                    { val: "1", label: "1 Kg", price: 850, tag: "Best Sell" },
                    { val: "2", label: "2 Kg", price: 1600, tag: "ডেলিভারী ফ্রী" },
                  ].map((item) => (
                    <div
                      key={item.val}
                      onClick={() => setSelectedWeight(item.val as any)}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        selectedWeight === item.val
                          ? "border-crab-red bg-crab-red/5 ring-2 ring-crab-red/10"
                          : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <span className="absolute top-3 right-3 text-xs font-extrabold px-2 py-0.5 rounded-full bg-crab-red/10 text-crab-red">
                        {item.tag}
                      </span>
                      <div className="space-y-1">
                        <p className="font-black text-slate-900 text-lg">{item.label}</p>
                        <p className="text-slate-500 text-xs">খাই খাই বাকেট</p>
                      </div>
                      <p className="text-2xl font-black text-crab-red mt-4">৳{item.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Shipping details */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-crab-red/10 text-crab-red flex items-center justify-center text-xs font-bold">২</span>
                  ডেলিভারি ঠিকানা ও তথ্য
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold text-slate-700">আপনার নাম *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="আপনার নাম লিখুন"
                      className={`h-12 rounded-xl ${formErrors.name ? "border-red-500" : ""}`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Phone field */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-bold text-slate-700">মোবাইল নাম্বার *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="মোবাইল নাম্বার দিন"
                      type="tel"
                      className={`h-12 rounded-xl ${formErrors.phone ? "border-red-500" : ""}`}
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {formErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Area selection */}
                  <div className="space-y-2">
                    <Label htmlFor="area" className="font-bold text-slate-700">ডেলিভারি এরিয়া *</Label>
                    <select
                      id="area"
                      value={shippingArea}
                      onChange={(e) => setShippingArea(e.target.value as any)}
                      className="w-full h-12 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="inside">ঢাকার ভেতরে (৳৬০)</option>
                      <option value="outside">ঢাকার বাইরে (৳১২০)</option>
                    </select>
                  </div>

                  {/* Full Address field */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address" className="font-bold text-slate-700">পূর্ণাঙ্গ ঠিকানা *</Label>
                    <textarea
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="আপনার পূর্ণাঙ্গ ঠিকানা (রোড, বাড়ি, এলাকা, জেলা) লিখুন"
                      className={`w-full min-h-[80px] p-3 rounded-xl border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crab-red ${
                        formErrors.address ? "border-red-500" : ""
                      }`}
                    />
                    {formErrors.address && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> {formErrors.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Price & Summary Table */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-sm text-slate-600">
                  <span>পণ্য ({selectedWeight} Kg)</span>
                  <span className="font-bold">৳{productPrice}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-600">
                  <span>ডেলিভারি চার্জ</span>
                  <span className="font-bold">
                    {selectedWeight === "2" ? "ফ্রী (০)" : `৳${deliveryFee}`}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="font-extrabold text-slate-900">সর্বমোট প্রদেয় মূল্য</span>
                  <span className="font-black text-crab-red text-2xl font-heading">৳{totalAmount}</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-crab-red hover:bg-crab-red/90 text-white text-lg font-extrabold rounded-2xl shadow-xl shadow-crab-red/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" /> অর্ডার প্রসেস হচ্ছে...
                  </>
                ) : (
                  <>
                    অর্ডার নিশ্চিত করুন (৳{totalAmount})
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
