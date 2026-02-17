'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ResourcePrefetcher() {
    const router = useRouter();

    useEffect(() => {
        // 1. Prefetch Critical Routes (Menu & Account)
        // We delay slightly to let the main home page interactions settle
        const prefetchRoutes = () => {
            router.prefetch('/menu');
            router.prefetch('/account');
            console.log('🦀 Routes Prefetched: /menu, /account');
        };

        const routeTimer = setTimeout(prefetchRoutes, 2500);

        // 2. Preload Heavy Assets (Images)
        const preloadAssets = () => {
            const assets = [
                '/mascot-avatar.png', // The "Crab Image" / Mascot
                // Add other static assets here if needed
            ];

            assets.forEach((src) => {
                const img = new Image();
                img.src = src;
            });
            console.log('🦀 Assets Preloaded:', assets);
        };

        // Use requestIdleCallback for assets to not block main thread
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).requestIdleCallback(preloadAssets);
        } else {
            setTimeout(preloadAssets, 4000);
        }

        return () => clearTimeout(routeTimer);
    }, [router]);

    return null; // This component handles side-effects only
}
