'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface GalleryProps {
    data: Array<{ src: string; alt: string; rotate: number }> | null;
}

export function GallerySection({ data }: GalleryProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const defaultImages = [
        { src: '/story/lover.jpg', alt: 'Rainy Day Combo ❤️', rotate: -6 },
        { src: '/story/gallery_hq_1.jpg', alt: 'Fresh Catch 2026', rotate: 4 },
        { src: '/story/gallery_hq_2.jpg', alt: 'Pizza Flame & Crab', rotate: -3 },
        { src: '/story/gallery_hq_3.jpg', alt: 'We are in Feni', rotate: 5 },
    ];

    const galleryImages = (data && data.length > 0) ? data : defaultImages;

    const y = useTransform(scrollYProgress, [0, 1], [0, -20]);

    return (
        <section ref={containerRef} className="relative py-32 overflow-hidden bg-slate-900">
            <div className="max-w-7xl mx-auto px-6 mb-20 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-black text-white mb-6"
                >
                    Vibes & Good Times
                </motion.h2>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Capturing the journey, one delivery at a time.
                </p>
            </div>

            {/* 3D Scroll Container */}
            <motion.div
                style={{ y, willChange: 'transform' }}
                className="flex flex-wrap justify-center gap-8 md:gap-12 px-4"
            >
                {galleryImages.map((img, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.2) }}
                        whileHover={{
                            scale: 1.05,
                            rotate: 0,
                            zIndex: 10,
                            transition: { duration: 0.2 }
                        }}
                        style={{ rotate: img.rotate }}
                        className="relative group w-full max-w-xs md:max-w-sm aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/5 bg-slate-800"
                    >
                        <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                            <span className="text-white font-bold text-lg">{img.alt}</span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
