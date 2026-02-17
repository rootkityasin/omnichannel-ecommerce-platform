'use client';


import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Fish,
    Flame,
    Utensils,
    Drumstick,
    Soup,
    Shell,
    Snowflake,
    Package,
    Gift,
    Waves,
    Pizza,
    Beef,
    Microwave,
    Coffee,
    Apple,
    Candy,
    Cookie,
    Egg,
    IceCream,
    Milk,
    Cherry,
    Croissant,
    Beer,
    Wine,
    Sandwich,
    Salad,
    Banana,
    Bean,
    Cake,
    Carrot,
    Citrus,
    CupSoda,
    Grape,
    Lollipop,
    Nut,
    Popcorn,
    Rabbit,
    Sprout,
    Wheat,
    Zap,
    Bird,
    Bone,
    GlassWater,
    Sparkles,
    Star,
    Heart,
    Truck,
    Store,
    ShoppingBag,
    Home,
    Timer,
    Smile,
    ChevronRight
} from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
    Fish, Flame, Utensils, Drumstick, Soup, Shell, Snowflake, Package, Gift, Waves, Pizza, Beef, Microwave, Coffee,
    Apple, Candy, Cookie, Egg, IceCream, Milk, Cherry, Croissant, Beer, Wine, Sandwich, Salad,
    Banana, Bean, Cake, Carrot, Citrus, CupSoda, Grape, Lollipop, Nut, Popcorn, Rabbit, Sprout, Wheat, Zap,
    Bird, Bone, GlassWater, Sparkles, Star, Heart, Truck, Store, ShoppingBag, Home, Timer, Smile, ChevronRight
};

export interface CategoryStyle {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any;
    color: string;
    hoverText: string;
    bg: string;
    border: string;
    shadow: string;
    gradient: string;
    rotate: string; // Animation class
}

