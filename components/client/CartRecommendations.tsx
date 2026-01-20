'use client';

import { useEffect, useState } from 'react';
import { getRecommendedProducts } from '@/app/actions/recommendations';
import { useCartStore } from '@/lib/store';
import useEmblaCarousel from 'embla-carousel-react';
import { ProductCard } from './ProductCard';

export function CartRecommendations() {
    const { items } = useCartStore();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [emblaRef] = useEmblaCarousel({ align: 'start', containScroll: 'trimSnaps' });

    useEffect(() => {
        const fetchRecs = async () => {
            const excludeIds = items.map(i => i.id);
            const data = await getRecommendedProducts(excludeIds, 8);
            setRecommendations(data);
            setLoading(false);
        };
        fetchRecs();
    }, [items.length]);

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
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
