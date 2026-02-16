'use client';

import { ProductCard } from './ProductCard';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Product } from '@/types/common';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef } from 'react';

interface ProductRailProps {
    title: string;
    products: Product[];
    viewAllLink?: string;
    enableScrollAnimation?: boolean;
}

export function ProductRail({ title, products, viewAllLink = '#', enableScrollAnimation = false }: ProductRailProps) {
    const containerRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 90%", "end 10%"]
    });

    // Gentle floating effect: starts with offset (40px) and moves left (-120px) for speed
    const rawX = useTransform(scrollYProgress, [0, 1], [40, -120]);
    const x = useSpring(rawX, { stiffness: 150, damping: 20, mass: 0.5 });

    return (
        <section ref={containerRef} className="py-8 md:py-16 relative overflow-hidden">
            {/* Soft decorative background element */}
            {!enableScrollAnimation && (
                <div className="absolute top-0 right-0 w-64 h-x64 bg-slate-100 rounded-full blur-3xl -z-10 opacity-30 pointer-events-none" />
            )}

            <div className="container mx-auto px-4 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            {title}
                            {!enableScrollAnimation && <span className="w-8 h-1 bg-crab-red rounded-full" />}
                        </h2>
                    </motion.div>

                    <Link href={viewAllLink} className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-900 text-xs font-black uppercase tracking-widest hover:bg-crab-red hover:text-white transition-all duration-300">
                        View All
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className={`overflow-x-auto pb-4 hide-scrollbar md:hidden ${enableScrollAnimation ? '' : 'snap-x'}`}>
                    <motion.div
                        className="flex gap-4 w-max"
                        style={{
                            x: enableScrollAnimation ? x : 0,
                            willChange: enableScrollAnimation ? 'transform' : 'auto'
                        }}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-10%" }} // Adjusted margin for mobile
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                    >
                        {products.map((product) => (
                            <motion.div
                                key={product.id}
                                className={`w-[160px] flex-none ${enableScrollAnimation ? '' : 'snap-start'}`}
                                variants={{
                                    hidden: { opacity: 0, x: 20 }, // Slide in from right slightly
                                    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
                                }}
                            >
                                <ProductCard
                                    id={product.id}
                                    name={product.name}
                                    price={String(product.price)}
                                    image={product.image || "/logo.svg"}
                                    name_bn={product.name_bn}
                                    price_bn={product.price_bn}
                                    nutritionImage={product.nutritionImage}
                                    cookingImage={product.cookingImage}
                                    nutrition={product.nutrition}
                                    cookingInstructions={product.cookingInstructions}
                                    pieces={product.pieces}
                                    totalSold={product.totalSold}
                                    weightOptions={product.weightOptions}
                                    images={product.images}
                                    isAvailable={product.isAvailable}
                                    servingSize={product.servingSize}
                                    weight={product.weight}
                                    stage={product.stage}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Desktop Grid via Staggered Motion */}
                <motion.div
                    className="hidden md:grid grid-cols-4 gap-6"
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={{
                        hidden: {},
                        show: {
                            transition: {
                                staggerChildren: 0.1
                            }
                        }
                    }}
                >
                    {products.map((product) => (
                        <ScrollRevealItem key={product.id}>
                            <ProductCard
                                id={product.id}
                                name={product.name}
                                price={String(product.price)}
                                image={product.image || "/logo.svg"}
                                name_bn={product.name_bn}
                                price_bn={product.price_bn}
                                nutritionImage={product.nutritionImage}
                                cookingImage={product.cookingImage}
                                nutrition={product.nutrition}
                                cookingInstructions={product.cookingInstructions}
                                pieces={product.pieces}
                                totalSold={product.totalSold}
                                weightOptions={product.weightOptions}
                                images={product.images}
                                stage={product.stage}
                                isAvailable={product.isAvailable}
                                servingSize={product.servingSize}
                                weight={product.weight}
                            />
                        </ScrollRevealItem>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

function ScrollRevealItem({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ willChange: "transform, opacity" }}
        >
            {children}
        </motion.div>
    );
}
