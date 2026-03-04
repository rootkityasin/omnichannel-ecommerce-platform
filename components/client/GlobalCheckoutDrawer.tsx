"use client";

import { useCartStore, CartItem } from "@/lib/store";
import { Loader2, X, Smartphone, CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { User } from "next-auth";

// Helper type for Translations
type TranslationsType = typeof translations.en;

// Helper for Extended User (until next-auth.d.ts is fully set up)
interface ExtendedUser extends Omit<User, "role"> {
  role?: string;
  phone?: string;
}
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrder, upsertIncompleteOrder } from "@/app/actions/order";
import { getStorySections } from "@/app/actions/story";
import { getPaymentConfig } from "@/app/actions/settings";
import { useLanguageStore } from "@/lib/languageStore";
import { translations } from "@/lib/translations";
import { CouponSection } from "./CouponSection";
import { trackEvent } from "@/lib/track";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { PaymentConfig, SiteConfig, CheckoutFormData, CartTexts } from "@/types/common";
import { useSettings } from "@/components/providers/SettingsProvider";

// --- Extracted Components ---

function CheckoutForm({
  formData,
  setFormData,
  handlePlaceOrder,
  errors = {},
}: Readonly<{
  formData: CheckoutFormData;
  setFormData: (data: CheckoutFormData) => void;
  handlePlaceOrder: (e: React.FormEvent) => void;
  errors?: Partial<Record<keyof CheckoutFormData, string>>;
}>) {
  return (
    <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-4">
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 border-b pb-2">
          Delivery Details
        </h3>
        <div className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Full Name"
              className={`w-full p-4 !bg-white border rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium text-[16px] !text-gray-900 placeholder:text-gray-400 ${errors.name ? "border-red-500" : "border-gray-200"}`}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full p-4 !bg-white border rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium text-[16px] !text-gray-900 placeholder:text-gray-400 ${errors.email ? "border-red-500" : "border-gray-200"}`}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <input
              type="tel"
              placeholder="Phone Number (01...)"
              className={`w-full p-4 !bg-white border rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium text-[16px] !text-gray-900 placeholder:text-gray-400 ${errors.phone ? "border-red-500" : "border-gray-200"}`}
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                {errors.phone}
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Select
                value={formData.area}
                onValueChange={(val) => setFormData({ ...formData, area: val })}
              >
                <SelectTrigger
                  className={`w-full h-[58px] !bg-white border rounded-xl focus:ring-crab-red/20 text-[16px] !text-gray-900 ${errors.area ? "border-red-500" : "border-gray-200"}`}
                >
                  <SelectValue placeholder="Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dhaka">Dhaka</SelectItem>
                  <SelectItem value="Barisal">Barisal</SelectItem>
                  <SelectItem value="Chittagong">Chittagong</SelectItem>
                  <SelectItem value="Khulna">Khulna</SelectItem>
                  <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                  <SelectItem value="Sylhet">Sylhet</SelectItem>
                  <SelectItem value="Rangpur">Rangpur</SelectItem>
                  <SelectItem value="Mymensingh">Mymensingh</SelectItem>
                </SelectContent>
              </Select>
              {errors.area && (
                <p className="text-red-500 text-[10px] mt-1 ml-1 font-medium">
                  {errors.area}
                </p>
              )}
            </div>
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Address"
                className={`w-full p-4 !bg-white border rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium text-[16px] !text-gray-900 placeholder:text-gray-400 ${errors.address ? "border-red-500" : "border-gray-200"}`}
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
              {errors.address && (
                <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                  {errors.address}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function PaymentMethodSection({ paymentConfig, totalAmount, deliveryFee, formData, setFormData }: {
  paymentConfig: PaymentConfig | null,
  totalAmount: number,
  deliveryFee: number,
  formData: CheckoutFormData,
  setFormData: (data: CheckoutFormData) => void
}) {
  if (!paymentConfig) return null;

  // Advance Payment Logic
  let advanceAmount = 0;
  if (paymentConfig.advancePaymentEnabled) {
    const type = paymentConfig.advancePaymentType;
    const value = Number(paymentConfig.advancePaymentValue) || 0;

    if (type === "FULL") {
      advanceAmount = totalAmount;
    } else if (type === "DELIVERY_CHARGE") {
      advanceAmount = deliveryFee;
    } else if (type === "PERCENTAGE") {
      advanceAmount = Math.ceil((totalAmount * value) / 100);
    } else if (type === "FIXED") {
      advanceAmount = value;
    }
  }

  const remainingAmount = Math.max(0, totalAmount - advanceAmount);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="font-bold text-gray-900 border-b pb-2">
        Payment Summary
      </h3>

      {advanceAmount > 0 && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-blue-700 font-bold">Advance Payment Required</span>
              <span className="text-blue-800 font-black font-heading text-lg">৳{advanceAmount}</span>
            </div>
            <p className="text-xs text-blue-600">Please pay this amount to confirm your order.</p>
          </div>

          {/* MFS Instructions */}
          {(paymentConfig.selfMfsEnabled || paymentConfig.bkashEnabled || paymentConfig.nagadEnabled) && (
            <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-pink-600" />
                </div>
                <span className="font-bold text-slate-900">Payment Instructions</span>
              </div>

              <div className="text-sm text-slate-700 leading-relaxed">
                {paymentConfig.selfMfsInstruction || `Send ৳${advanceAmount} to our ${paymentConfig.selfMfsType || 'bKash/Nagad'} number: ${paymentConfig.selfMfsPhone || '01XXXXXXXXX'}`}
              </div>

              {paymentConfig.selfMfsPhone && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm font-medium text-slate-500">{paymentConfig.selfMfsType?.toUpperCase() || 'MFS'} Number</span>
                  <span className="font-bold text-slate-900 tracking-wider font-heading">{paymentConfig.selfMfsPhone}</span>
                </div>
              )}

              <div className="pt-2">
                <input
                  type="text"
                  placeholder="Enter Transaction ID"
                  required={advanceAmount > 0}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                  value={formData.transactionId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, transactionId: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        {remainingAmount > 0 ? (
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold">৳</div>
              <div>
                <p className="font-bold text-slate-900">Cash on Delivery</p>
                <p className="text-xs text-slate-500 text-left">Remaining ৳{remainingAmount} to be paid on delivery</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
        ) : (
          paymentConfig.codEnabled && !paymentConfig.advancePaymentEnabled && (
            <div className="flex items-center justify-between p-4 bg-white border-2 border-crab-red rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold">৳</div>
                <div>
                  <p className="font-bold text-slate-900">Cash on Delivery</p>
                  <p className="text-xs text-slate-500 text-left">Pay when you receive the order</p>
                </div>
              </div>
              <div className="w-5 h-5 rounded-full bg-crab-red flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

interface OrderSummaryProps {
  items: CartItem[];
  subTotalAmount: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
}

function OrderSummary({
  items,
  subTotalAmount,
  deliveryFee,
  discountAmount,
  totalAmount,
}: Readonly<OrderSummaryProps>) {
  return (
    <div className="space-y-4 h-full">
      <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 space-y-4 shadow-sm">
        <h3 className="font-bold text-gray-900 border-b border-orange-200 pb-2">
          Order Summary
        </h3>

        <div className="flex justify-between text-base">
          <span className="text-gray-600">Subtotal ({items.length} items)</span>
          <span className="font-black text-gray-900 font-heading">
            ৳{subTotalAmount}
          </span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="font-black text-gray-900 font-heading">
            ৳{deliveryFee}
          </span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-base text-green-600 font-bold">
            <span>Discount</span>
            <span className="font-heading">-৳{discountAmount}</span>
          </div>
        )}
        <div className="border-t border-orange-200 pt-3 flex justify-between text-xl font-black text-crab-red">
          <span>Total to Pay</span>
          <span className="font-heading">৳{totalAmount}</span>
        </div>
      </div>

      <div className="pt-2">
        <CouponSection />
      </div>
    </div>
  );
}

interface SuccessViewProps {
  cartTexts: CartTexts | null;
  successOrder: { id: string; total: number } | null;
  handleCloseSuccess: () => void;
  t: TranslationsType;
  formData: CheckoutFormData;
}

function SuccessView({
  cartTexts,
  successOrder,
  handleCloseSuccess,
  t,
  formData,
}: Readonly<SuccessViewProps>) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 animate-in fade-in zoom-in duration-300 min-h-[50vh]">
      <div className="w-48 h-48 md:w-64 md:h-64 mb-2 flex items-center justify-center overflow-hidden">
        <img
          src={cartTexts?.successImage || "/congrates_animation.gif"}
          alt="Order Confirmed"
          className="w-full h-full object-contain scale-105"
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900">
          {cartTexts?.successTitle || "Order Placed!"}
        </h2>
        <p className="text-gray-500 max-w-xs mx-auto">
          {cartTexts?.successMessage ||
            `We'll call you shortly at ${formData.phone}.`}
        </p>
      </div>

      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 w-full max-w-xs mx-auto mt-4 space-y-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Billing Information
          </h3>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{formData.name}</p>
            <p>{formData.email}</p>
            <p>{formData.phone}</p>
            <p>
              {formData.address}, {formData.area}
            </p>
          </div>
        </div>
        <div className="border-t border-slate-200 pt-3 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Order ID</span>
            <span className="font-mono font-bold text-gray-900 text-sm">
              {successOrder?.id}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-xs">Total Amount</span>
            <span className="font-black text-crab-red text-sm font-heading">
              ৳{successOrder?.total}
            </span>
          </div>
        </div>
      </div>

      <Button
        onClick={handleCloseSuccess}
        className="w-full max-w-xs h-12 bg-crab-red hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all mt-6"
      >
        {cartTexts?.backHome || t?.cartPage?.backHome || "Continue Shopping"}
      </Button>
      {successOrder?.id && (
        <Button
          asChild
          variant="outline"
          className="w-full max-w-xs h-11 border-slate-200 text-slate-700"
        >
          <a href={`/orders/receipt/${successOrder.id}`} target="_blank">
            Download Receipt
          </a>
        </Button>
      )}
    </div>
  );
}

