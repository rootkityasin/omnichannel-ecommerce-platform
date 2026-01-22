import { Suspense } from 'react';
import { getHeroSlides } from '@/app/actions/hero';
import { getSiteConfig } from '@/app/actions/settings';
import { getCategories } from '@/app/actions/category';
import { HomeClient } from '@/components/client/HomeClient';
import { HomeSections } from '@/components/server/HomeSections';

export default async function HomePage() {
    // Fetch TOP FOLD data instantly
    // We do NOT wait for sections here to allow instant FCP
    const [heroSlides, config, categories] = await Promise.all([
        getHeroSlides(),
        getSiteConfig(),
        getCategories()
    ]);

    return (
        <HomeClient
            heroSlides={JSON.parse(JSON.stringify(heroSlides))}
            config={JSON.parse(JSON.stringify(config))}
            categories={JSON.parse(JSON.stringify(categories))}
        >
            <Suspense fallback={<SectionsLoading />}>
                <HomeSections />
            </Suspense>
        </HomeClient>
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
                            <div key={j} className="w-[160px] h-[240px] bg-slate-100 rounded-xl flex-none animate-pulse" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Ensure fresh data
