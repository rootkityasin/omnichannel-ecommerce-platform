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
  const [selectedWeight, setSelectedWeight] = useState<"1" | "2" | "3">("1");
  const [shippingArea, setShippingArea] = useState<"inside" | "outside" | "subcity">("inside");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; total: number } | null>(null);

  // Showcase Images State
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const showcaseImages = [
    "/media/tenants/crabkhai/uploads/2026/06/5a8003d3-4277-4296-b5d9-21adda0876c0/original.webp",
    "/media/tenants/crabkhai/uploads/2026/06/d8f43938-341d-4fd0-b60b-4a0dd83ea70b/original.webp",
  ];

  // Auto-slide images every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIdx((prev) => (prev === 1 ? 0 : prev + 1));
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
    "1": 1699,
    "2": 3199,
    "3": 4599,
  };

  const singleProductPrice = priceMap[selectedWeight];
  const productPrice = singleProductPrice * quantity;
  const deliveryFee = (selectedWeight === "2" || selectedWeight === "3") ? 0 : 100;
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
      if (selectedWeight === "1") return nameLower.includes("1kg") || nameLower.includes("1 kg") || (!nameLower.includes("2") && !nameLower.includes("3"));
      if (selectedWeight === "2") return nameLower.includes("2kg") || nameLower.includes("2 kg");
      if (selectedWeight === "3") return nameLower.includes("3kg") || nameLower.includes("3 kg");
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
      comment: note,
      items: [
        {
          productId: targetProduct.id,
          quantity: quantity,
          price: singleProductPrice,
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
            contents: [{ id: targetProduct.id, quantity: quantity }],
            num_items: quantity,
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
    <div className="min-h-screen bg-white py-6 px-4 md:px-0 font-bangla flex flex-col items-center">
      {/* Decorative Ornaments / Background Image Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,43,60,0.05)_0%,rgba(255,255,255,1)_100%)] pointer-events-none" />

      {/* Main Container mimicking standard mobile viewport layout */}
      <div className="w-full max-w-[380px] md:max-w-[1170px] flex flex-col items-stretch justify-center relative z-10 space-y-6 md:space-y-12">
        
        {/* Title Block (Figma 1:1720) */}
        <div className="w-full text-center pb-2 pt-8 md:pt-12">
          <h1 className="text-[24px] md:text-[35px] font-bold leading-[36px] md:leading-[52.5px] text-black">
            CrabKhai এর &quot;খাই খাই বাকেট&quot;
          </h1>
        </div>

        {/* Subtitle Block (Figma 1:1726) */}
        <div className="w-full text-center pb-3">
          <p className="text-[20px] md:text-[28px] font-semibold leading-[30px] md:leading-[42px] text-black/80">
            CrabKhai এর প্রিমিয়াম খাই খাই বাকেট, প্রতিটি বাইটে সুন্দরবনের কাঁকড়ার অসাধারণ স্বাদ!
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
            className="bg-green-600 hover:bg-green-700 text-white font-bold text-[22px] rounded-[5px] w-[201.8px] h-[53px] flex items-center justify-center gap-2 border border-white/20 transition-all shadow-lg active:scale-95"
          >
            <span>🛒</span>
            অর্ডার করুন!
          </button>
        </div>

        {/* Responsive Grid for Hero Showcase and Specifications (Figma 1:2343) */}
        <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
          {/* Image Showcase Box (Figma 1:1738) */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="overflow-hidden relative group flex-1 flex flex-col justify-center rounded-[8px]">
              {/* Image Slider */}
              <div className="aspect-[325/365.6] md:aspect-[545/613.13] relative rounded-[8px] overflow-hidden flex items-center justify-center flex-1">
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
          <div className="w-full md:w-1/2 bg-crab-red p-[10px] rounded-[8px] shadow-[1px_1px_10px_0.5px_rgba(0,0,0,0.15)] flex flex-col justify-between">
            <div className="flex flex-col items-stretch w-full h-full justify-between">
              {/* Card Header (Figma 1:1754) */}
              <div className="bg-white w-full py-2.5 rounded-[8px] text-center font-bold text-[24px] text-black mb-4">
                প্রতি বালতিতে থাকছে:
              </div>

              {/* Spec List (Figma 1:1758) */}
              <div className="w-full space-y-2.5 mb-6 text-left flex-1 flex flex-col justify-center">
                {[
                  "প্রিমিয়াম রেডি-টু-ফ্রাই সফট শেল ক্র্যাব",
                  "নিশ্চিত FIFA প্লেয়ার কার্ড",
                  "৫% Discount Card (পরবর্তী অর্ডারের জন্য)",
                  "World Cup Jersey Lottery-তে অংশ নেওয়ার সুযোগ"
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center pb-2 border-b border-dashed border-white/40 last:border-b-0 w-full text-[18px]">
                    <span className="shrink-0 mr-3 text-[20px]">☑️</span>
                    <p className="text-white font-semibold">
                      {text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price and Stock Promos */}
              <div className="w-full text-white text-left space-y-2.5 mb-6 px-1">
                <p className="text-[17px] font-medium text-white/90">
                  যেটা আলাদা আলাদা কিনলে লাগবে{" "}
                  <span className="relative inline-block px-1">
                    ১,৭৪০
                    <span className="absolute inset-0 flex items-center justify-center text-[22px] pointer-events-none select-none">❌</span>
                  </span>{" "}
                  টাকা
                </p>
                <p className="text-[22px] font-bold text-yellow-300">মূল্য: ১,৬৯৯ টাকা</p>
                <p className="text-[15px] font-medium text-white/90 leading-[22px] pt-1">
                  স্টক সীমিত। আজই অর্ডার করুন এবং উপভোগ করুন সুন্দরবনের আসল কাঁকড়া।
                </p>
              </div>

              <div className="space-y-3 w-full">
                {/* Click to Call (Figma 1:1807) */}
                <div className="w-full flex justify-center pb-1">
                  <a
                    href={`tel:${initialSiteConfig?.contactPhone || "01804221161"}`}
                    className="bg-white hover:bg-slate-100 border-[3px] border-black rounded-[8px] w-[243.86px] h-[55px] flex items-center justify-center gap-2 font-bold text-black text-[18px] transition-all shadow-md active:scale-95"
                  >
                    <span>📞</span>
                    কল করে অর্ডার করুন!
                  </a>
                </div>

                {/* Click to WhatsApp (Figma 1:1814) */}
                <div className="w-full flex justify-center">
                  <a
                    href={`https://wa.me/${(initialSiteConfig?.contactPhone || "01804221161").replace(/[^0-9]/g, "").startsWith("88") ? (initialSiteConfig?.contactPhone || "01804221161").replace(/[^0-9]/g, "") : "88" + (initialSiteConfig?.contactPhone || "01804221161").replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white hover:bg-slate-100 border-[3px] border-black rounded-[8px] w-[178.55px] h-[55px] flex items-center justify-center gap-2 font-bold text-black text-[18px] transition-all shadow-md active:scale-95"
                  >
                    <span>💬</span>
                    হোয়াটসঅ্যাপ
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Grid for USPs and Promo Banner */}
        <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
          {/* Unique Selling Points Card (Figma 1:1822 clone) */}
          <div className="w-full md:w-1/2 bg-white p-[10px] rounded-[8px] shadow-[1px_1px_10px_0.5px_rgba(0,0,0,0.1)] flex flex-col justify-between items-stretch">
            <div>
              {/* Header Bar */}
              <div className="bg-crab-red w-full py-3.5 rounded-[8px] text-center font-bold text-[20px] leading-[28px] text-white">
                Crab প্রোডাক্ট কী কী আছে
              </div>

              {/* Product List Section */}
              <div className="px-2.5 py-4 space-y-3 text-left">
                {[
                  "২০০ গ্রাম মসলা ক্র্যাব বম্ব",
                  "২০০ গ্রাম ক্রিসপি ক্র্যাব বম্ব",
                  "২০০ গ্রাম মসলা ক্র্যাব উইংস",
                  "২০০ গ্রাম ক্রিসপি ক্র্যাব উইংস",
                  "২০০ গ্রাম ক্রিসপি টেম্পুরা শ্রিম্প"
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center py-2.5 border-b border-dashed border-slate-100 last:border-b-0 text-[18px] text-black">
                    <span className="text-crab-red mr-3 text-[20px]">🦀</span>
                    <p className="font-semibold">{text}</p>
                  </div>
                ))}

                {/* Total Weight Highlight */}
                <div className="mt-4 p-3 bg-crab-red/5 rounded-[6px] border border-crab-red/20 text-center font-bold text-[20px] text-crab-red">
                  Total 1kg softshell crab
                </div>
              </div>
            </div>

            {/* Button */}
            <div className="w-full flex justify-center pb-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("order-form-section");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold text-[18px] rounded-[5px] w-[176.94px] h-[49px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <span>🛒</span>
                অর্ডার করুন!
              </button>
            </div>
          </div>

          {/* Promotional Banner (Figma 1:1885 clone) */}
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
            <div className="w-full h-full rounded-[8px] overflow-hidden shadow-2xl border border-slate-100 bg-white flex items-center justify-center">
              <img
                src="/media/tenants/crabkhai/uploads/2026/06/5a8003d3-4277-4296-b5d9-21adda0876c0/original.webp"
                alt="CrabKhai Bucket Banner"
                className="w-full h-full object-cover select-none rounded-[8px]"
              />
            </div>
          </div>
        </div>

        {/* Why Order From Us Card (Figma 1:1891 clone) */}
        <div className="w-full bg-white p-[10px] rounded-[8px] shadow-[1px_1px_10px_0.5px_rgba(0,0,0,0.1)] flex flex-col items-stretch">
          {/* Header Bar */}
          <div className="bg-crab-red w-full py-2.5 rounded-[8px] text-center font-bold text-[20px] leading-[28px] text-white">
            CrabKhai থেকে কেন অর্ডার করবেন
          </div>

          {/* Bullet List */}
          <div className="px-2.5 py-4 space-y-4">
            {[
              "সুন্দরবনের তাজা কাঁকড়া",
              "প্রতিটি CrabKhai বাকেটে পাবেন কাঁকড়ার ভরপুর প্রোটিন ও অসাধারণ স্বাদ।",
              "কোনো কৃত্রিম ফ্লেভার বা ক্ষতিকারক প্রিজারভেটিভ ব্যবহার করা হয় না।",
              "সম্পূর্ণ স্বাস্থ্যসম্মত উপায়ে প্রতিটি খাই খাই বাকেট তৈরি হয় আমাদের নিজস্ব ফ্যাক্টরিতে।",
              "সর্বোচ্চ হাইজিন মেন্টেন করে আমাদের খাই খাই বাকেট গুলো তৈরি করা হয়।"
            ].map((text, idx) => (
              <div key={idx} className="flex items-start py-2.5 border-b border-slate-100 last:border-b-0 text-[18px] text-black">
                {/* Check icon in theme color */}
                <span className="text-crab-red mr-3 mt-1.5 shrink-0 font-extrabold text-[20px]">✓</span>
                <p className="leading-[26px] text-black font-semibold">{text}</p>
              </div>
            ))}
          </div>

          {/* Button */}
          <div className="w-full flex justify-center pb-2">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("order-form-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-[18px] rounded-[5px] w-[176.94px] h-[49px] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <span>🛒</span>
              অর্ডার করুন!
            </button>
          </div>
        </div>

        {/* Limited Time Offer Banner (Figma 1:2908 bottom segment) */}
        <div className="w-full bg-crab-red text-white py-3.5 text-center font-bold text-[22px] md:text-[28px] rounded-[6px] shadow-lg">
          সীমিত সময়ের অফার
        </div>

        {/* Checkout Form Section (Matching style and width of mobile viewport, centered on desktop) */}
        <div id="order-form-section" className="w-full max-w-[760px] mx-auto scroll-mt-6">
          <div className="bg-white p-4 rounded-[12px] shadow-2xl flex flex-col items-stretch space-y-6">
            
            {/* Header Title (Figma 1:1958) */}
            <div className="w-full text-center py-2">
              <h2 className="text-crab-red font-bold text-[24px] leading-[36px]">
                অর্ডার করতে নিচের ফর্মটি পূরণ করুন
              </h2>
            </div>

            {/* Red Badge Banner (Figma 1:1962) */}
            <div className="bg-crab-red/10 rounded-[8px] py-4 px-3 text-center flex flex-col items-center">
              <span className="bg-crab-red text-white font-bold px-4 py-1.5 rounded-full text-[12px] tracking-wide mb-1.5">
                PLACE YOUR ORDER
              </span>
              <p className="text-[12px] text-black/70 font-medium leading-[18px]">
                Secure checkout · Cash on Delivery · Nationwide delivery
              </p>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-6">
              {/* Basket Card (Figma 1:1970) */}
              <div className="space-y-3">
                {/* Section Header */}
                <div className="flex items-center gap-2 text-crab-red/90">
                  <span className="w-9 h-9 rounded-full bg-crab-red/10 flex items-center justify-center text-[18px] text-crab-red">🛒</span>
                  <h4 className="font-bold text-[18px] text-black">Your basket</h4>
                </div>

                {/* Variations Rows */}
                <div className="space-y-3">
                  {[
                    { val: "1", label: "1 Kg", price: 1699, tag: "Best Sell", img: "/media/tenants/crabkhai/uploads/2026/06/d8f43938-341d-4fd0-b60b-4a0dd83ea70b/original.webp" },
                    { val: "2", label: "2 Kg", price: 3199, tag: "ডেলিভারী ফ্রী", img: "/media/tenants/crabkhai/uploads/2026/06/5a8003d3-4277-4296-b5d9-21adda0876c0/original.webp" },
                    { val: "3", label: "3 Kg", price: 4599, tag: "ডেলিভারী ফ্রী", img: "/media/tenants/crabkhai/uploads/2026/06/d8f43938-341d-4fd0-b60b-4a0dd83ea70b/original.webp" },
                  ].map((item) => {
                    const isSelected = selectedWeight === item.val;
                    return (
                      <div
                        key={item.val}
                        onClick={() => setSelectedWeight(item.val as any)}
                        className={`relative p-3 rounded-[8px] border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-crab-red bg-crab-red/5 shadow-sm"
                            : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        {/* Highlights Badge */}
                        <span className="absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-crab-red/10 text-crab-red">
                          {item.tag}
                        </span>

                        <div className="flex items-center gap-3 mt-4">
                          {/* Image thumb */}
                          <div className="w-[80px] h-[80px] rounded-[6px] overflow-hidden border border-slate-100 shrink-0 bg-slate-100">
                            <img
                              src={item.img}
                              alt={item.label}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Info & Quantity controls */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-black text-[16px]">{item.label}</h5>
                            <p className="font-black text-crab-red text-[18px]">৳ {item.price}</p>
                            
                            {/* Quantity buttons */}
                            {isSelected && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center border border-slate-200 rounded-md h-7 w-[90px] overflow-hidden bg-white mt-1"
                              >
                                <button
                                  type="button"
                                  disabled={quantity <= 1}
                                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                                  className="w-7 h-full text-slate-500 font-bold hover:bg-slate-50 disabled:opacity-50"
                                >
                                  −
                                </button>
                                <span className="flex-1 text-center text-xs font-bold text-slate-700 select-none">
                                  {quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQuantity((prev) => prev + 1)}
                                  className="w-7 h-full text-slate-500 font-bold hover:bg-slate-50"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Check Indicator */}
                        <div className="shrink-0 mr-1">
                          {isSelected ? (
                            <span className="w-5 h-5 rounded-full bg-crab-red flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-white" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address Section (Figma 1:2054) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {/* Section Header */}
                <div className="flex items-center gap-2 text-crab-red/90">
                  <span className="w-9 h-9 rounded-full bg-crab-red/10 flex items-center justify-center text-[18px] text-crab-red">📍</span>
                  <h4 className="font-bold text-[18px] text-black">Delivery address</h4>
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1 text-left">
                    <Label htmlFor="name" className="text-sm font-bold text-black">আপনার নাম *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="আপনার নাম"
                      className={`h-12 rounded-[8px] text-base bg-slate-50 border-0 focus-visible:ring-crab-red text-black placeholder:text-slate-400 ${
                        formErrors.name ? "ring-2 ring-red-500" : ""
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500 font-medium">{formErrors.name}</p>
                    )}
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1 text-left">
                    <Label htmlFor="phone" className="text-sm font-bold text-black">আপনার মোবাইল নম্বর *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      type="tel"
                      className={`h-12 rounded-[8px] text-base bg-slate-50 border-0 focus-visible:ring-crab-red text-black placeholder:text-slate-400 ${
                        formErrors.phone ? "ring-2 ring-red-500" : ""
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-xs text-red-500 font-medium">{formErrors.phone}</p>
                    )}
                  </div>

                  {/* Address field */}
                  <div className="space-y-1 text-left">
                    <Label htmlFor="address" className="text-sm font-bold text-black">আপনার সম্পূর্ণ ঠিকানা *</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="বাসা / রোড / এলাকা, থানা, জেলা"
                      className={`h-12 rounded-[8px] text-base bg-slate-50 border-0 focus-visible:ring-crab-red text-black placeholder:text-slate-400 ${
                        formErrors.address ? "ring-2 ring-red-500" : ""
                      }`}
                    />
                    {formErrors.address && (
                      <p className="text-xs text-red-500 font-medium">{formErrors.address}</p>
                    )}
                  </div>

                  {/* Note/Comment field */}
                  <div className="space-y-1 text-left">
                    <Label htmlFor="note" className="text-sm font-bold text-black">আপনার মন্তব্য (optional)</Label>
                    <textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="অর্ডার অথবা ডেলিভারি সম্পকে মন্তব্য...."
                      className="w-full min-h-[80px] p-3 rounded-[8px] text-base bg-slate-50 border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crab-red text-black placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Speed Section (Figma 1:2091) */}
              <div className="space-y-3 pt-3 border-t border-dashed border-slate-100">
                {/* Section Header */}
                <div className="flex items-center gap-2 text-crab-red/90">
                  <span className="w-9 h-9 rounded-full bg-crab-red/10 flex items-center justify-center text-[18px] text-crab-red">🚚</span>
                  <h4 className="font-bold text-[18px] text-black">Delivery speed</h4>
                </div>

                <div className="space-y-2">
                  {[
                    { val: "inside", label: "ঢাকার ভিতর", fee: 100 },
                  ].map((option) => (
                    <label
                      key={option.val}
                      onClick={() => setShippingArea(option.val as any)}
                      className={`flex items-center justify-between p-3 rounded-[8px] border cursor-pointer transition-all ${
                        shippingArea === option.val
                          ? "border-crab-red bg-crab-red/5"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping_option"
                          checked={shippingArea === option.val}
                          readOnly
                          className="w-4 h-4 text-crab-red focus:ring-crab-red"
                        />
                        <span className="text-black font-semibold text-[16px]">{option.label}</span>
                      </div>
                      <span className="font-black text-crab-red text-[16px]">{option.fee} ৳</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Payment Section (Figma 1:2126) */}
              <div className="space-y-3 pt-3 border-t border-dashed border-slate-100">
                {/* Section Header */}
                <div className="flex items-center gap-2 text-crab-red/90">
                  <span className="w-9 h-9 rounded-full bg-crab-red/10 flex items-center justify-center text-[18px] text-crab-red">💳</span>
                  <h4 className="font-bold text-[18px] text-black">Payment</h4>
                </div>

                <div className="p-3.5 rounded-[8px] border border-crab-red bg-crab-red/5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      checked
                      readOnly
                      className="w-4 h-4 text-crab-red focus:ring-crab-red"
                    />
                    <span className="text-black font-bold text-[16px]">Cash On Delivery</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-7">পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন</p>
                </div>
              </div>

              {/* Order Summary & Submit Section (Figma 1:2150) */}
              <div className="space-y-4 pt-4 border-t border-dashed border-slate-100">
                <div className="p-4 rounded-xl bg-crab-red/10 text-crab-red space-y-3">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 pb-2 border-b border-crab-red/20">
                    <span className="text-[18px]">📝</span>
                    <h4 className="font-bold text-[18px] text-black">Order summary</h4>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-bold text-base">{productPrice} ৳</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Delivery</span>
                    <span className="font-bold text-base">{deliveryFee} ৳</span>
                  </div>
                  <div className="border-t border-crab-red/20 pt-3 flex justify-between items-center text-crab-red">
                    <span className="font-black text-base uppercase tracking-wider">TOTAL</span>
                    <span className="font-black text-[22px]">{totalAmount} ৳</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 bg-crab-red hover:bg-crab-red/90 text-white text-lg font-black rounded-xl shadow-xl shadow-crab-red/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" /> অর্ডার প্রসেস হচ্ছে...
                    </>
                  ) : (
                    <>
                      <span>🔒</span>
                      <span>PLACE ORDER · {totalAmount} ৳</span>
                    </>
                  )}
                </Button>

                {/* Footer security badges */}
                <div className="flex justify-center items-center gap-6 text-[12px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">🛡️ Secure checkout</span>
                  <span className="flex items-center gap-1">🤝 COD available</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
