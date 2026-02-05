'use client';

import { useEffect, useState } from 'react';
import { getRecommendedProducts } from '@/app/actions/recommendations';
import { useCartStore } from '@/lib/store';
import useEmblaCarousel from 'embla-carousel-react';
import { ProductCard } from './ProductCard';

export function CartRecommendations() {
    const { items, allProducts } = useCartStore();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [emblaRef] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });

    useEffect(() => {
        const getLoadedRecs = () => {
            const excludeIds = new Set(items.map(i => i.id));

            // Just use what is already loaded
            if (allProducts && allProducts.length > 0) {
                // Ensure unique by ID in case store has duplicates
                const uniqueAll = Array.from(new Map(allProducts.map(p => [p.id, p])).values());
                const available = uniqueAll.filter(p => !excludeIds.has(p.id));

                // Randomize and take 8
                const shuffled = [...available].sort(() => 0.5 - Math.random());
                setRecommendations(shuffled.slice(0, 8));
            }
            setLoading(false);
        };
        getLoadedRecs();
    }, [items.length, allProducts.length]);

    if (loading || recommendations.length === 0) return null;

    return (
        <div className="mt-12 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 font-heading px-4 md:px-0">Recommended for You</h3>

            <div className="overflow-hidden px-4 md:px-0" ref={emblaRef}>
                <div className="flex gap-4">
                    {recommendations.map((product) => (
                        <div key={product.id} className="flex-none w-[180px] md:w-[220px]">
                            <ProductCard
                                id={product.id}
                                name={product.name}
                                price={product.price}
                                image={product.image}
                                images={product.images}
                                pieces={product.pieces}
                                weightOptions={product.weightOptions}
                                weight={product.weight}
                                servingSize={product.servingSize}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
