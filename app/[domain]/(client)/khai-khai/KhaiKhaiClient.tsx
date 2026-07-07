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

  // Showcase Images State
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const showcaseImages = [
    "/images/khai-khai-bucket-1.png",
    "/images/khai-khai-bucket-2.png",
  ];

  // Auto-slide images every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIdx((prev) => (prev === 0 ? 1 : 0));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="min-h-screen bg-[#0c3620] py-6 px-4 md:px-0 font-bangla flex flex-col items-center">
      {/* Decorative Ornaments / Background Image Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(47,123,61,0.25)_0%,rgba(12,54,32,1)_100%)] pointer-events-none" />

      {/* Main Container mimicking standard mobile viewport layout */}
      <div className="w-full max-w-[380px] flex flex-col items-stretch justify-center relative z-10 space-y-6">
        
        {/* Title Block (Figma 1:1720) */}
        <div className="w-full text-center pb-2">
          <h1 className="text-[24px] font-bold leading-[36px] text-white">
            নিজস্ব ফ্যাক্টরিতে তৈরি &quot;খাই খাই বাকেট&quot;,<br />
            সারা বাংলাদেশে হোম ডেলিভারি দেওয়া হয়!!
          </h1>
        </div>

        {/* Subtitle Block (Figma 1:1726) */}
        <div className="w-full text-center pb-3">
          <p className="text-[20px] font-semibold leading-[30px] text-white/95">
            গঞ্জের মিষ্টি কোয়ালিটি খাই খাই বাকেট, প্রতিটি পিসে<br />
            দুধ এবং ক্ষীর এর স্বাদ!
          </p>
        </div>

        {/* Call to Action Button (Figma 1:1732) */}
        <div className="w-full flex justify-center pb-2">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("order-form-section");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="bg-[#0c3620] hover:bg-[#0c3620]/80 text-white font-bold text-[22px] rounded-[5px] w-[201.8px] h-[53px] flex items-center justify-center gap-2 border border-white/20 transition-all shadow-lg active:scale-95"
          >
            <span>🛒</span>
            অর্ডার করুন!
          </button>
        </div>

        {/* Image Showcase Box (Figma 1:1738) */}
        <div className="w-full bg-[#2f7b3d] p-[10px] rounded-[8px] shadow-[1px_1px_10px_0.5px_#094c15]">
          <div className="bg-[#0c3620] border border-white p-[5px] rounded-[8px] overflow-hidden relative group">
            {/* Image Slider */}
            <div className="aspect-[325/365.6] relative rounded-[6px] overflow-hidden flex items-center justify-center bg-slate-950">
              <img
                src={showcaseImages[activeImageIdx]}
                alt={`Khai Khai Bucket - ${activeImageIdx + 1}`}
                className="w-full h-full object-cover transition-all duration-700 ease-in-out select-none"
              />
              
              {/* Pagination Dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
                {showcaseImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all border border-white/20 ${
                      activeImageIdx === idx ? "bg-white scale-110" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Specifications Card (Figma 1:1750) */}
        <div className="w-full bg-[#2f7b3d] p-[10px] rounded-[8px] shadow-[1px_1px_10px_0.5px_#022208]">
          <div className="flex flex-col items-stretch w-full">
            {/* Card Header (Figma 1:1754) */}
            <div className="bg-[#0c3620] w-full py-2.5 rounded-[8px] text-center font-bold text-[24px] text-white mb-4">
              পণ্যের বিবরণ
            </div>

            {/* Spec List (Figma 1:1758) */}
            <div className="w-full space-y-2.5 mb-6 text-left">
              {[
                { label: "নাম:", val: "খাই খাই বাকেট" },
                { label: "ধরন:", val: "ক্ষীর, মালাই ও ঘীরের তৈরি ঐতিহ্যবাহী মিষ্টি" },
                { label: "স্বাদ:", val: "সুস্বাদু মালাই ও এলাচির সুবাসযুক্ত অপূর্ব মিষ্টি স্বাদ" },
                { label: "উপাদান:", val: "খাঁটি গরুর দুধের ছানা, ক্ষীর, মালাই, চিনি ও এলাচ" },
                { label: "পরিবেশন:", val: "সরাসরি খাওয়ার উপযোগী" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center pb-2 border-b border-dashed border-white/40 last:border-b-0 w-full text-[18px]">
                  <span className="w-4 h-4 rounded-full bg-[#0c3620] shrink-0 mr-3 flex items-center justify-center text-[10px] text-[#2f7b3d]">●</span>
                  <p className="text-white">
                    <span className="font-bold mr-1.5">{item.label}</span>
                    <span className="font-light">{item.val}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Click to Call (Figma 1:1807) */}
            <div className="w-full flex justify-center pb-3">
              <a
                href="tel:01337860236"
                className="bg-[#0c3620] hover:bg-[#0c3620]/90 border-[3px] border-white rounded-[8px] w-[243.86px] h-[55px] flex items-center justify-center gap-2 font-bold text-white text-[18px] transition-all shadow-md active:scale-95"
              >
                <span>📞</span>
                কল করে অর্ডার করুন!
              </a>
            </div>

            {/* Click to WhatsApp (Figma 1:1814) */}
            <div className="w-full flex justify-center">
              <a
                href="https://wa.me/8801337860236"
                target="_blank"
                rel="noreferrer"
                className="bg-[#0c3620] hover:bg-[#0c3620]/90 border-[3px] border-white rounded-[8px] w-[178.55px] h-[55px] flex items-center justify-center gap-2 font-bold text-white text-[18px] transition-all shadow-md active:scale-95"
              >
                <span>💬</span>
                হোয়াটসঅ্যাপ
              </a>
            </div>
          </div>
        </div>

        {/* Checkout Form Section (Matching style and width of mobile viewport) */}
        <div id="order-form-section" className="w-full scroll-mt-6">
          <Card className="border-0 shadow-2xl rounded-3xl bg-white overflow-hidden">
            <div className="bg-crab-red px-6 py-6 text-center text-white">
              <h2 className="text-xl font-black mb-1">অর্ডার করতে নিচের ফর্মটি পূরণ করুন</h2>
              <p className="text-white/80 text-xs">নিরাপদ ডেলিভারি ও ক্যাশ অন ডেলিভারি (হাতে পেয়ে টাকা পরিশোধ)</p>
            </div>

            <CardContent className="p-5 space-y-6">
              <form onSubmit={handleOrderSubmit} className="space-y-6">
                {/* Step 1: Weight Selection */}
                <div className="space-y-3">
                  <h3 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-crab-red/10 text-crab-red flex items-center justify-center text-xs font-bold">১</span>
                    পরিমাণ নির্বাচন করুন
                  </h3>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "0.5", label: "0.5 Kg", price: 500, tag: "Good Sell" },
                      { val: "1", label: "1 Kg", price: 850, tag: "Best Sell" },
                      { val: "2", label: "2 Kg", price: 1600, tag: "ফ্রী শিপিং" },
                    ].map((item) => (
                      <div
                        key={item.val}
                        onClick={() => setSelectedWeight(item.val as any)}
                        className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          selectedWeight === item.val
                            ? "border-crab-red bg-crab-red/5 ring-2 ring-crab-red/10"
                            : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <span className="absolute top-1 right-1 text-[8px] font-extrabold px-1 py-0.5 rounded-full bg-crab-red/10 text-crab-red scale-90 origin-top-right">
                          {item.tag}
                        </span>
                        <div className="space-y-0.5 mt-2">
                          <p className="font-black text-slate-900 text-sm">{item.label}</p>
                        </div>
                        <p className="text-base font-black text-crab-red mt-2">৳{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 2: Shipping details */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <h3 className="text-[16px] font-black text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-crab-red/10 text-crab-red flex items-center justify-center text-xs font-bold">২</span>
                    ডেলিভারি ঠিকানা ও তথ্য
                  </h3>

                  <div className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs font-bold text-slate-700">আপনার নাম *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="আপনার নাম লিখুন"
                        className={`h-11 rounded-lg text-sm ${formErrors.name ? "border-red-500" : ""}`}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs font-bold text-slate-700">মোবাইল নাম্বার *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="মোবাইল নাম্বার দিন"
                        type="tel"
                        className={`h-11 rounded-lg text-sm ${formErrors.phone ? "border-red-500" : ""}`}
                      />
                      {formErrors.phone && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {formErrors.phone}
                        </p>
                      )}
                    </div>

                    {/* Area selection */}
                    <div className="space-y-1">
                      <Label htmlFor="area" className="text-xs font-bold text-slate-700">ডেলিভারি এরিয়া *</Label>
                      <select
                        id="area"
                        value={shippingArea}
                        onChange={(e) => setShippingArea(e.target.value as any)}
                        className="w-full h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crab-red focus-visible:ring-offset-2"
                      >
                        <option value="inside">ঢাকার ভেতরে (৳৬০)</option>
                        <option value="outside">ঢাকার বাইরে (৳১২০)</option>
                      </select>
                    </div>

                    {/* Full Address */}
                    <div className="space-y-1">
                      <Label htmlFor="address" className="text-xs font-bold text-slate-700">পূর্ণাঙ্গ ঠিকানা *</Label>
                      <textarea
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="আপনার ঠিকানা (রোড, বাড়ি, এলাকা) লিখুন"
                        className={`w-full min-h-[70px] p-2.5 rounded-lg border border-input bg-transparent text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crab-red ${
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
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>পণ্য ({selectedWeight} Kg)</span>
                    <span className="font-bold">৳{productPrice}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="font-bold">
                      {selectedWeight === "2" ? "ফ্রী (০)" : `৳${deliveryFee}`}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 text-sm">সর্বমোট প্রদেয় মূল্য</span>
                    <span className="font-black text-crab-red text-xl font-heading">৳{totalAmount}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-crab-red hover:bg-crab-red/90 text-white text-base font-extrabold rounded-xl shadow-xl shadow-crab-red/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" /> অর্ডার প্রসেস হচ্ছে...
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
    </div>
  );
}
