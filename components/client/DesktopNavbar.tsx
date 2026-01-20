'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, User, MapPin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';
import { useState, useEffect, useRef } from 'react';
import { useAdmin } from '@/components/providers/AdminProvider';
import { getSiteConfig } from '@/app/actions/settings'; // Kept types
import { cn } from '@/lib/utils';
import { menuItems } from '@/lib/data';

import { AnimatedSearchBar } from './AnimatedSearchBar';
import { LocationPermissionDialog } from './LocationPermissionDialog';
import { toast } from 'sonner';

// Reusing the Mobile Sidebar logic but adapted for Desktop if needed overlap
import { MobileHeader } from './MobileHeader'; // We might not want to import the whole header just for sidebar... 
// actually, let's just duplicate the sidebar overlay for now or create a shared one later.
// For speed: simple overlay sidebar.

export function DesktopNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const { settings } = useAdmin(); // Use shared settings
    const config = settings;

    const cartItems = useCartStore((state) => state.items);
    const openCart = useCartStore((state) => state.openCart); // Get action
    const openCheckout = useCartStore((state) => state.openCheckout);
    const { language, toggleLanguage } = useLanguageStore();
    const t = translations[language];
    const [mounted, setMounted] = useState(false);



    // Sidebar State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);

    const handleLocationClick = () => {
        setIsLocationDialogOpen(true);
    };

    const getGeoLocation = () => {
        if ('geolocation' in navigator) {
            const options = {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 10000
            };

            toast.loading("Locating you...", { id: "location-toast" });

            navigator.geolocation.getCurrentPosition((position) => {
                toast.dismiss("location-toast");
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                const deliveryZones = [
                    { name: 'Dhaka', lat: 23.8103, lng: 90.4125 },
                    { name: 'Khulna', lat: 22.8456, lng: 89.5403 },
                    { name: 'Chottogram', lat: 22.3569, lng: 91.7832 }
                ];

                let nearestCity = null;
                let minDistance = Infinity;

                deliveryZones.forEach(zone => {
                    const R = 6371; // Radius of the earth in km
                    const dLat = (zone.lat - userLat) * (Math.PI / 180);
                    const dLon = (zone.lng - userLng) * (Math.PI / 180);
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(userLat * (Math.PI / 180)) * Math.cos(zone.lat * (Math.PI / 180)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const d = R * c; // Distance in km

                    if (d < minDistance) {
                        minDistance = d;
                        nearestCity = zone.name;
                    }
                });

                if (minDistance <= 20) {
                    toast.success(`${t.deliveryAreaSuccess} ${nearestCity}.`);
                } else {
                    toast.error(t.deliveryAreaFail || "Sorry, we don't deliver to your area yet.");
                }
            }, (error) => {
                toast.dismiss("location-toast");
                let errorMessage = "Location access failed.";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "User denied the request for Geolocation. Please enable location permissions.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "The request to get user location timed out.";
                        break;
                }
                toast.error(errorMessage);
                console.error("Geolocation Error:", error);
            }, options);
        } else {
            toast.error(t.geoNotSupported || "Geolocation is not supported by this browser.");
        }
    };

    useEffect(() => {
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
                <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-full">
                    <div className="flex items-center gap-6">
                        {/* Hamburger / Close Toggle (Desktop) */}
                        <motion.button
                            className={cn(
                                "relative z-[110] p-2 -ml-2 rounded-full transition-colors",
                                isSidebarOpen
                                    ? "text-white hover:bg-white/10"
                                    : !isTransparent ? "text-slate-800 hover:bg-slate-100" : "text-white hover:bg-white/10"
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

                        {/* Logo */}
                        <Link href="/" className={cn("flex items-center gap-2 group transition-opacity duration-300", isSidebarOpen && "opacity-0 pointer-events-none")}>
                            <img
                                src={config?.logoUrl || "/logo.svg"}
                                alt={config?.shopName || "CrabKhai"}
                                className={cn(
                                    "w-auto object-contain transition-all duration-300 group-hover:scale-105",
                                    !isTransparent ? "h-14" : "h-20"
                                )}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/logo.svg";
                                }}
                            />
                        </Link>
                    </div>

                    {/* Center Nav */}
                    <nav className={cn("flex items-center gap-8 bg-black/20 backdrop-blur-md px-8 py-2.5 rounded-full border border-white/10 shadow-sm transition-opacity duration-300", isSidebarOpen && "opacity-0 pointer-events-none")}>
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
                                            : !isTransparent ? "text-slate-700 hover:text-crab-red" : "text-white hover:text-crab-red" // Text color adapts to bg
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
                    </nav>

                    {/* Right Actions */}
                    <div className={cn("flex items-center gap-5 transition-opacity duration-300", isSidebarOpen && "opacity-0 pointer-events-none")}>
                        {/* Search */}
                        <div className="flex items-center gap-3">
                            <AnimatedSearchBar width="w-72" />
                        </div>

                        {/* Language */}
                        <button
                            onClick={toggleLanguage}
                            className={cn(
                                "text-xs font-bold px-2 py-1 rounded border transition-colors",
                                language !== 'en' ? 'font-bangla' : 'font-body',
                                !isTransparent
                                    ? "border-slate-200 text-slate-600 hover:border-crab-red hover:text-crab-red"
                                    : "border-white/30 text-white hover:bg-white/10"
                            )}
                        >
                            {language === 'en' ? 'EN' : language === 'bn' ? 'বাংলা' : language.toUpperCase()}
                        </button>

                        {/* Cart */}
                        <button onClick={openCart} className="relative group">
                            <div className={cn(
                                "p-2 rounded-full transition-colors",
                                !isTransparent ? "text-slate-600 hover:bg-slate-100" : "text-white hover:bg-white/10"
                            )}>
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-crab-red text-white text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* MapPin moved to right corner */}
                        <button
                            onClick={handleLocationClick}
                            className={cn(
                                "p-2 rounded-full transition-colors",
                                !isTransparent ? "text-slate-600 hover:bg-slate-100" : "text-white hover:bg-white/10"
                            )}
                        >
                            <MapPin className="w-5 h-5" />
                        </button>
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

            <LocationPermissionDialog
                isOpen={isLocationDialogOpen}
                onOpenChange={setIsLocationDialogOpen}
                onConfirm={getGeoLocation}
            />
        </>
    );
}
