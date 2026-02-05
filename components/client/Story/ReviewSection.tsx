'use client';

import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

import { ReviewMoodModal } from '@/components/client/ReviewMoodModal';

interface ReviewProps {
    data: {
        featuredImage: string;
        gridImages: { id: number; src: string; alt: string }[];
        reviews: { id: number; name: string; rating: number; comment: string; date: string }[];
    } | null;
}

export function ReviewSection({ data }: ReviewProps) {
    const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);

    const featuredImage = data?.featuredImage || "/story/reviews/review_new.jpg";
    const gridImages = data?.gridImages || [
        { id: 1, src: '/story/reviews/review_3.jpg', alt: "Day 1 Review" },
        { id: 2, src: '/story/reviews/review_2.jpg', alt: "Day 2 Review" },
        { id: 3, src: '/story/reviews/review_1.jpg', alt: "Day 3 Review" }
    ];

    return (
        <section className="relative pt-24 pb-20 md:py-24 px-6 bg-slate-900">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Customer Stories</h2>
                    <p className="text-slate-400 text-lg">See what our community is saying</p>
                </div>

                {/* Featured Story: The Sorry Note */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto mb-16"
                >
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800">
                        <img
                            src={featuredImage || "https://placehold.co/800x400/1e293b/FFF?text=No+Featured+Image"}
                            alt="A heartfelt note from our team"
                            className="w-full h-auto object-contain"
                        />
                    </div>
                    <p className="text-center text-slate-400 mt-4 italic">The note that started it all...</p>
                </motion.div>

                {/* Customer Stories Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 justify-items-center">
                    {gridImages.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group relative aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-800"
                        >
                            <img
                                src={item.src || "https://placehold.co/400x600/1e293b/FFF?text=No+Image"}
                                alt={item.alt}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                    ))}
                </div>

                <div className="text-center">
                    <Button
                        size="lg"
                        variant="outline"
                        className="bg-transparent border-crab-red text-crab-red hover:bg-crab-red hover:text-white transition-all rounded-full"
                        onClick={() => setIsReviewFormOpen(true)}
                    >
                        Write a Review
                    </Button>
                </div>

                {/* Animated Review Modal */}
                <ReviewMoodModal
                    isOpen={isReviewFormOpen}
                    onClose={() => setIsReviewFormOpen(false)}
                    productId="story-page"
                />
            </div>
        </section>
    );
}
