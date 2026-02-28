"use client";

import { MapPin, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLanguageStore } from "@/lib/languageStore";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { useSettings } from "@/components/providers/SettingsProvider";

import { AnimatedSearchBar } from "./AnimatedSearchBar";
import { cn } from "@/lib/utils";
import { useGeolocation } from "@/lib/hooks/useGeolocation";

export function MobileHeader() {
  const [mounted, setMounted] = useState(false);
  const { settings } = useSettings();
  const config = settings;
  const cartItems = useCartStore((state) => state.items);
  const openCheckout = useCartStore((state) => state.openCheckout);
  const { language, toggleLanguage } = useLanguageStore();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Next.js hydration guard
    setMounted(true);
  }, []);

  const cartCount = mounted
    ? cartItems.reduce((acc, item) => acc + item.quantity, 0)
    : 0;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { getGeoLocation } = useGeolocation();

  const handleLocationClick = () => {
    getGeoLocation();
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 w-full transition-all duration-300",
          isSidebarOpen
            ? "z-[100] bg-transparent border-transparent shadow-none"
            : "z-50 bg-crab-red border-b border-white/10 shadow-md",
        )}
      >
        <div className="flex items-center justify-between px-4 h-16 text-white max-w-7xl mx-auto">
          {/* Left: Logo Area */}
          <div className="flex items-center gap-3">
            {/* Hamburger Trigger (Animated) */}
            <motion.button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="relative z-[110] p-1 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
              animate={isSidebarOpen ? "open" : "closed"}
              transition={{ duration: 0.2 }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.line
                  x1="4"
                  x2="20"
                  y1="6"
                  y2="6"
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: 45, y: 6 },
                  }}
                />
                <motion.line
                  x1="4"
                  x2="20"
                  y1="12"
                  y2="12"
                  variants={{
                    closed: { opacity: 1 },
                    open: { opacity: 0 },
                  }}
                />
                <motion.line
                  x1="4"
                  x2="20"
                  y1="18"
                  y2="18"
                  variants={{
                    closed: { rotate: 0, y: 0 },
                    open: { rotate: -45, y: -6 },
                  }}
                />
              </svg>
            </motion.button>

            <div
              className={cn(
                "flex items-center gap-3 transition-opacity duration-300",
                isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100",
              )}
            >
              <Link href="/" className="flex items-center gap-2">
                <img
                  src={config?.logoUrl || "/logo.svg"}
                  alt={config?.shopName || "Store"}
                  className="h-14 w-auto object-contain"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src.endsWith("/logo.svg")) return;
                    target.src = "/logo.svg";
                  }}
                />
              </Link>
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className={`ml-1 px-2 py-1 rounded border border-white/20 text-[10px] font-bold tracking-wider hover:bg-white/10 transition-colors ${language !== "en" ? "font-bangla" : "font-body"}`}
              >
                {language === "en" && "EN"}
                {language === "bn" && "বাংলা"}
                {language === "ctg" && "চাটগাঁ"}
                {language === "noa" && "নোয়াখালী"}
                {language === "bar" && "বরিশাইলা"}
              </button>
            </div>
          </div>

          {/* Right: Icons (Search, Pin, Cart, User) */}
          <div
            className={cn(
              "flex items-center gap-3 transition-opacity duration-300",
              isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100",
            )}
          >
            <AnimatedSearchBar
              width="w-48"
              className="bg-transparent hover:bg-white/10"
              iconColor="text-white"
            />
            <button
              onClick={() => useCartStore.getState().openCart()}
              className="relative p-1 text-white"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-crab-red text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={handleLocationClick}
              className="p-1 text-white hover:text-green-400"
            >
              <MapPin className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar / Hamburger Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-slate-950 z-[70] shadow-2xl px-6 pb-6 pt-24 flex flex-col"
            >
              <nav className="space-y-6">
                {[
                  { href: "/", label: "HOME", color: "text-white" },
                  { href: "/menu", label: "MENU", color: "text-white" },
                  {
                    href: "/cart?action=checkout",
                    label: "CHECKOUT",
                    color: "text-orange-400",
                  },
                  {
                    href: "/story",
                    label: "OUR STORY",
                    color: "text-crab-red",
                  },
                  { href: "/account", label: "ACCOUNT", color: "text-white" },
                ].map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={`block text-2xl font-black hover:text-crab-red transition-colors ${item.color}`}
                      onClick={(e) => {
                        if (item.label === "CHECKOUT") {
                          e.preventDefault();
                          openCheckout();
                        }
                        setIsSidebarOpen(false);
                      }}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
