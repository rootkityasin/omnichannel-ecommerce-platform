'use client';

import { HeroStory } from '@/components/client/Story/HeroStory';
import { ValuesSection } from '@/components/client/Story/ValuesSection';
import { GallerySection } from '@/components/client/Story/GallerySection';
import { WholesaleCTA } from '@/components/client/Story/WholesaleCTA';
import { ReviewSection } from '@/components/client/Story/ReviewSection';
import { TeamSection } from '@/components/client/Story/TeamSection';
import { StickyFooterWrapper } from '@/components/client/Story/StickyFooterWrapper';
import { StoryProducts } from '@/components/client/Story/StoryProducts';

 
interface StoryLayoutProps {
    data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hero: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        values: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        productsContent: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gallery: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        team: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wholesale: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reviews: any;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: any[];
}

export function StoryLayout({ data, products }: StoryLayoutProps) {
    return (
        <div className="relative bg-slate-950 min-h-screen overflow-x-hidden">
            <div id="story-section-hero">
                <HeroStory data={data.hero} />
            </div>

            <StickyFooterWrapper footer={null}>
                <div className="relative bg-slate-950 z-10 shadow-2xl">
                    <div id="story-section-values">
                        <ValuesSection data={data.values} />
                    </div>

                    <div id="story-section-products">
                        <StoryProducts data={data.productsContent} products={products} />
                    </div>

                    <div id="story-section-gallery">
                        <GallerySection data={data.gallery} />
                    </div>

                    <div id="story-section-team">
                        <TeamSection data={data.team} />
                    </div>

                    <div id="story-section-wholesale">
                        <WholesaleCTA data={data.wholesale} />
                    </div>

                    <div id="story-section-reviews">
                        <ReviewSection data={data.reviews} />
                    </div>
                </div>
            </StickyFooterWrapper>
        </div>
    );
}