function CheckoutButton({
  isAnimating,
  totalAmount,
}: Readonly<{ isAnimating: boolean; totalAmount: number }>) {
  return (
    <Button
      form="checkout-form"
      type="submit"
      disabled={isAnimating}
      className="w-full h-14 bg-crab-red hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-crab-red/20 active:scale-95 transition-all mt-6 font-heading"
      style={{ backgroundColor: "#E60000" }}
    >
      {isAnimating ? (
        <Loader2 className="animate-spin w-5 h-5" />
      ) : (
        `Place Order - ৳${totalAmount}`
      )}
    </Button>
  );
}

// --- Main Component ---

export function GlobalCheckoutDrawer() {
  const {
    checkoutOpen,
    closeCheckout,
    items,
    total,
    discount,
    clearCart,
    coupon,
  } = useCartStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);
  const { settings } = useSettings();

  const { language } = useLanguageStore();
  const t: TranslationsType =
    translations[language as keyof typeof translations] || translations.en;

  const [isInitializing, setIsInitializing] = useState(true);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);

  const [cartTexts, setCartTexts] = useState<CartTexts | null>(null);
  useEffect(() => {
    async function init() {
      // Load Texts
      const sections = await getStorySections();
      const cartSection = sections.find(
        (s: { type: string; content: unknown }) => s.type === "CART_TEXTS",
      );
      if (cartSection?.content) {
        setCartTexts(cartSection.content as CartTexts);
      }

      // Load Payment Config
      const pConfig = await getPaymentConfig();
      if (pConfig) setPaymentConfig(pConfig as PaymentConfig);
      setIsInitializing(false);
    }
    init();
  }, []);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { data: session } = useSession();
  const [formData, setFormData] = useState<CheckoutFormData>({
    name: "",
    email: session?.user?.email || "",
    phone: (session?.user as ExtendedUser)?.phone || "",
    area: "",
    address: "",
    transactionId: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof CheckoutFormData, string>>
  >({});


  useEffect(() => {
    const user = session?.user as ExtendedUser;
    if (user && user.role === "USER") {
      // Only auto-fill for customers
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev: CheckoutFormData) => ({
        ...prev,
        name: prev.name || user?.name || "",
        phone: prev.phone || user?.phone || "",
        email: prev.email || user?.email || "",
      }));
    }
  }, [session]);

  // Totals
  const subTotalAmount = total();
  const discountAmount = discount();
  const discountedTotal = Math.max(0, subTotalAmount - discountAmount);
  const deliveryFee = 60;
  const taxRate = settings?.taxPercentage || 0;
  const taxAmount = Math.ceil((discountedTotal * taxRate) / 100);
  const totalAmount = discountedTotal + deliveryFee + taxAmount;

  // Advance Payment Logic (Calculated for Action)
  let advanceAmount = 0;
  if (paymentConfig?.advancePaymentEnabled) {
    const type = paymentConfig.advancePaymentType;
    const value = Number(paymentConfig.advancePaymentValue) || 0;

    if (type === "FULL") {
      advanceAmount = totalAmount;
    } else if (type === "DELIVERY_CHARGE") {
      advanceAmount = deliveryFee;
    } else if (type === "PERCENTAGE") {
      advanceAmount = Math.ceil((totalAmount * value) / 100);
    } else if (type === "FIXED") {
      advanceAmount = value;
    }
  }

  const [successOrder, setSuccessOrder] = useState<{
    id: string;
    total: number;
  } | null>(null);

  // Track InitiateCheckout when drawer opens
  useEffect(() => {
    if (checkoutOpen && items.length > 0) {
      trackEvent({
        eventName: "InitiateCheckout",
        eventData: {
          content_ids: items.map((i) => i.id),
          contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          num_items: items.length,
          value: totalAmount,
          currency: "BDT",
        },
      });
    }
  }, [checkoutOpen]);

  // Track Incomplete Orders (Auto-Save Draft)
  useEffect(() => {
    if (
      !checkoutOpen ||
      items.length === 0 ||
      !formData.phone ||
      formData.phone.length < 3
    )
      return;

    const timeoutId = setTimeout(async () => {
      const orderData = {
        draftOrderId: draftOrderId || undefined,
        tenantId: settings?.tenantId,
        customerName: formData.name || "Guest",
        customerPhone: formData.phone,
        customerEmail: formData.email,
        customerAddress: `${formData.address}, ${formData.area}`,
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: totalAmount,
        couponCode: coupon?.code,
        discountAmount: discountAmount,
      };

      const res = await upsertIncompleteOrder(orderData);
      if (res.success && res.orderId && res.orderId !== draftOrderId) {
        setDraftOrderId(res.orderId);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [
    formData,
    items,
    totalAmount,
    checkoutOpen,
    draftOrderId,
    settings?.tenantId,
    coupon?.code,
    discountAmount,
  ]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnimating(true);
    setErrors({});

    // Client-side Validation
    const newErrors: Partial<Record<keyof CheckoutFormData, string>> = {};
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.phone?.trim()) newErrors.phone = "Phone is required";
    else if (!/^01[3-9]\d{8}$/.test(formData.phone.replaceAll(/\D/g, "")))
      newErrors.phone = "Invalid BD Phone Number (e.g., 017...)";
    if (!formData.email?.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email";
    if (!formData.area) newErrors.area = "Area is required";
    if (!formData.address?.trim()) newErrors.address = "Address is required";
    if (advanceAmount > 0 && !formData.transactionId?.trim()) newErrors.transactionId = "Transaction ID is required for advance payment";


    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsAnimating(false);
      toast.error("Please fix the highlighted errors");
      return;
    }

    const orderData = {
      draftOrderId: draftOrderId || undefined,
      tenantId: settings?.tenantId,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerEmail: formData.email,
      customerAddress: `${formData.address}, ${formData.area}`,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: totalAmount,
      couponCode: coupon?.code,
      discountAmount: discountAmount,
      paymentMethod: advanceAmount > 0 ? (paymentConfig?.selfMfsType || "MFS") : "COD",
      advancePaidAmount: advanceAmount,
      advancePaymentStatus: advanceAmount > 0 ? "PENDING_VERIFICATION" : "NOT_REQUIRED",
      transactionId: formData.transactionId || "",
    };

    const res = await createOrder(orderData);

    if (res.success) {
      // Server-Side Tracking: Purchase
      trackEvent({
        eventName: "Purchase",
        eventData: {
          content_ids: items.map((i) => i.id),
          contents: items.map((i) => ({ id: i.id, quantity: i.quantity })),
          num_items: items.length,
          value: totalAmount,
          currency: "BDT",
          order_id: res.orderId,
        },
        userData: {
          email: "",
          phone: formData.phone,
          name: formData.name,
          area: formData.area,
          city: "Dhaka",
        },
      });

      toast.success("Order placed successfully!");
      clearCart();
      setSuccessOrder({ id: res.orderId as string, total: totalAmount });
      setDraftOrderId(null);
      setIsAnimating(false);
      // Do NOT close immediately. Show success view.
    } else {
      toast.error(res.error || "Failed to place order");
      setIsAnimating(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessOrder(null);
    closeCheckout();
    // Maybe redirect to home or order history if available?
    // for now just close.
  };

  if (items.length === 0 && !successOrder) return null;

  if (isDesktop) {
    return (
      <Dialog
        open={checkoutOpen}
        onOpenChange={(open) =>
          !open && (successOrder ? handleCloseSuccess() : closeCheckout())
        }
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          {successOrder ? (
            <SuccessView
              cartTexts={cartTexts}
              successOrder={successOrder}
              handleCloseSuccess={handleCloseSuccess}
              t={t}
              formData={formData}
            />
          ) : (
            <>
              <DialogHeader className="relative">
                <DialogTitle className="text-3xl font-black text-slate-900">
                  Checkout
                </DialogTitle>
                <DialogDescription>
                  Review your order and enter delivery details to complete your
                  purchase.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                {/* Left: Form */}
                <div className="order-2 md:order-1">
                  <CheckoutForm
                    formData={formData}
                    setFormData={setFormData}
                    handlePlaceOrder={handlePlaceOrder}
                    errors={errors}
                  />
                  <PaymentMethodSection
                    paymentConfig={paymentConfig}
                    totalAmount={totalAmount}
                    deliveryFee={deliveryFee}
                    formData={formData}
                    setFormData={setFormData}
                  />
                  <div className="hidden md:block mt-6">
                    <CheckoutButton
                      isAnimating={isAnimating}
                      totalAmount={totalAmount}
                    />
                  </div>
                </div>

                {/* Right: Summary */}
                <div className="order-1 md:order-2">
                  <OrderSummary
                    items={items}
                    subTotalAmount={subTotalAmount}
                    deliveryFee={deliveryFee}
                    discountAmount={discountAmount}
                    totalAmount={totalAmount}
                  />
                  <div className="md:hidden mt-4">
                    <CheckoutButton
                      isAnimating={isAnimating}
                      totalAmount={totalAmount}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Full-screen fixed overlay (immune to keyboard viewport resize)
  return (
    <>
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ height: '100%' }}>
          {successOrder ? (
            <div className="w-full max-w-lg mx-auto bg-white py-8 overflow-y-auto flex-1">
              <SuccessView
                cartTexts={cartTexts}
                successOrder={successOrder}
                handleCloseSuccess={handleCloseSuccess}
                t={t}
                formData={formData}
              />
            </div>
          ) : (
            <>
              {/* Fixed Header */}
              <div className="border-b border-gray-100 pb-3 pt-4 bg-white flex-shrink-0 relative px-4">
                <h2 className="text-2xl font-black text-center text-slate-900">
                  Checkout
                </h2>
                <p className="text-center font-medium text-sm text-slate-500 mt-1">
                  Complete your order
                </p>
                <button
                  onClick={successOrder ? handleCloseSuccess : closeCheckout}
                  className="absolute right-4 top-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-50 focus:outline-none"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-6 pb-28">
                <OrderSummary
                  items={items}
                  subTotalAmount={subTotalAmount}
                  deliveryFee={deliveryFee}
                  discountAmount={discountAmount}
                  totalAmount={totalAmount}
                />
                <CheckoutForm
                  formData={formData}
                  setFormData={setFormData}
                  handlePlaceOrder={handlePlaceOrder}
                  errors={errors}
                />
              </div>

              {/* Sticky bottom button */}
              <div className="flex-shrink-0 p-4 bg-white border-t border-gray-100 safe-area-bottom">
                <CheckoutButton
                  isAnimating={isAnimating}
                  totalAmount={totalAmount}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
