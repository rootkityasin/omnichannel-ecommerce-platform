"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type MetaPixelProps = {
  pixelId?: string | null;
};

export function MetaPixel({ pixelId }: MetaPixelProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pixelId) return;
    const trackPageView = () => {
      if (typeof window === "undefined") return;
      const fbq = (window as { fbq?: (...args: unknown[]) => void }).fbq;
      if (typeof fbq === "function") {
        fbq("track", "PageView");
      }
    };

    const timeoutId = window.setTimeout(trackPageView, 300);
    return () => window.clearTimeout(timeoutId);
  }, [pixelId, pathname, searchParams]);

  return null;
}
