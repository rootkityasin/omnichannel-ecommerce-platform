'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';
import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/components/providers/SettingsProvider';
import { getSiteConfig } from '@/app/actions/settings'; // Kept types
import { cn } from '@/lib/utils';
import { menuItems } from '@/lib/data';

import { AnimatedSearchBar } from './AnimatedSearchBar';
import { LocationPermissionDialog } from './LocationPermissionDialog';
import { toast } from 'sonner';
import { useGeolocation } from '@/lib/hooks/useGeolocation';

// Reusing the Mobile Sidebar logic but adapted for Desktop if needed overlap
import { MobileHeader } from './MobileHeader'; // We might not want to import the whole header just for sidebar... 
// actually, let's just duplicate the sidebar overlay for now or create a shared one later.
// For speed: simple overlay sidebar.

export function DesktopNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const { settings } = useSettings();
    const config = settings;

    const cartItems = useCartStore((state) => state.items);
    const openCart = useCartStore((state) => state.openCart); // Get action
    const openCheckout = useCartStore((state) => state.openCheckout);
    const { language, toggleLanguage } = useLanguageStore();
    const t = translations[language];
    const [mounted, setMounted] = useState(false);



    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const { getGeoLocation } = useGeolocation();

    const handleLocationClick = () => {
        getGeoLocation();
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
        // getSiteConfig removed - using Context

        const handleScroll = () => {
             
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const cartCount = mounted ? cartItems.reduce((acc, item) => acc + item.quantity, 0) : 0;

    const navItems = [
        { label: t.home, href: '/' },
        { label: t.menu, href: '/menu' },
        { label: 'Story', href: '/story' },
    ];





    const isHomePage = pathname === '/';
    const isTransparent = isHomePage && !scrolled;

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 left-0 right-0 transition-all duration-700 ease-in-out hidden md:block",
                    isSidebarOpen ? "z-[100] bg-transparent backdrop-blur-none delay-100" : "z-50",
                    !isTransparent && !isSidebarOpen
                        ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20 py-3"
                        : "bg-transparent py-5"
                )}
            >
                <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-full relative">
                    <div className="flex items-center gap-6">
                        {/* Hamburger / Close Toggle (Desktop) */}
                        <motion.button
                            className={cn(
                                "relative z-[110] p-2 -ml-2 rounded-full transition-colors",
                                isSidebarOpen
                                    ? "text-white hover:bg-white/10"
                                    : "!text-[#0A3D62] hover:bg-slate-100" // Removed transparent variance, always dark
                            )}
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            animate={isSidebarOpen ? "open" : "closed"}
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <motion.line
                                    x1="4" x2="20" y1="6" y2="6"
                                    variants={{
                                        closed: { rotate: 0, y: 0 },
                                        open: { rotate: 45, y: 6 }
                                    }}
                                />
                                <motion.line
                                    x1="4" x2="20" y1="12" y2="12"
                                    variants={{
                                        closed: { opacity: 1 },
                                        open: { opacity: 0 }
                                    }}
                                />
                                <motion.line
                                    x1="4" x2="20" y1="18" y2="18"
                                    variants={{
                                        closed: { rotate: 0, y: 0 },
                                        open: { rotate: -45, y: -6 }
                                    }}
                                />
                            </svg>
                        </motion.button>

                        {/* Logo or Text Fallback */}
                        <Link href="/" className={cn("flex items-center gap-2 group transition-opacity duration-300", isSidebarOpen && "opacity-0 pointer-events-none")}>
                            {config?.logoUrl ? (
                                <img
                                    src={config.logoUrl}
                                    alt={config?.shopName || "Store"}
                                    className={cn(
                                        "w-auto object-contain transition-all duration-300 group-hover:scale-105",
                                        !isTransparent ? "h-14" : "h-20"
                                    )}
                                    onError={(e) => {
                                        // Hide image on error and show text instead? Or just fallback to text logic
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        // You'd need a state/ref to toggle text visibility if relying on error
                                    }}
                                />
                            ) : (
                                <span
                                    style={{ color: '#0A3D62' }}
                                    className={cn(
                                        "font-black tracking-tighter uppercase transition-colors",
                                        !isTransparent ? "text-2xl !text-[#0A3D62]" : "text-3xl !text-[#0A3D62] drop-shadow-sm"
                                    )}>
                                    {config?.shopName || "CrabKhai"}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Center Nav */}
                    <motion.nav
                        initial={{ x: "-50%", y: "-50%" }}
                        animate={{
                            x: isSearchOpen ? "-120%" : "-50%", // Move further left if search is open
                            y: "-50%"
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cn(
                            "flex items-center gap-8 bg-white/50 backdrop-blur-md px-8 py-2.5 rounded-full border border-slate-200/20 shadow-sm transition-opacity duration-300",
                            isSidebarOpen && "opacity-0 pointer-events-none",
                            "absolute left-1/2 top-1/2"
                        )}>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "text-sm font-bold tracking-wide uppercase transition-colors relative",
                                        isActive
                                            ? "text-crab-red"
                                            : "!text-[#0A3D62] hover:!text-crab-red" // Added hover importance
                                    )}
                                >
                                    {item.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="desktop-nav-underline"
                                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-crab-red rounded-full"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </motion.nav>

                    {/* Right Actions */}
                    <div className={cn("flex items-center gap-4 transition-opacity duration-300", isSidebarOpen && "opacity-0 pointer-events-none")}>

                        {/* Search - First */}
                        <div className="flex items-center gap-3">
                            <AnimatedSearchBar width="w-72" isTransparent={isTransparent} onOpenChange={setIsSearchOpen} />
                        </div>

                        {/* Language - Second */}
                        <button
                            onClick={toggleLanguage}
                            className={cn(
                                "text-xs font-bold px-2 py-1 rounded border transition-colors",
                                language !== 'en' ? 'font-bangla' : 'font-body',
                                !isTransparent
                                    ? "border-slate-200 text-slate-600 hover:border-crab-red hover:text-crab-red"
                                    : "!border-[#0A3D62]/20 !text-[#0A3D62] hover:bg-black/5"
                            )}
                        >
                            {language === 'en' ? 'EN' : language === 'bn' ? 'বাংলা' : language.toUpperCase()}
                        </button>

                        {/* Cart - Third */}
                        <button onClick={openCart} className="relative group mr-2">
                            <div className={cn(
                                "p-2 rounded-full transition-colors",
                                "!text-[#0A3D62] hover:bg-slate-100" // Simplified
                            )}>
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-crab-red text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* MapPin (Location) - Fourth */}
                        <button
                            onClick={handleLocationClick}
                            className={cn(
                                "p-2 rounded-full transition-colors",
                                "!text-[#0A3D62] hover:bg-slate-100"
                            )}
                        >
                            <MapPin className="w-5 h-5" />
                        </button>

                        {/* Account - Fifth (Pill Style) */}
                        <Link
                            href="/account"
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all shadow-sm",
                                !isTransparent
                                    ? "border-slate-200 bg-white text-slate-700 hover:border-crab-red hover:text-crab-red"
                                    : "!border-[#0A3D62]/10 bg-white/50 backdrop-blur-md !text-[#0A3D62] hover:bg-white/80"
                            )}
                        >
                            <User className="w-4 h-4" />
                            <span className="text-xs font-bold tracking-wide uppercase">Account</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Desktop Sidebar Overlay - Similar content to mobile, but styled for desktop context if needed */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed top-0 left-0 bottom-0 w-[300px] bg-slate-950 z-[70] shadow-2xl px-6 pb-6 pt-28 flex flex-col"
                        >
                            <nav className="space-y-6">
                                {[
                                    { href: "/", label: "HOME", color: "text-white" },
                                    { href: "/menu", label: "MENU", color: "text-white" },
                                    { href: "/cart?action=checkout", label: "CHECKOUT", color: "text-orange-400" },
                                    { href: "/story", label: "OUR STORY", color: "text-crab-red" },
                                    { href: "/account", label: "ACCOUNT", color: "text-white" }
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.href}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + (i * 0.1) }}
                                    >
                                        <Link
                                            href={item.href}
                                            className={`block text-2xl font-black hover:text-crab-red transition-colors ${item.color}`}
                                            onClick={(e) => {
                                                if (item.label === 'CHECKOUT') {
                                                    e.preventDefault();
                                                    openCheckout();
                                                }
                                                setIsSidebarOpen(false);
                                            }}
                                        >
                                            {item.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </nav>

                        </motion.div>
                    </>
                )}
            </AnimatePresence >

        </>
    );
}
