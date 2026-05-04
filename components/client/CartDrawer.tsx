"use client";

import {
  motion,
  useAnimation,
  useDragControls,
  useMotionValue,
  useTransform,
  PanInfo,
} from "framer-motion";
import { useCartStore } from "@/lib/store";
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/components/providers/SettingsProvider";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CouponSection } from "@/components/client/CouponSection";
import { useLanguageStore } from "@/lib/languageStore";
import { translations } from "@/lib/translations";
import { getStorySections } from "@/app/actions/story";
import { formatQuantity } from "@/lib/format";
import { buildCloudinaryUrl } from "@/lib/cloudinary";

export function CartDrawer() {
  const { language } = useLanguageStore();
  const {
    items,
    removeItem,
    addItem,
    isOpen,
    closeCart,
    openCart,
    openCheckout,
    total,
    discount,
    finalTotal,
    coupon,
  } = useCartStore();
  const { settings } = useSettings();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cartTexts, setCartTexts] = useState<any>(null);

  const controls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0); // Track touch Y position
  const drawerControls = useAnimation();

  // Logic for variables
  const subTotal = total();
  const discountVal = discount();
  const finalVal = finalTotal();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    if (typeof window !== "undefined") {
      updateDimensions();
      // Initialize y to center to avoid jump on first render if no touch
      y.set(window.innerHeight / 2);
    }

    window.addEventListener("resize", updateDimensions);

    // Load cart texts for empty state
    const loadTexts = async () => {
      const sections = await getStorySections();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cartSection = sections.find((s: any) => s.type === "CART_TEXTS");
      if (cartSection?.content) {
        setCartTexts(cartSection.content);
      }
    };
    loadTexts();

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Liquid Curve Transformation
  // 1. Control Point X: Maps drag X position to bulge depth.
  // Range: x=0 (Open) to x=300 (or width).
  // Open (0): Flat (100). Moving (300): Bulged (0).
  const curveControlX = useTransform(x, [0, 300], [100, 0]);

  // 2. Control Point Y: Maps touch Y position to curve center percentage (0-100).
  const curveControlY = useTransform(y, (currentY) => {
    if (dimensions.height === 0) return 50;
    return (currentY / dimensions.height) * 100;
  });

  // Construct the path string dynamically
  // We use a slight spring physics on the path itself via the motion components,
  // but here we construct the raw 'd' value frame-by-frame.
  // Note: Framer Motion can animate the 'd' attribute if provided as a motion value?
  // Yes, but we need to combine two motion values (X and Y) into one string.
  // We use a custom transform for that.

  // Combine X and Y into path
  const pathD = useTransform(
    // We need to listen to both. useTransform can take an array.
    [curveControlX, curveControlY],
    ([cx, cy]) => {
      const safeCx = Number.isFinite(cx) ? cx : 100;
      const safeCy = Number.isFinite(cy) ? cy : 50;
      return `M 100 0 Q ${safeCx} ${safeCy} 100 100`;
    },
  );

  // Sync state with animation
  useEffect(() => {
    if (!mounted || dimensions.width === 0) return;

    if (isOpen) {
      drawerControls.start({ x: 0 });
    } else {
      drawerControls.start({ x: dimensions.width });
    }
  }, [isOpen, drawerControls, dimensions.width, mounted]);

  // Update Y on drag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDrag = (event: any, info: PanInfo) => {
    // info.point.y is absolute page coordinate.
    // We clamp it slightly to avoid edge weirdness if needed, but raw is usually fine.
    y.set(info.point.y);
  };

  // Handle drag end
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (event: any, info: PanInfo) => {
    const closeThreshold = 50;
    const openThreshold = 50;
    const velocityThreshold = 100;
    const velocity = info.velocity.x;

    if (isOpen) {
      if (velocity > velocityThreshold || info.offset.x > closeThreshold) {
        closeCart();
      } else {
        drawerControls.start({ x: 0 });
      }
    } else {
      if (velocity < -velocityThreshold || info.offset.x < -openThreshold) {
        openCart();
      } else {
        drawerControls.start({ x: dimensions.width });
      }
    }
  };

  function startDrag(event: React.PointerEvent) {
    if (pathname === "/cart") return;

    // Update Y immediately on touch start so the bulge jumps to finger
    y.set(event.clientY);

    controls.start(event, { snapToCursor: false });
  }

  if (!mounted) return null;

  const isCartPage = pathname === "/cart";

  return (
    <>
      {/* Edge Trigger - Invisible strip on the right */}
      {!isOpen && !isCartPage && (
        <div
          onPointerDown={startDrag}
          className="fixed top-0 right-0 h-full w-[30px] z-[998] touch-none"
          style={{ cursor: "grab" }}
        />
      )}

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <motion.div
        drag="x"
        dragControls={controls}
        dragDirectionLock // Critical for scrollable lists
        dragConstraints={{ left: 0 }} // Infinite right to ensure no wall is hit
        dragElastic={{ left: 0.05, right: 1 }}
        dragMomentum={false}
        onDragStart={() => drawerControls.stop()}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        initial={{ x: dimensions.width || 0 }}
        animate={drawerControls}
        // Jelly physics: Low damping, high stiffness for "wobbly" settle
        transition={{ type: "spring", damping: 20, stiffness: 300, mass: 0.8 }}
        className="fixed top-0 right-0 h-full w-[85vw] sm:w-full max-w-md bg-white shadow-2xl z-[1000] flex flex-col border-l border-white/20 touch-pan-y"
        style={{ x, touchAction: "pan-y" }}
      >
        {/* Liquid Curve SVG */}
        <div
          className="absolute top-0 bottom-0 left-[-50px] w-[50px] h-full pointer-events-none overflow-hidden"
          style={{ filter: "drop-shadow(-2px 0 2px rgba(0,0,0,0.05))" }} // Subtle depth
        >
          <svg
            className="w-full h-full fill-white"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            <motion.path d={pathD} />
          </svg>
        </div>

        {/* Header - Safe Drag Zone */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white/50 backdrop-blur-xl sticky top-0 z-10 touch-none">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-crab-red" />
            <h2 className="text-xl font-bold font-heading text-gray-900">
              Your Cart
            </h2>
            <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>
          <button
            onClick={closeCart}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:bg-red-600 hover:scale-110 active:scale-95"
          >
            <X className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto popup-scrollbar p-5 space-y-4 bg-slate-50/50">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-full max-w-[240px] aspect-square mb-6 flex items-center justify-center relative">
                <img
                  src={cartTexts?.emptyImage || "/empty_cart_animation.gif"}
                  alt="Empty Cart"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-gray-900 font-bold text-lg mb-1">
                {cartTexts?.emptyTitle ||
                  translations[language as keyof typeof translations]?.cartPage
                    ?.emptyTitle ||
                  "Your cart is empty"}
              </p>
              <p className="text-gray-500 text-sm mb-8 max-w-[200px] mx-auto font-medium">
                {cartTexts?.emptyMessage ||
                  translations[language as keyof typeof translations]?.cartPage
                    ?.emptyMessage}
              </p>
              <Link
                href="/menu"
                onClick={closeCart}
                className="inline-block px-8 py-3 bg-crab-red text-white font-bold text-sm rounded-xl shadow-lg hover:bg-red-600 transition-all active:scale-95"
              >
                {cartTexts?.browseMenu || "Browse Menu"}
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100/50"
              >
                {/* Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                  {item.image && (
                    <img
                      src={buildCloudinaryUrl(item.image, {
                        width: 160,
                        aspect: "1:1",
                        crop: "fill",
                        gravity: "auto",
                      })}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/logo.svg";
                      }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">
                      {item.name}
                      <span className="text-xs font-semibold text-gray-900 inline-flex whitespace-nowrap">
                        &nbsp;(
                        {settings.measurementUnit === "WEIGHT"
                          ? (() => {
                            const grams = settings.weightUnitValue || 200;
                            return grams >= 1000
                              ? `${(grams / 1000).toFixed(1)} kg`
                              : `${grams} g`;
                          })()
                          : "1 pcs"}
                        )
                      </span>
                    </h3>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-end">
                    <span className="font-black text-crab-red text-sm font-heading">
                      ৳{item.price * item.quantity}
                    </span>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-full px-1.5 py-1 border border-gray-100">
                      <button
                        onClick={() => {
                          if (item.quantity === 1) removeItem(item.id);
                          else addItem({ ...item, quantity: -1 });
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-sm border border-gray-200 text-gray-900 hover:text-red-500 active:scale-95 transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold min-w-[32px] text-center text-slate-900">
                        {formatQuantity(item.quantity, settings)}
                      </span>
                      <button
                        onClick={() => addItem({ ...item, quantity: 1 })}
                        className="w-6 h-6 flex items-center justify-center bg-gray-900 text-white rounded-full shadow-sm hover:bg-crab-red active:scale-95 transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-5 bg-white border-t border-gray-100 sticky bottom-0 z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            {/* Coupon Section */}
            <CouponSection />

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-gray-500 text-sm">
                <span>Subtotal</span>
                <span className="font-heading font-bold">৳{subTotal}</span>
              </div>

              {discountVal > 0 && (
                <div className="flex justify-between items-center text-green-600 text-sm font-medium">
                  <span>Discount {coupon?.code && `(${coupon.code})`}</span>
                  <span className="font-heading">-৳{discountVal}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-gray-900 font-bold">Total</span>
                <span className="text-xl font-black text-crab-red font-heading">
                  ৳{finalVal}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                closeCart();
                openCheckout();
              }}
              className="w-full py-4 bg-crab-red text-white font-bold text-lg rounded-xl shadow-lg hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Checkout Now{" "}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
