"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Clock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { getActivePromo } from "@/app/actions/promo";

export default function PromoPopup() {
  const [isVisible, setIsVisible] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [promo, setPromo] = useState<any>(null);

  const loadPromo = async () => {
    try {
      const activePromo = await getActivePromo();
      if (activePromo) {
        // Check dismissal
        const dismissed = localStorage.getItem(
          `promo_dismissed_${activePromo.id}`,
        );
        const hasSeenPromo = localStorage.getItem("hasSeenPromo"); // Legacy check for migration

        if (!dismissed && !hasSeenPromo) {
          setPromo(activePromo);
          // Show after delay
          setTimeout(() => setIsVisible(true), 1500);
        }
      }
    } catch (error) {
      console.error("Failed to load promo", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate data fetching on mount
    loadPromo();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (promo) {
      localStorage.setItem(`promo_dismissed_${promo.id}`, "true");
    }
  };

  if (!promo) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
            className="relative w-full max-w-sm md:max-w-md rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* CLASSIC STYLE (White) */}
            {promo.style === "CLASSIC" && (
              <div className="bg-white">
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 z-10 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative h-56">
                  {promo.imageUrl && (
                    <img
                      src={promo.imageUrl}
                      alt={promo.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-4 left-6 right-6 text-white">
                    <h2 className="text-2xl font-bold mb-1 leading-tight">
                      {promo.title}
                    </h2>
                  </div>
                </div>

                <div className="p-6 pt-4 bg-white">
                  <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    {promo.description}
                  </p>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleDismiss}
                      variant="outline"
                      className="flex-1 border-slate-200"
                    >
                      Close
                    </Button>
                    <a href={promo.buttonLink || "/menu"} className="flex-1">
                      <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                        {promo.buttonText || "Check it out"}
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* DARK STYLE (Premium/Black) */}
            {(promo.style === "DARK" || !promo.style) && (
              <div className="relative w-full h-[400px] bg-gray-900 group">
                {/* Full Background Image */}
                {promo.imageUrl && (
                  <img
                    src={promo.imageUrl}
                    alt={promo.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                )}

                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent h-32" />

                {/* Close Button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors z-30 border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 z-20 text-center">
                  {/* Top Badge (Title) */}
                  <div className="absolute top-6 left-0 right-0 flex justify-center px-4">
                    <div className="inline-block px-4 py-1.5 bg-crab-red text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg animate-pulse border border-white/20">
                      {promo.title}
                    </div>
                  </div>

                  {/* Description */}
                  {promo.description && (
                    <div className="mb-4 text-gray-200 text-sm font-medium shadow-black drop-shadow-md">
                      {promo.description}
                    </div>
                  )}

                  {/* Price Section */}
                  {(promo.price || promo.originalPrice) && (
                    <div className="flex items-center justify-center gap-4 mb-6">
                      {promo.originalPrice && (
                        <span className="text-white/40 line-through text-sm decoration-2 font-bold decoration-white/30">
                          BDT {promo.originalPrice}
                        </span>
                      )}
                      {promo.price && (
                        <span
                          className="text-4xl font-black text-crab-red drop-shadow-lg font-heading"
                          style={{
                            textShadow: "0 2px 10px rgba(224, 79, 52, 0.5)",
                          }}
                        >
                          <span className="text-lg align-top opacity-80 mr-1">
                            BDT
                          </span>
                          {promo.price}
                        </span>
                      )}
                    </div>
                  )}

                  <a href={promo.buttonLink || "/menu"}>
                    <button className="w-full py-4 bg-white text-crab-red font-black uppercase tracking-widest rounded-xl shadow-xl active:scale-95 transition-all hover:bg-gray-100 flex items-center justify-center gap-2 group/btn">
                      <Clock className="w-4 h-4 group-hover/btn:animate-spin" />
                      {promo.buttonText || "Order Now"}
                    </button>
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
