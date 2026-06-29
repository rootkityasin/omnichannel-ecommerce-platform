"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/track";

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
      
      const eventId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      if (typeof fbq === "function") {
        fbq("track", "PageView", {}, { eventID: eventId });
      }

      void trackEvent({
        eventName: "PageView",
        eventId: eventId,
      });
    };

    const timeoutId = window.setTimeout(trackPageView, 300);
    return () => window.clearTimeout(timeoutId);
  }, [pixelId, pathname, searchParams]);

  return null;
}
