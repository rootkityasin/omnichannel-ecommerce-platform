'use client';

import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import NextImage from 'next/image';
import { motion } from 'framer-motion';

import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';
import { HeroSlide } from '@/types/common';


export function HeroCarousel({ slides = [] }: { slides?: HeroSlide[] }) {
    // Memoize plugins to prevent re-initialization on every render
    const plugins = React.useMemo(() => [Autoplay({ delay: 5000, stopOnInteraction: false })], []);

    const displaySlides = slides;

    // Duration 60 makes the scroll transition slower and 'smoother' than the default snap
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 60 }, plugins);
    const { language } = useLanguageStore();
    const t = translations[language];
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const onSelect = React.useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    React.useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    // Return null if no slides are present (moved after hooks to satisfy rules-of-hooks)
    if (!slides || slides.length === 0) {
        return null;
    }

    return (
        <div className="relative overflow-hidden bg-gray-100 aspect-[4/3] md:aspect-[21/9]" ref={emblaRef}>
            <div className="flex h-full touch-pan-y">
                {displaySlides.map((slide, index) => (
                    <div className="relative flex-none w-full h-full min-w-0" key={slide.id}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />

                        {/* Ken Burns Effect / Parallax feel */}
                        <div className="w-full h-full overflow-hidden">
                            <motion.div
                                className="relative w-full h-full"
                                initial={{ scale: 1.05 }}
                                animate={{
                                    scale: isMobile ? 1 : (index === selectedIndex ? 1.15 : 1.05),
                                    x: isMobile ? 0 : (index === selectedIndex ? [-20, 0] : 0)
                                }}
                                transition={{
                                    scale: { duration: 8, ease: "linear" },
                                    x: { duration: 8, ease: "linear" }
                                }}
                            >
                                <NextImage
                                    src={slide.imageUrl}
                                    alt={slide.title}
                                    fill
                                    className="object-cover"
                                    priority={index === 0}
                                    sizes="100vw"
                                />
                            </motion.div>
                        </div>

                        <div className="absolute z-20 left-6 bottom-8 max-w-[80%] text-white">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{
                                    opacity: index === selectedIndex ? 1 : 0,
                                    y: index === selectedIndex ? 0 : 20
                                }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <span className={`inline-block px-3 py-1 rounded-sm bg-crab-red text-white text-[10px] uppercase tracking-widest font-bold mb-3 shadow-sm ${language !== 'en' ? 'font-bangla' : 'font-body'}`}>
                                    {language === 'en' ? (slide.subtitle || '') : (slide.subtitle_bn || slide.subtitle || '')}
                                </span>
                                <h2 className={`text-4xl font-heading font-bold leading-tight drop-shadow-lg mb-2 ${language !== 'en' ? 'font-bangla' : 'font-heading'}`}>
                                    {language === 'en' ? slide.title : (slide.title_bn || slide.title)}
                                </h2>
                                <Link href={slide.buttonLink || '/menu'}>
                                    <button className="text-xs font-bold uppercase tracking-widest border-b-2 border-white/80 pb-0.5 hover:text-sand hover:border-sand transition-colors">
                                        {/* Use slide specific button text if available, else standard translation */}
                                        {(language === 'en' && slide.buttonText) ? slide.buttonText : t.orderNow}
                                    </button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Glass-like Indicator */}
            <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-lg">
                {displaySlides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={`transition-all duration-300 rounded-full ${index === selectedIndex ? 'w-4 h-1.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

        </div>
    );
}
