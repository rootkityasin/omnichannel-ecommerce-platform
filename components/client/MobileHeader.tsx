'use client';

import { Menu, Search, MapPin, ShoppingCart, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/lib/languageStore';
import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/store';
import { menuItems } from '@/lib/data';
import { toast } from 'sonner';
import { getSiteConfig } from '@/app/actions/settings';

import { translations } from '@/lib/translations';
import { useAdmin } from '@/components/providers/AdminProvider';
import { Mascot } from './Mascot';
import { AnimatedSearchBar } from './AnimatedSearchBar';
import { cn } from "@/lib/utils";
import { LocationPermissionDialog } from './LocationPermissionDialog';

export function MobileHeader() {
    const [mounted, setMounted] = useState(false);
    const [config, setConfig] = useState<any>(null);
    const cartItems = useCartStore((state) => state.items);
    const openCheckout = useCartStore((state) => state.openCheckout);
    const { language, toggleLanguage } = useLanguageStore();
    const t = translations[language];

    const searchRef = useRef<HTMLDivElement>(null);
    const searchTriggerRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
        getSiteConfig().then(setConfig);

        function handleClickOutside(event: MouseEvent) {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target as Node) &&
                searchTriggerRef.current &&
                !searchTriggerRef.current.contains(event.target as Node)
            ) {
                setIsSearchOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const cartCount = mounted ? cartItems.reduce((acc, item) => acc + item.quantity, 0) : 0;
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();
    const searchTimeout = useRef<NodeJS.Timeout>(null);
    const [mascotState, setMascotState] = useState<'idle' | 'searching' | 'found' | 'empty' | 'delivery'>('idle');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setMascotState('searching');
            router.push(`/menu?search=${encodeURIComponent(searchTerm)}`);
            setIsSearchOpen(false);

            // Check results (simple heuristic for demo)
            const hasResults = menuItems.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
            setTimeout(() => {
                setMascotState(hasResults ? 'found' : 'empty');
            }, 500);
        }
    };

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setMascotState('searching');

        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            // Peek result state while typing
            const hasResults = menuItems.some(item => item.name.toLowerCase().includes(e.target.value.toLowerCase()));
            setMascotState(hasResults ? 'found' : 'empty');
        }, 800);
    };

    useEffect(() => {
        // Reset mascot to idle after a delay if no interaction
        if (mascotState !== 'idle' && !isSearchOpen) {
            const timer = setTimeout(() => setMascotState('idle'), 2000);
            return () => clearTimeout(timer);
        }
    }, [mascotState, isSearchOpen]);

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

    return (
        <>
            <header className={cn(
                "sticky top-0 w-full transition-all duration-300",
                isSidebarOpen ? "z-[100] bg-transparent border-transparent shadow-none" : "z-50 bg-crab-red border-b border-white/10 shadow-md"
            )}>
                <div className="flex items-center justify-between px-4 h-16 text-white max-w-7xl mx-auto">
                    {/* Left: Logo Area */}
                    <div className="flex items-center gap-3">
                        {/* Hamburger Trigger (Animated) */}
                        <motion.button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="relative z-[110] p-1 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors"
                            animate={isSidebarOpen ? "open" : "closed"}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

                        <div className={cn("flex items-center gap-3 transition-opacity duration-300", isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
                            <Link href="/" className="flex items-center gap-2">
                                <img
                                    src={config?.logoUrl || "/logo.svg"}
                                    alt={config?.shopName || "CrabKhai"}
                                    className="h-14 w-auto object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "/logo.svg";
                                    }}
                                />
                            </Link>
                            {/* Language Toggle */}
                            <button
                                onClick={toggleLanguage}
                                className={`ml-1 px-2 py-1 rounded border border-white/20 text-[10px] font-bold tracking-wider hover:bg-white/10 transition-colors ${language !== 'en' ? 'font-bangla' : 'font-body'}`}
                            >
                                {language === 'en' && 'EN'}
                                {language === 'bn' && 'বাংলা'}
                                {language === 'ctg' && 'চাটগাঁ'}
                                {language === 'noa' && 'নোয়াখালী'}
                                {language === 'bar' && 'বরিশাইলা'}
                            </button>
                        </div>
                    </div>

                    {/* Right: Icons (Search, Pin, Cart, User) */}
                    <div className={cn("flex items-center gap-3 transition-opacity duration-300", isSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100")}>
                        <AnimatedSearchBar width="w-48" className="bg-transparent hover:bg-white/10" />
                        <button onClick={() => useCartStore.getState().openCart()} className="relative p-1 text-white">
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-white text-crab-red text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleLocationClick}
                            className="p-1 text-white hover:text-green-400"
                        >
                            <MapPin className="w-5 h-5" />
                        </button>
                    </div>
                </div>


            </header>

            {/* Sidebar / Hamburger Menu */}
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
                            className="fixed top-0 left-0 bottom-0 w-[280px] bg-slate-950 z-[70] shadow-2xl px-6 pb-6 pt-24 flex flex-col"
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

            {mascotState !== 'idle' && <Mascot state={mascotState} className="fixed top-14 left-4 z-[60]" />
            }

            <LocationPermissionDialog
                isOpen={isLocationDialogOpen}
                onOpenChange={setIsLocationDialogOpen}
                onConfirm={getGeoLocation}
            />
        </>
    );
}
