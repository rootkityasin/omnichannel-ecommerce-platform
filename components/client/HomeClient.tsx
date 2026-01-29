'use client';

import { HeroCarousel } from '@/components/client/HeroCarousel';
import { CategoryNav } from '@/components/client/CategoryNav';
import TrustFooter from '@/components/client/TrustFooter';
import { ScrollMouse } from '@/components/shared/ScrollMouse';
import { ResourcePrefetcher } from '@/components/client/ResourcePrefetcher';

interface HomeClientProps {
    heroSlides: any[];
    config: any;
    categories: any[];
    children?: React.ReactNode;
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

            {/* Trust Footer */}
            <TrustFooter config={config} />
        </main>
    );
}
