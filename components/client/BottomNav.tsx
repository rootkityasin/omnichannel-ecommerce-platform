'use client';

import { Home, Grid, ShoppingCart, User, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';

export function BottomNav() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const cartItems = useCartStore((state) => state.items);

    // Prevent hydration mismatch
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    const cartCount = mounted ? cartItems.reduce((acc, item) => acc + item.quantity, 0) : 0;

    const { language } = useLanguageStore();
    const t = translations[language];

    // Hide BottomNav on Cart page to prevent overlap with StickyCartFooter
    if (pathname === '/cart') return null;

    const navItems = [
        { label: t.home, icon: Home, href: '/' },
        { label: t.menu, icon: Grid, href: '/menu' },
        { label: 'Story', icon: BookOpen, href: '/story' },
        { label: t.cart, icon: ShoppingCart, href: '/cart', badge: cartCount },
        { label: t.account, icon: User, href: '/account' },
    ];

    return (
        <div className="fixed bottom-3 left-0 right-0 z-50 px-4 md:hidden pointer-events-none">
            <nav className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-[2rem] pointer-events-auto h-16 px-2">
                <div className="flex items-center justify-around h-full relative">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1 relative z-10 transition-colors duration-300",
                                    isActive ? "text-crab-red" : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <div className="relative">
                                    <motion.div
                                        whileTap={{ scale: 0.8 }}
                                        animate={isActive ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    >
                                        <item.icon className={cn("w-6 h-6")} />
                                    </motion.div>

                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-glow"
                                            className="absolute -inset-3 bg-crab-red/10 blur-xl rounded-full -z-10"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}

                                    {item.badge ? (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-2 -right-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-crab-red px-1.5 text-[10px] font-black text-white ring-4 ring-white/50 backdrop-blur-md"
                                        >
                                            {item.badge}
                                        </motion.span>
                                    ) : null}
                                </div>
                                <motion.span
                                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 2 }}
                                    className="text-[10px] font-black tracking-tighter uppercase"
                                >
                                    {item.label}
                                </motion.span>

                                {isActive && (
                                    <motion.div
                                        layoutId="active-dot"
                                        className="absolute -bottom-1 w-1 h-1 bg-crab-red rounded-full"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
