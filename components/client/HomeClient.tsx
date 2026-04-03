"use client";

import { HeroCarousel } from "@/components/client/HeroCarousel";
import { CategoryNav } from "@/components/client/CategoryNav";
import { ScrollMouse } from "@/components/shared/ScrollMouse";
import { ResourcePrefetcher } from "@/components/client/ResourcePrefetcher";
import { HomepageSoundButton } from "@/components/client/HomepageSoundButton";
import { HeroSlide, SiteConfig, Category } from "@/types/common";
import TrustFooter from "@/components/client/TrustFooter";
interface HomeClientProps {
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
  heroSlides,
  config,
  categories,
  categorySeoCopy,
  children,
}: HomeClientProps) {
  return (
    <main className="min-h-screen bg-slate-50 md:pb-0">
      {/* Background Prefetcher */}
      <ResourcePrefetcher />
      <HomepageSoundButton />

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

      {/* Content is now injected via children or rendered separately */}
      {children}

      {/* Trust Footer - Home Page Only */}
      <TrustFooter config={config} />
    </main>
  );
}
