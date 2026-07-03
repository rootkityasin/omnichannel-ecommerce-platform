"use client";

import { useState, useEffect } from "react";
import { X, Clock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { buildMediaUrl } from "@/lib/media";

interface PromoData {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  style?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  price?: string | null;
  originalPrice?: string | null;
  isActive: boolean;
}

interface PromoModalProps {
  promo: PromoData | null;
}

export function PromoModal({ promo }: PromoModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!promo?.isActive) return;

    // Suppress modal on product buy landing pages
    if (typeof window !== "undefined" && window.location.pathname.includes("/buy/")) {
      return;
    }

    const seenPromoId = localStorage.getItem("seenPromoId");
    if (seenPromoId !== promo.id) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [promo]);

  const handleClose = () => {
    setIsVisible(false);
    if (promo) {
      localStorage.setItem("seenPromoId", promo.id);
    }
  };

  const handleAction = () => {
    handleClose();
    if (promo?.buttonLink) {
      router.push(promo.buttonLink);
    }
  };

  if (!isVisible || !promo) return null;

  const isDarkMode = promo.style === "DARK";
  const isWhiteCard = promo.style === "WHITE";
  const promoImageUrl = buildMediaUrl(promo.imageUrl, {
    width: 900,
    aspect: "16:9",
    crop: "fill",
    gravity: "auto",
  });

  // ── WHITE CARD STYLE ──────────────────────────────────────────────────────
  // Legacy first popup design: structured card layout with image on top, text below.
  if (isWhiteCard) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div className="relative w-full max-w-xs bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:bg-red-600 hover:scale-110 active:scale-95"
          >
            <X className="w-4 h-4" strokeWidth={3} />
          </button>

          {/* Image Block */}
          {promoImageUrl && (
            <div className="w-full h-48 overflow-hidden bg-slate-100">
              <img
                src={promoImageUrl}
                alt={promo.title || "Promotion"}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content Block */}
          <div className="p-5 text-center">
            {promo.description && (
              <span className="inline-block px-3 py-1 bg-crab-red/10 text-crab-red text-[11px] font-bold uppercase tracking-widest rounded-full mb-3">
                {promo.description}
              </span>
            )}
            <h2 className="text-xl font-black text-slate-900 mb-1 leading-tight">
              {promo.title}
            </h2>

            {(promo.price || promo.originalPrice) && (
              <div className="flex items-center justify-center gap-3 my-3">
                {promo.originalPrice && (
                  <span className="text-slate-400 line-through text-sm">
                    ৳{promo.originalPrice}
                  </span>
                )}
                {promo.price && (
                  <span className="text-2xl font-black text-crab-red">
                    ৳{promo.price}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleAction}
              className="mt-3 w-full py-3 bg-crab-red text-white font-black uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all hover:opacity-90 flex items-center justify-center gap-2"
            >
              {promo.buttonText || "Order Now"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── CLASSIC / DARK STYLE ──────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div
        className={`relative w-full max-w-sm h-[340px] ${isDarkMode ? "bg-gray-900" : "bg-white"} rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 group`}
      >
        {/* Full Background Image */}
        {promoImageUrl && (
          <img
            src={promoImageUrl}
            alt={promo.title || "Promotion"}
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
        )}

        {/* Gradient Overlays */}
        <div className={`absolute inset-0 bg-gradient-to-t ${isDarkMode ? "from-black via-black/50" : "from-white via-white/80"} to-transparent`} />
        <div className={`absolute inset-0 bg-gradient-to-b ${isDarkMode ? "from-black/60" : "from-white/60"} to-transparent h-32`} />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:bg-red-600 hover:scale-110 active:scale-95"
        >
          <X className="w-4 h-4" strokeWidth={3} />
        </button>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 z-20 text-center">
          {/* Top Badge */}
          {promo.description && (
            <div className="absolute top-4 left-0 right-0 flex justify-center">
              <div className="inline-block px-4 py-1.5 bg-crab-red text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg animate-pulse border border-white/20">
                {promo.description}
              </div>
            </div>
          )}

          {/* Title */}
          {promo.title && (
            <h2 className={`text-2xl font-black ${isDarkMode ? "text-white" : "text-slate-900"} mb-2 drop-shadow-lg`}>
              {promo.title}
            </h2>
          )}

          {/* Bottom Section */}
          <div className="pb-2">
            {(promo.price || promo.originalPrice) && (
              <div className="flex items-center justify-center gap-4 mb-4">
                {promo.originalPrice && (
                  <span className={`${isDarkMode ? "text-white/40" : "text-slate-500/60"} line-through text-sm decoration-2`}>
                    BDT {promo.originalPrice}
                  </span>
                )}
                {promo.price && (
                  <span
                    className="text-4xl font-black text-crab-red drop-shadow-lg font-heading"
                    style={{ textShadow: "0 2px 10px rgba(224, 79, 52, 0.5)" }}
                  >
                    <span className="text-lg align-top opacity-80">BDT</span>{" "}
                    {promo.price}
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleAction}
              className={`w-full py-4 ${isDarkMode ? "bg-white text-crab-red" : "bg-crab-red text-white"} font-black uppercase tracking-widest rounded-xl shadow-xl active:scale-95 transition-all hover:opacity-90 flex items-center justify-center gap-2 group/btn`}
            >
              <Clock className="w-4 h-4 group-hover/btn:animate-spin" />
              {promo.buttonText || "Order Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
