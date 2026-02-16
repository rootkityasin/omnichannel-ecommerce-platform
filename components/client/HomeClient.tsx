'use client';

import { HeroCarousel } from '@/components/client/HeroCarousel';
import { CategoryNav } from '@/components/client/CategoryNav';
import { ScrollMouse } from '@/components/shared/ScrollMouse';
import { ResourcePrefetcher } from '@/components/client/ResourcePrefetcher';
import { HeroSlide, SiteConfig, Category } from '@/types/common';
import TrustFooter from '@/components/client/TrustFooter';
interface HomeClientProps {
    readonly heroSlides: HeroSlide[];
    readonly config: SiteConfig;
    readonly categories: Category[];
    readonly children?: React.ReactNode;
}

export function HomeClient({ heroSlides, config, categories, children }: HomeClientProps) {
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
            <CategoryNav initialCategories={categories} />

            {/* Content is now injected via children or rendered separately */}
            {children}

            {/* Trust Footer - Home Page Only */}
            <TrustFooter config={config} />
        </main>
    );
}
