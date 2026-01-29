'use client';

import { ScrollMouse } from '@/components/shared/ScrollMouse';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface HeroProps {
    data: {
        title: string;
        subtitle: string;
        estYear: string;
        mascotImage: string;
    } | null;
}

export function HeroStory({ data }: HeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

    const title = data?.title || "Our Story";
    const subtitle = data?.subtitle || "A journey of flavor, quality, and passion. Bringing Bangladesh's finest crabs to your table since 2023.";
    const estYear = data?.estYear || "Est. 2023";
    const mascotImage = data?.mascotImage || "/mascot/story-character.png";

    return (
        <div ref={containerRef} className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            {/* Parallax Background Crab */}
            <motion.div
                style={{ y, opacity }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
                <motion.img
                    src={mascotImage}
                    alt="CrabKhai Mascot"
                    className="w-64 h-64 md:w-96 md:h-96 object-contain opacity-10"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ willChange: "transform, opacity" }}
                />
            </motion.div>

            {/* Hero Content */}
            <motion.div
                style={{ scale }}
                className="relative z-10 text-center px-6"
            >
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="mb-4"
                >
                    <span className="text-crab-red text-lg font-semibold tracking-widest uppercase">{estYear}</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-crab-red via-orange-500 to-yellow-500 bg-clip-text text-transparent leading-tight"
                >
                    {title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="text-slate-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed px-4 whitespace-pre-wrap"
                >
                    {subtitle}
                </motion.p>
            </motion.div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
                <ScrollMouse />
            </div>
        </div>
    );
}
