'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Package, MapPin, CreditCard, LogOut, ChevronRight, HelpCircle, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';
import { getUserProfile } from '@/app/actions/user';
import { toast } from 'sonner';
import { useSession, signOut, signIn } from "next-auth/react";
import { AuthForm } from '@/components/client/AuthForm';

export default function AccountPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Auto-Login Logic for Cross-Domain Impersonation
    useEffect(() => {
        const impersonateId = searchParams.get('impersonate');
        const token = searchParams.get('token');

        if (impersonateId && token && status === 'unauthenticated') {
            const toastId = toast.loading("Setting up your admin session...");

            // Wipe token from the URL immediately so it doesn't leak in browser history or referer headers
            globalThis.history.replaceState({}, document.title, globalThis.location.pathname);

            signIn('credentials', {
                phone: `impersonate:${impersonateId}`,
                password: token,
                redirect: false
            }).then((res) => {
                if (res?.ok) {
                    toast.success("Login Successful", { id: toastId });
                    // Force redirect to admin panel
                    globalThis.location.href = '/admin';
                } else {
                    toast.error("Auto-login failed: " + res?.error, { id: toastId });
                }
            });
        }
    }, [searchParams, status]);

    const { language } = useLanguageStore();
    const t = translations[language];
    const isBangla = language === 'bn';
    const bodyFontClass = isBangla ? 'font-bangla' : 'font-body';
    const headingFontClass = isBangla ? 'font-bangla' : 'font-heading';

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
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Strategy: 
        // 1. If NextAuth session exists, we are definitely logged in.
        // 2. If no session, check localStorage (legacy/guest support).

        const checkAuth = async () => {
            if (status === 'loading') return;

            if (status === 'authenticated' && session?.user) {
                // Admin Redirect Check
                const role = session.user.role;
                if (role && ['SUPER_ADMIN', 'HUB_ADMIN', 'TENANT_ADMIN', 'STAFF'].includes(role)) {
                    router.push('/admin');
                    return;
                }

                setIsLoggedIn(true);

                // Fetch latest data from DB
                const dbUser = await getUserProfile(session.user.id);

                setFormData(prev => ({
                    ...prev,
                    name: dbUser?.name || session.user?.name || prev.name,
                    email: dbUser?.email || session.user?.email || prev.email,
                    phone: dbUser?.phone || session.user?.phone || prev.phone,
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
    }, [status, session, router]);

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
            globalThis.location.href = '/';
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (5MB limit)
            const maxSizeInBytes = 5 * 1024 * 1024;
            if (file.size > maxSizeInBytes) {
                toast.error("Image is too large. Max size is 5MB.");
                return;
            }

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
    const user = isLoggedIn
        ? {
            name: formData.name || 'Foodie',
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            image: formData.image,
            memberSince: 'December 2025',
            points: 0,
        }
        : {
            name: 'Guest',
            phone: '',
            email: '',
            address: '',
            image: '',
            memberSince: 'December 2025',
            points: 0,
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

    return (
        <AccountProfileView
            user={user}
            formData={formData}
            bodyFontClass={bodyFontClass}
            headingFontClass={headingFontClass}
            t={t}
            onImageUpload={handleImageUpload}
            onLogout={handleLogout}
        />
    );
}

function AccountProfileView({
    user,
    formData,
    bodyFontClass,
    headingFontClass,
    t,
    onImageUpload,
    onLogout,
}: Readonly<{
    user: {
        name: string;
        phone: string;
        email: string;
        address: string;
        image: string;
        memberSince: string;
        points: number;
    };
    formData: { points: number; status: string };
    bodyFontClass: string;
    headingFontClass: string;
    t: {
        profile: {
            memberSince: string;
            points: string;
            myOrders: string;
            addresses: string;
            paymentMethods: string;
            needHelp: string;
            logout: string;
        };
    };
    onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLogout: () => void;
}>) {
    return (
        <div className="bg-gray-50 min-h-screen pb-20 md:pb-0 pt-20 md:pt-28">
            <div className="max-w-4xl mx-auto px-4 md:px-0">
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
                            <div className="w-28 h-28 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white/20 overflow-hidden shadow-2xl ring-4 ring-white/10 hover:scale-105 transition-transform duration-300 relative">
                                {user.image ? (
                                    <Image src={user.image} alt={user.name} fill className="object-cover" />
                                ) : (
                                    <Image src="/mascot-avatar.png" alt="Profile" fill className="object-cover p-1" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-white text-crab-red p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all duration-200">
                                <Camera className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                            </label>
                        </div>

                        <h1 className={`text-xl font-bold tracking-tight mb-0.5 ${headingFontClass}`}>{user.name}</h1>
                        <p className={`text-white/60 font-medium text-xs ${bodyFontClass}`}>{user.phone}</p>

                        <div className="flex items-center gap-2 mt-3 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                            <span className={`text-[10px] font-bold tracking-wide ${bodyFontClass}`}>{t.profile.memberSince} <span className="text-white/80 font-normal">Dec 2025</span></span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className="px-5 -mt-10 relative z-20 space-y-3"
                >
                    <div className="bg-white p-4 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 grid grid-cols-2 gap-4">
                        <div className="text-center p-2 rounded-xl hover:bg-gray-50 transition-colors hover:scale-105 duration-200">
                            <span className={`block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ${bodyFontClass}`}>{t.profile.points}</span>
                            <span className="block text-2xl font-black text-crab-red">{formData.points}</span>
                        </div>
                        <div className="text-center p-2 rounded-xl hover:bg-gray-50 transition-colors border-l border-gray-100 hover:scale-105 duration-200">
                            <span className={`block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 ${bodyFontClass}`}>Status</span>
                            <span className="block text-lg font-bold text-gray-700">{formData.status}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className={`text-sm font-bold text-gray-400 uppercase tracking-wider px-2 ${bodyFontClass}`}>Account</h3>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            <Link href="/account/orders" className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all hover:scale-[1.01] active:scale-[0.99] group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-gray-900 transition-colors ${bodyFontClass}`}>{t.profile.myOrders}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </Link>

                            <Link href="/account/addresses" className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all hover:scale-[1.01] active:scale-[0.99] group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-gray-900 transition-colors ${bodyFontClass}`}>{t.profile.addresses}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </Link>

                            <Link href="/account/payment" className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all hover:scale-[1.01] active:scale-[0.99] group">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-gray-900 transition-colors ${bodyFontClass}`}>{t.profile.paymentMethods}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className={`text-sm font-bold text-gray-400 uppercase tracking-wider px-2 ${bodyFontClass}`}>Support</h3>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            <button
                                onClick={() => alert("Support chat is coming soon!")}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-all hover:scale-[1.01] active:scale-[0.99] group text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <HelpCircle className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-gray-900 transition-colors ${bodyFontClass}`}>{t.profile.needHelp}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </button>

                            <button onClick={onLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 active:bg-red-50 transition-all hover:scale-[1.01] active:scale-[0.99] group text-left">
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <LogOut className="w-4 h-4" />
                                    </div>
                                    <span className={`font-semibold text-gray-700 group-hover:text-red-700 transition-colors ${bodyFontClass}`}>{t.profile.logout}</span>
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
