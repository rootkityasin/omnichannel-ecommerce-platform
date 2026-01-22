import { StoryLayout } from '@/components/client/Story/StoryLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Our Story | CrabKhai',
    description: 'Discover the journey of CrabKhai - from humble beginnings to becoming Bangladesh\'s premier crab delivery service. Experience our story through stunning animations and interactive scrollytelling.',
};

import { getStorySections, getProductsByIds } from '@/app/actions/story';

export default async function StoryPage() {
    const sections = await getStorySections();

    // Helper to find content by type
    const getContent = (type: string) => sections.find((s: any) => s.type === type)?.content as any || null;

    const productsContent = getContent('PRODUCTS');
    const products = productsContent?.productIds ? await getProductsByIds(productsContent.productIds) : [];

    const storyData = {
        hero: getContent('HERO'),
        values: getContent('VALUES'),
        productsContent: productsContent,
        gallery: getContent('GALLERY'),
        team: getContent('TEAM'),
        wholesale: getContent('WHOLESALE'),
        reviews: getContent('REVIEWS'),
    };

    return (
        <main>
            <StoryLayout data={storyData} products={products} />
        </main>
    );
}