export const getCategoryStyle = (name: string, index: number = 0, animationType: string = "AUTO", iconName?: string): CategoryStyle => {
    const n = name.toLowerCase();

    // Helper for AUTO logic
    const isRight = index % 2 === 0;
    const getRotation = (magnitude: 3 | 6 | 12) => {
        if (magnitude === 12) return isRight ? 'group-hover:rotate-12' : 'group-hover:-rotate-12';
        if (magnitude === 6) return isRight ? 'group-hover:rotate-6' : 'group-hover:-rotate-6';
        return isRight ? 'group-hover:rotate-3' : 'group-hover:-rotate-3';
    };

    let baseStyle: Partial<CategoryStyle> = {};
    let magnitude: 3 | 6 | 12 = 6; // Default

    // Determine Base Colors & Icon (Vibes)
    if (n.includes('live') || n.includes('fresh') || n.includes('fish')) {
        baseStyle = {
            icon: Fish,
            color: 'text-cyan-600',
            hoverText: 'group-hover:text-cyan-600',
            bg: 'group-hover:bg-cyan-500',
            border: 'group-hover:border-cyan-200',
            shadow: 'group-hover:shadow-cyan-500/20',
            gradient: 'from-cyan-500/10',
        };
        magnitude = 12;
    } else if (n.includes('masala') || n.includes('spicy') || n.includes('curry')) {
        baseStyle = {
            icon: Flame,
            color: 'text-orange-600',
            hoverText: 'group-hover:text-orange-600',
            bg: 'group-hover:bg-orange-500',
            border: 'group-hover:border-orange-200',
            shadow: 'group-hover:shadow-orange-500/20',
            gradient: 'from-orange-500/10',
        };
        magnitude = 12;
    } else if (n.includes('fry') || n.includes('fried') || n.includes('crispy')) {
        baseStyle = {
            icon: Drumstick,
            color: 'text-amber-600',
            hoverText: 'group-hover:text-amber-600',
            bg: 'group-hover:bg-amber-500',
            border: 'group-hover:border-amber-200',
            shadow: 'group-hover:shadow-amber-500/20',
            gradient: 'from-amber-500/10',
        };
        magnitude = 12;
    } else if (n.includes('frozen') || n.includes('chilled') || n.includes('ice')) {
        baseStyle = {
            icon: Snowflake,
            color: 'text-sky-500',
            hoverText: 'group-hover:text-sky-500',
            bg: 'group-hover:bg-sky-500',
            border: 'group-hover:border-sky-200',
            shadow: 'group-hover:shadow-sky-500/20',
            gradient: 'from-sky-500/10',
        };
        magnitude = 6;
    } else if (n.includes('soup') || n.includes('broth')) {
        baseStyle = {
            icon: Soup,
            color: 'text-yellow-600',
            hoverText: 'group-hover:text-yellow-600',
            bg: 'group-hover:bg-yellow-500',
            border: 'group-hover:border-yellow-200',
            shadow: 'group-hover:shadow-yellow-500/20',
            gradient: 'from-yellow-500/10',
        };
        magnitude = 6;
    } else if (n.includes('shell') || n.includes('meat') || n.includes('prawn') || n.includes('shrimp') || n.includes('crab')) {
        baseStyle = {
            icon: Shell,
            color: 'text-rose-600',
            hoverText: 'group-hover:text-rose-600',
            bg: 'group-hover:bg-rose-500',
            border: 'group-hover:border-rose-200',
            shadow: 'group-hover:shadow-rose-500/20',
            gradient: 'from-rose-500/10',
        };
        magnitude = 12;
    } else if (n.includes('bundle') || n.includes('pack') || n.includes('combo')) {
        baseStyle = {
            icon: Package,
            color: 'text-purple-600',
            hoverText: 'group-hover:text-purple-600',
            bg: 'group-hover:bg-purple-500',
            border: 'group-hover:border-purple-200',
            shadow: 'group-hover:shadow-purple-500/20',
            gradient: 'from-purple-500/10',
        };
        magnitude = 6;
    } else if (n.includes('offer') || n.includes('deal') || n.includes('discount')) {
        baseStyle = {
            icon: Gift,
            color: 'text-emerald-600',
            hoverText: 'group-hover:text-emerald-600',
            bg: 'group-hover:bg-emerald-500',
            border: 'group-hover:border-emerald-200',
            shadow: 'group-hover:shadow-emerald-500/20',
            gradient: 'from-emerald-500/10',
        };
        magnitude = 12;
    } else {
        baseStyle = {
            icon: Utensils,
            color: 'text-slate-600',
            hoverText: 'group-hover:text-slate-800',
            bg: 'group-hover:bg-slate-800',
            border: 'group-hover:border-slate-300',
            shadow: 'group-hover:shadow-slate-500/20',
            gradient: 'from-slate-500/10',
        };
        magnitude = 6;
    }

    // Overwrite icon if explicitly provided from DB
    if (iconName && ICON_MAP[iconName]) {
        baseStyle.icon = ICON_MAP[iconName];
    }

    // Determine Animation Class
    let rotateClass = '';

    // Normalize animationType (handle null/undefined from DB)
    const type = (animationType || 'AUTO').toUpperCase();

    switch (type) {
        case 'ROTATE_RIGHT':
            rotateClass = 'group-hover:rotate-12';
            break;
        case 'ROTATE_LEFT':
            rotateClass = 'group-hover:-rotate-12';
            break;
        case 'FLOAT':
            rotateClass = 'group-hover:-translate-y-2';
            break;
        case 'BOUNCE':
            rotateClass = 'group-hover:animate-bounce';
            break;
        case 'PULSE':
            rotateClass = 'group-hover:animate-pulse';
            break;
        case 'SHAKE':
            rotateClass = 'group-hover:animate-pulse';
            break;
        case 'FLIP':
            rotateClass = 'group-hover:[transform:rotateY(180deg)] transition-transform duration-500';
            break;
        case 'AUTO':
        default:
            rotateClass = getRotation(magnitude);
            break;
    }

    return { ...baseStyle, rotate: rotateClass } as CategoryStyle;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cardVariants: any = {
    hidden: {
        opacity: 0,
        y: 40,
        scale: 0.8,
        rotateX: -15
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        transition: {
            type: "spring",
            stiffness: 80,
            damping: 12,
            mass: 1
        }
    }
};

import { Category } from '@/types/common';

export function CategoryNav({ initialCategories = [] }: { initialCategories?: Category[] }) {
    const categories = initialCategories;

    return (
        <section className="relative py-8 md:py-16 overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-crab-red/5 rounded-full blur-[120px] -z-10 animate-pulse" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-400/5 rounded-full blur-[120px] -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                            Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-crab-red to-orange-600">Categories</span>
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="hidden md:block"
                    >
                        <p className="text-slate-500 font-medium max-w-xs text-right text-sm leading-relaxed">
                            Explore our wide range of fresh, high-quality seafood and premium ready-to-fry products.
                        </p>
                    </motion.div>
                </div>

                {/* Mobile View: Horizontal Scroll */}
                <div className="md:hidden flex gap-4 overflow-x-auto pb-8 scrollbar-hide -mx-4 px-4 snap-x">
                    {categories.map((cat, index) => {
                        const style = getCategoryStyle(cat.name, index, cat.animationType, cat.icon);
                        const Icon = style.icon;
                        return (
                            <Link
                                key={cat.id}
                                href={`/menu?category=${cat.id}`}
                                className="flex flex-col items-center gap-3 min-w-[100px] snap-center group"
                            >
                                <div className="relative">
                                    <div className={`w-20 h-20 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex items-center justify-center ${style.color} group-active:scale-95 transition-all duration-300`}>
                                        <Icon className="w-8 h-8 transition-transform group-active:scale-110" />
                                    </div>
                                    <div className={`absolute inset-0 opacity-0 group-active:opacity-10 rounded-2xl transition-opacity bg-current ${style.color}`} />
                                </div>
                                <span className="text-xs font-black text-center text-slate-800 uppercase tracking-wider line-clamp-2 w-full px-1">
                                    {cat.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Desktop View: Premium Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-6"
                >
                    {categories.map((cat, index) => {
                        const style = getCategoryStyle(cat.name, index, cat.animationType, cat.icon);
                        const Icon = style.icon;
                        return (
                            <motion.div
                                key={cat.id}
                                variants={cardVariants}
                                whileHover={{
                                    scale: 1.05,
                                    y: -8,
                                    transition: { duration: 0.3 }
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    href={`/menu?category=${cat.id}`}
                                    className="group relative block h-full"
                                >
                                    {/* Dynamic Hover Gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} to-transparent opacity-0 group-hover:opacity-100 rounded-3xl blur-2xl transition-opacity duration-500`} />

                                    <div className={`relative h-full flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${style.shadow} group-hover:-translate-y-3 group-hover:bg-white/90 transition-all duration-500 overflow-hidden`}>

                                        {/* Content */}
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className={`mb-6 p-5 rounded-2xl bg-slate-50 ${style.color} ${style.bg} group-hover:text-white shadow-inner transition-all duration-500 transform ${style.rotate}`}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <h3 className={`text-sm font-black text-slate-900 ${style.hoverText} text-center uppercase tracking-widest transition-colors duration-300`}>
                                                {cat.name}
                                            </h3>
                                        </div>

                                        {/* Arrow Indicator */}
                                        <div className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-500 ${style.color}`}>
                                            <ChevronRight className="w-5 h-5" />
                                        </div>

                                        {/* Bottom Accent */}
                                        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-current ${style.color} group-hover:w-full transition-all duration-500`} />
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
