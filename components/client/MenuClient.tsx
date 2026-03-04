"use client";

import { Suspense, useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Utensils,
  Flame,
  Fish,
  Award,
  Star,
  X,
  Filter,
} from "lucide-react";
import { ProductCard } from "@/components/client/ProductCard";
import { useCartStore } from "@/lib/store";
import { readMenuCache, writeMenuCache } from "@/lib/menuCache";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { cn } from "@/lib/utils";

// Helper to map icons
const getCategoryIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("live")) return Fish;
  if (n.includes("crab") && n.includes("masala")) return Flame;
  if (n.includes("spicy") || n.includes("bomb")) return Flame;
  if (n.includes("platter") || n.includes("combo")) return Utensils;
  if (n.includes("side") || n.includes("rice") || n.includes("bread"))
    return Star;
  if (n.includes("fry") || n.includes("fried")) return Award;
  return Utensils;
};

interface MenuClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialProducts: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialCategories: any[];
}

export function MenuClient({
  initialProducts,
  initialCategories,
}: MenuClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAllProducts = useCartStore((state) => state.setAllProducts);
  const setMenuCache = useCartStore((state) => state.setMenuCache);
  const menuProducts = useCartStore((state) => state.menuProducts);
  const menuCategories = useCartStore((state) => state.menuCategories);
  const menuDomain = useCartStore((state) => state.menuDomain);
  const menuCacheAt = useCartStore((state) => state.menuCacheAt);
  const cacheDomain = typeof window !== "undefined" ? window.location.host : "";
  const cachedMenu = useMemo(() => {
    return typeof window !== "undefined" ? readMenuCache(cacheDomain) : null;
  }, [cacheDomain]);
  const isCacheValid = Boolean(cachedMenu);
  const initialMenuProducts = isCacheValid
    ? (cachedMenu?.products as any[]) || []
    : menuProducts.length > 0 && menuDomain === cacheDomain
      ? (menuProducts as any[])
      : initialProducts || [];
  const initialMenuCategories = isCacheValid
    ? (cachedMenu?.categories as any[]) || []
    : menuCategories.length > 0 && menuDomain === cacheDomain
      ? (menuCategories as any[])
      : initialCategories || [];

  const [clientProducts, setClientProducts] = useState(initialMenuProducts);
  const [clientCategories, setClientCategories] = useState(
    initialMenuCategories,
  );

  // Add initialization lock to prevent infinite rendering loops
  const hasInitialized = useRef(false);

  // Populate global store with products for fast recommendations elsewhere
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    if (cachedMenu && isCacheValid) {
      setMenuCache({
        domain: cachedMenu.domain,
        products: cachedMenu.products as any[],
        categories: cachedMenu.categories as any[],
        timestamp: cachedMenu.timestamp,
      });
    } else if (initialProducts?.length > 0 && initialCategories?.length > 0) {
      const payload = {
        domain: cacheDomain,
        products: initialProducts,
        categories: initialCategories,
        timestamp: Date.now(),
      };
      writeMenuCache(payload);
      setMenuCache(payload);
    }
  }, [
    cachedMenu,
    isCacheValid,
    initialProducts,
    initialCategories,
    cacheDomain,
    setMenuCache,
  ]);

  useEffect(() => {
    if (clientProducts?.length > 0) {
      setAllProducts(clientProducts);
    }
  }, [clientProducts, setAllProducts]);

  const categoryId = searchParams.get("category") || "all";
  const filterId = searchParams.get("filter") || null;
  const sectionSlug = searchParams.get("section") || null;
  const initialSearch = searchParams.get("search") || "";

  const [activeCategory, setActiveCategory] = useState(categoryId);
  const [activeFilter, setActiveFilter] = useState<string | null>(filterId);
  const [activeSection, setActiveSection] = useState<string | null>(
    sectionSlug,
  );

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [displayCount, setDisplayCount] = useState(12);
  const [isMobile, setIsMobile] = useState(false);

  const categoriesList = useMemo(
    () => [
      { id: "all", name: "All Items", icon: Utensils },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...clientCategories.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: getCategoryIcon(c.name),
      })),
    ],
    [clientCategories],
  );

  const filteredItems = useMemo(() => {
    const items = clientProducts.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        activeCategory === "all" ? true : item.categoryId === activeCategory;

      let matchesFilter = true;
      if (activeFilter === "super-savings") {
        matchesFilter = item.type === "COMBO";
      }

      let matchesSection = true;
      if (activeSection) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        matchesSection = item.sections?.some(
          (s: any) => s.slug === activeSection,
        );
      }

      return (
        matchesSearch && matchesCategory && matchesFilter && matchesSection
      );
    });

    // Sorting
    if (activeFilter === "best-sellers") {
      items.sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
    } else if (activeFilter === "new-arrivals") {
      items.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    return items;
  }, [
    clientProducts,
    debouncedSearch,
    activeCategory,
    activeFilter,
    activeSection,
  ]);

  const displayedProducts = useMemo(() => {
    return filteredItems.slice(0, displayCount);
  }, [filteredItems, displayCount]);

  useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth < 768);
    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);
    return () => window.removeEventListener("resize", updateIsMobile);
  }, []);

  // Handle Load More on Scroll (mobile only)
  useEffect(() => {
    const handleScroll = () => {
      if (!isMobile) return;
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 500
      ) {
        if (displayCount < filteredItems.length) {
          setDisplayCount((prev) => prev + 8);
        }
      }
    };
    if (isMobile) {
      window.addEventListener("scroll", handleScroll);
    }
    return () => window.removeEventListener("scroll", handleScroll);
  }, [displayCount, filteredItems.length, isMobile]);

  // Reset display count and sync URL on filter change
  useEffect(() => {
    const initialCount = isMobile ? 12 : 24;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayCount(initialCount);

    // Sync URL shallowly
    const params = new URLSearchParams(window.location.search);
    if (activeCategory && activeCategory !== "all")
      params.set("category", activeCategory);
    else params.delete("category");

    if (activeFilter) params.set("filter", activeFilter);
    else params.delete("filter");

    if (activeSection) params.set("section", activeSection);
    else params.delete("section");

    if (debouncedSearch) params.set("search", debouncedSearch);
    else params.delete("search");

    const newPath = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(
      { ...window.history.state, as: newPath, url: newPath },
      "",
      newPath,
    );
  }, [debouncedSearch, activeCategory, activeFilter, activeSection, isMobile]);

  const updateQuery = (key: string, value: string) => {
    if (key === "category") setActiveCategory(value);
    if (key === "filter") setActiveFilter(value === "all" ? null : value);
    if (key === "section") setActiveSection(value === "all" ? null : value);
  };

  // Calculate counts for sidebar
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: clientProducts.length };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clientCategories.forEach((c: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      counts[c.id] = clientProducts.filter(
        (p: any) => p.categoryId === c.id,
      ).length;
    });
    return counts;
  }, [clientProducts, clientCategories]);

  return (
    <div className="bg-slate-50 min-h-screen pt-0 pb-32">
      {/* MOBILE: Sticky Header (Kept as is for mobile) */}
      <div className="md:hidden sticky top-[64px] z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 space-y-3 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <motion.h1
            initial={isMobile ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2"
          >
            THE MENU
          </motion.h1>

          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-crab-red transition-colors" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-crab-red/5 focus:border-crab-red transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar -mx-4 px-4 scroll-smooth">
          {categoriesList.map((cat) => {
            const isActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => updateQuery("category", cat.id)}
                className={cn(
                  "flex-none flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 border",
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-105 z-10"
                    : "bg-white text-slate-500 border-slate-100",
                )}
              >
                <Icon
                  className={cn(
                    "w-3 h-3",
                    isActive ? "text-amber-400" : "text-slate-400",
                  )}
                />
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          {/* DESKTOP SIDEBAR (Left Column) */}
          <div className="hidden md:block col-span-1 sticky top-28 space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
              THE MENU
            </h2>

            {/* Search Section */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-crab-red transition-colors duration-300" />
              <input
                type="text"
                placeholder="Search our menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-crab-red/10 focus:border-crab-red transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] font-medium placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Categories Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Categories
                </span>
                <div className="h-px bg-slate-100 flex-1" />
              </div>

              <nav className="space-y-1">
                {categoriesList.map((cat) => {
                  const isActive = activeCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => updateQuery("category", cat.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden",
                        isActive
                          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 translate-x-1"
                          : "text-slate-500 hover:bg-white hover:text-crab-red hover:shadow-[0_4px_20px_rgb(0,0,0,0.04)]",
                      )}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <Icon
                          className={cn(
                            "w-4 h-4 transition-colors duration-300",
                            isActive
                              ? "text-amber-400"
                              : "text-slate-400 group-hover:text-crab-red",
                          )}
                        />
                        <span className="tracking-wide">{cat.name}</span>
                      </div>

                      <span
                        className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full transition-all duration-300 relative z-10",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-crab-red",
                        )}
                      >
                        {categoryCounts[cat.id] || 0}
                      </span>

                      {/* Active Indicator Background */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* PRODUCT GRID (Right Column) */}
          <div className="col-span-1 md:col-span-3">
            {/* Page Title (Desktop only, since it's in sidebar for mobile header) */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {categoriesList.find((c) => c.id === activeCategory)?.name ||
                  "All Items"}
                <span className="ml-3 text-lg font-medium text-slate-400 font-body">
                  ({filteredItems.length} items)
                </span>
              </h2>
            </div>

            <AnimatePresence mode={isMobile ? "sync" : "wait"}>
              {displayedProducts.length > 0 ? (
                <motion.div
                  key={`${activeCategory}-${activeFilter}-${debouncedSearch}`}
                  initial={
                    isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 2 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={isMobile ? undefined : { opacity: 0, y: -2 }}
                  transition={
                    isMobile ? undefined : { duration: 0.1, ease: "easeOut" }
                  }
                  className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                  style={{ willChange: "transform, opacity" }}
                >
                  {displayedProducts.map((item) => (
                    <ProductCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      price={String(item.price)}
                      image={item.image}
                      name_bn={item.name_bn || item.name}
                      price_bn={item.price_bn || String(item.price)}
                      pieces={item.pieces}
                      totalSold={item.totalSold}
                      weightOptions={item.weightOptions}
                      images={item.images}
                      weight={item.weight}
                      servingSize={item.servingSize}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={
                    isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-32 text-center"
                >
                  <div className="relative mb-6">
                    <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center relative z-10">
                      <Search className="w-12 h-12 text-slate-300" />
                    </div>
                    {/* Pulsing rings */}
                    <div className="absolute inset-0 bg-slate-100/50 rounded-full animate-ping opacity-75 duration-1000" />
                    <div className="absolute -inset-4 bg-slate-50/50 rounded-full animate-pulse opacity-50 delay-75" />
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    No Matches Found
                  </h3>
                  <p className="text-slate-400 text-sm max-w-xs mx-auto mb-8 font-medium leading-relaxed">
                    We couldn&apos;t find any items matching your current
                    filters. Try adjusting your search keywords.
                  </p>

                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                      setActiveFilter(null);
                      setActiveSection(null);
                    }}
                    className="relative group px-8 py-3 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-105 transition-all overflow-hidden"
                  >
                    <span className="relative z-10">Clear All Filters</span>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="absolute inset-0 ring-2 ring-white/10 rounded-2xl group-hover:ring-white/30 transition-all" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Indicator */}
            {filteredItems.length > 0 && (
              <div className="mt-20 flex flex-col items-center gap-4">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  Showing {displayedProducts.length} of {filteredItems.length}{" "}
                  delicacies
                </div>
                {!isMobile && (
                  <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-crab-red"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(displayedProducts.length / filteredItems.length) * 100}%`,
                      }}
                    />
                  </div>
                )}
                {displayCount < filteredItems.length && (
                  <button
                    onClick={() =>
                      setDisplayCount((prev) => prev + (isMobile ? 8 : 12))
                    }
                    className="mt-4 px-6 py-2 text-xs font-black uppercase tracking-widest text-crab-red hover:bg-crab-red/5 rounded-xl transition-colors"
                  >
                    Tap to Load More
                  </button>
                )}
                {displayCount >= filteredItems.length && (
                  <div className="mt-8 text-slate-300 font-serif italic text-sm">
                    ~ That&apos;s all for now ~
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
