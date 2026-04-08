"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { readMenuCache, writeMenuCache } from "@/lib/menuCache";

export function ResourcePrefetcher() {
  const setMenuCache = useCartStore((state) => state.setMenuCache);
  const menuCacheAt = useCartStore((state) => state.menuCacheAt);

  useEffect(() => {
    const isMobile =
      typeof window !== "undefined" ? window.innerWidth < 768 : false;

    const prefetchMenuData = async () => {
      if (typeof window === "undefined") return;
      if (menuCacheAt && Date.now() - menuCacheAt < 10 * 60 * 1000) return;
      const domain = window.location.host;
      const cached = readMenuCache(domain);
      if (cached) {
        setMenuCache({
          domain: cached.domain,
          products: cached.products,
          categories: cached.categories,
          timestamp: cached.timestamp,
        });
        return;
      }
      try {
        const bootstrapLimit = isMobile ? 18 : 24;
        const res = await fetch(
          `/api/menu?domain=${encodeURIComponent(domain)}&bootstrap=1&limit=${bootstrapLimit}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!data?.products || !data?.categories) return;
        const payload = {
          domain: data.domain || domain,
          products: data.products,
          categories: data.categories,
          timestamp: Date.now(),
        };
        writeMenuCache(payload);
        setMenuCache(payload);
      } catch {
        // ignore
      }
    };

    const schedulePrefetch = () => {
      if (typeof window === "undefined") return;
      const run = () => {
        if ("requestIdleCallback" in window) {
          // requestIdleCallback is ideal for mobile: warm cache without affecting first paint.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).requestIdleCallback(prefetchMenuData, {
            timeout: isMobile ? 2500 : 3200,
          });
          return;
        }
        setTimeout(prefetchMenuData, isMobile ? 1500 : 2800);
      };

      if (document.readyState === "complete") {
        run();
        return;
      }

      const onLoad = () => {
        window.removeEventListener("load", onLoad);
        run();
      };

      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    };

    const cleanup = schedulePrefetch();

    // 2. Preload Heavy Assets (Images)
    const preloadAssets = () => {
      const assets = [
        "/mascot-avatar.png", // The "Crab Image" / Mascot
        // Add other static assets here if needed
      ];

      assets.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
      console.log("🦀 Assets Preloaded:", assets);
    };

    // Use requestIdleCallback for assets to not block main thread
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).requestIdleCallback(preloadAssets);
    } else {
      setTimeout(preloadAssets, 4000);
    }

    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [menuCacheAt, setMenuCache]);

  return null; // This component handles side-effects only
}
