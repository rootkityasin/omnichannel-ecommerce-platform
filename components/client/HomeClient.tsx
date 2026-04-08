"use client";

import { useEffect, useState } from "react";
import { HeroCarousel } from "@/components/client/HeroCarousel";
import { CategoryNav } from "@/components/client/CategoryNav";
import { SectionList } from "@/components/client/SectionList";
import { ScrollMouse } from "@/components/shared/ScrollMouse";
import { ResourcePrefetcher } from "@/components/client/ResourcePrefetcher";
import { HeroSlide, SiteConfig, Category } from "@/types/common";
import TrustFooter from "@/components/client/TrustFooter";

interface HomeSection {
  id: string;
  slug: string;
  title: string;
  products: unknown[];
}

interface HomeClientProps {
  readonly domain: string;
  readonly heroSlides: HeroSlide[];
  readonly config: SiteConfig;
  readonly categories: Category[];
  readonly categorySeoCopy?: {
    topLabel: string;
    introText: string;
  };
  readonly children?: React.ReactNode;
}

export function HomeClient({
  domain,
  heroSlides,
  config,
  categories,
  categorySeoCopy,
}: HomeClientProps) {
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadSections = async () => {
      try {
        const response = await fetch(
          `/api/home-sections?domain=${encodeURIComponent(domain)}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        if (!controller.signal.aborted) {
          setSections(payload.sections || []);
        }
      } catch {
        // Ignore aborted fetch errors from route changes.
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSections(false);
        }
      }
    };

    const startAfterPaint = () => {
      if ("requestIdleCallback" in window) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).requestIdleCallback(loadSections, { timeout: 2500 });
      } else {
        setTimeout(loadSections, 700);
      }
    };

    startAfterPaint();
    return () => controller.abort();
  }, [domain]);

  return (
    <main className="min-h-screen bg-slate-50 md:pb-0">
      {/* Background Prefetcher */}
      <ResourcePrefetcher />

      <HeroCarousel slides={heroSlides} />

      {/* Scroll Indicator & Spacing - Desktop Only (Restored Position) */}
      <div className="hidden md:flex flex-col items-center pt-4 pb-24 bg-slate-50 relative z-20">
        <ScrollMouse theme="dark" />
      </div>

      {/* Categories */}
      <CategoryNav
        initialCategories={categories}
        topLabel={categorySeoCopy?.topLabel}
        introText={categorySeoCopy?.introText}
      />

      {isLoadingSections ? <SectionsLoading /> : <SectionList sections={sections} />}

      {/* Trust Footer - Home Page Only */}
      <TrustFooter config={config} />
    </main>
  );
}

function SectionsLoading() {
  return (
    <div className="space-y-12 py-8">
      {[1, 2].map((i) => (
        <div key={i} className="container mx-auto px-4 space-y-4">
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="w-[160px] h-[240px] bg-slate-100 rounded-xl flex-none animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
