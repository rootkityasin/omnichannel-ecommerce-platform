'use client';

import { useState, useEffect } from 'react';
import { User, Package, MapPin, CreditCard, LogOut, ChevronRight, HelpCircle, Camera, Edit2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';
import { checkUserExists, createUser, getUserProfile } from '@/app/actions/user';
import { toast } from 'sonner';
import { useSession, signOut } from "next-auth/react";
import { AuthForm } from '@/components/client/AuthForm';

export default function AccountPage() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { language } = useLanguageStore();
    const t = translations[language];

    // State for form data including image
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        area: '',
        address: '',
        image: '',
        points: 0,
        status: 'Bronze'
    });
    const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Strategy: 
        // 1. If NextAuth session exists, we are definitely logged in.
        // 2. If no session, check localStorage (legacy/guest support).

        const checkAuth = async () => {
            if (status === 'loading') return;

            if (status === 'authenticated' && session?.user) {
                // Admin Redirect Check
                // @ts-ignore
                const role = session.user.role;
                if (role === 'SUPER_ADMIN' || role === 'HUB_ADMIN') {
                    router.push('/admin');
                    return;
                }

                setIsLoggedIn(true);

                // Fetch latest data from DB
                // @ts-ignore
                const dbUser = await getUserProfile(session.user.id);

                setFormData(prev => ({
                    ...prev,
                    name: dbUser?.name || session.user?.name || prev.name,
                    email: dbUser?.email || session.user?.email || prev.email,
                    phone: dbUser?.phone || (session.user as any).phone || prev.phone,
                    address: dbUser?.address || prev.address,
                    image: dbUser?.image || session.user?.image || prev.image,
                    points: dbUser?.points || 0, // Assume 0 if not found
                    status: 'Bronze' // Calculate based on points if needed
                }));
            } else {
                // ONLY check local storage if NOT authenticated (Guest mode or hydration)
                // But wait, if we are unauthenticated, we should show Login form.
                // So we simply do nothing here, let isLoggedIn stay false, which renders AuthForm.
                setIsLoggedIn(false);
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [status, session]);

    // Phone Validation Regex (Bangladesh)
    // Supports: 01xxxxxxxxx, +8801xxxxxxxxx
    const isValidPhone = (phone: string) => /^(?:\+88)?01[3-9]\d{8}$/.test(phone);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate Phone First
        if (!isValidPhone(formData.phone)) {
            toast.error("Invalid phone number format");
            return;
        }

        if (isSigningUp) {
            // Check if user exists
            const exists = await checkUserExists(formData.phone);
            if (exists) {
                toast.error("User with this phone number already exists!");
                return;
            }

            // Create User in DB
            const result = await createUser({
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                address: formData.address
            });

            if (!result.success) {
                toast.error("Failed to create account. Please try again.");
                return;
            }

            toast.success("Account created successfully!");
            localStorage.setItem('crabkhai_user', JSON.stringify(formData));
        } else {
            // Login mode - Validate existence in DB
            const exists = await checkUserExists(formData.phone);
            if (!exists) {
                toast.error("No account found with this number. Please Sign Up.");
                return;
            }

            // Check local storage for consistency, or just log them in
            const existingLocal = localStorage.getItem('crabkhai_user');
            if (existingLocal) {
                const parsed = JSON.parse(existingLocal);
                if (parsed.phone === formData.phone) {
                    setFormData(prev => ({ ...prev, ...parsed }));
                }
            } else {
                localStorage.setItem('crabkhai_user', JSON.stringify(formData));
            }
            toast.success("Welcome back!");
        }
        setIsLoggedIn(true);
    };

    const handleLogout = async () => {
        try {
            // 1. Clear Local Storage
            localStorage.removeItem('crabkhai_user');

            // 2. Update Local State
            setIsLoggedIn(false);
            setFormData({ name: '', phone: '', email: '', area: '', address: '', image: '', points: 0, status: 'Bronze' });

            // 3. Sign Out from NextAuth
            await signOut({ redirect: true, callbackUrl: '/' });
        } catch (error) {
            console.error("Logout error:", error);
            window.location.href = '/';
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => {
                    const updated = { ...prev, image: base64String };
                    // Auto-save if logged in
                    if (isLoggedIn) {
                        localStorage.setItem('crabkhai_user', JSON.stringify(updated));
                    }
                    return updated;
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Mock User Data
    const user = {
        name: isLoggedIn ? formData.name || 'Foodie' : 'Guest',
        phone: isLoggedIn ? formData.phone : '',
        email: isLoggedIn ? formData.email : '',
        address: isLoggedIn ? formData.address : '',
        image: isLoggedIn ? formData.image : '',
        memberSince: 'December 2025',
        points: 0
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-crab-red border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="pt-24 px-4 pb-12">
                <AuthForm />
            </div>
        );
    }

    // --- PROFILE VIEW ---
    return (
        <div className="bg-gray-50 min-h-screen pb-20 md:pb-0 pt-20 md:pt-28">
            <div className="max-w-4xl mx-auto px-4 md:px-0">
                {/* Header Profile Card - Modernized Ocean Blue */}
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="bg-crab-red text-white p-6 pt-16 pb-8 rounded-b-[2rem] shadow-xl mb-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full -ml-16 -mb-16 blur-2xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="relative group mb-3">
                            <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/20 overflow-hidden shadow-2xl ring-4 ring-white/10 hover:scale-105 transition-transform duration-300">
                                {user.image ? (
                                    <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <img src="/mascot-avatar.png" alt="Profile" className="w-full h-full object-cover p-1" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-white text-crab-red p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all duration-200">
                                <Camera className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>

                        <h1 className={`text-xl font-bold tracking-tight mb-0.5 ${language === 'bn' ? 'font-bangla' : 'font-heading'}`}>{user.name}</h1>
                        <p className={`text-white/60 font-medium text-xs ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>{user.phone}</p>

                        <div className="flex items-center gap-2 mt-3 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                            <span className={`text-[10px] font-bold tracking-wide ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>{t.profile.memberSince} <span className="text-white/80 font-normal">Dec 2025</span></span>
                        </div>
                    </div>
                </motion.div>

                {/* Menu List - Modern Grouped Style */}
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className="px-5 -mt-10 relative z-20 space-y-3"
                >

                    {/* Stats Cards */}
                    <div className="bg-white p-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 grid grid-cols-2 gap-4">
                        <div className="text-center p-2 rounded-xl hover:bg-gray-50 transition-colors hover:scale-105 duration-200">
                            <span className={`block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>{t.profile.points}</span>
                            <span className="block text-2xl font-black text-crab-red">{formData.points}</span>
                        </div>
                        <div className="text-center p-2 rounded-xl hover:bg-gray-50 transition-colors border-l border-gray-100 hover:scale-105 duration-200">
                            <span className={`block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>Status</span>
                            <span className="block text-lg font-bold text-gray-700">{formData.status}</span>
                        </div>
                    </div>

                    {/* Main Menu */}
                    <div className="space-y-4">
                        <h3 className={`text-sm font-bold text-gray-400 uppercase tracking-wider px-2 ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>Account</h3>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            <Link href="/account/orders" className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all hover:scale-[1.01] active:scale-[0.99] group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-gray-900 transition-colors ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>{t.profile.myOrders}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </Link>

                            <Link href="/account/addresses" className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all hover:scale-[1.01] active:scale-[0.99] group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-gray-900 transition-colors ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>{t.profile.addresses}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </Link>

                            <Link href="/account/payment" className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all hover:scale-[1.01] active:scale-[0.99] group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-gray-900 transition-colors ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>{t.profile.paymentMethods}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </Link>
                        </div>
                    </div>

                    {/* Support & Logout */}
                    <div className="space-y-4">
                        <h3 className={`text-sm font-bold text-gray-400 uppercase tracking-wider px-2 ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>Support</h3>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            <button
                                onClick={() => alert("Support chat is coming soon!")}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all hover:scale-[1.01] active:scale-[0.99] group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <HelpCircle className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-gray-900 transition-colors ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>{t.profile.needHelp}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </button>

                            <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 active:bg-red-50 transition-all hover:scale-[1.01] active:scale-[0.99] group text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <LogOut className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-red-700 transition-colors ${language === 'bn' ? 'font-bangla' : 'font-body'}`}>{t.profile.logout}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </button>
                        </div>
                    </div>


                </motion.div>
            </div>
        </div>
    );
}
