'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn, getSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Loader2, ChevronDown } from 'lucide-react';
import { createUser } from '@/app/actions/user';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        contact: '', // Phone or Email
        password: '',
    });

    const handleSocialLogin = (provider: 'google' | 'apple') => {
        setIsLoading(true);
        signIn(provider, { callbackUrl: '/account' });
    };

    // Fix: Reset loading state if user comes back (e.g. presses back button)
    useEffect(() => {
        const handlePageShow = () => setIsLoading(false);
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, []);

    // Also reset on mount just in case
    useEffect(() => {
        setIsLoading(false);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isLogin) {
                // NextAuth Credentials Login
                const res = await signIn('credentials', {
                    phone: `+880${formData.contact}`,
                    password: formData.password,
                    redirect: false,
                });

                if (res?.error) {
                    toast.error("Login failed. Check your credentials.");
                    setIsLoading(false);
                    return;
                }

                // Check Role immediately
                const session = await getSession();
                // @ts-ignore
                const role = session?.user?.role;
                if (role === 'SUPER_ADMIN' || role === 'HUB_ADMIN') {
                    router.push('/admin');
                } else {
                    router.push('/account');
                }
                router.refresh();
            } else {
                // Register
                const res = await createUser({
                    name: formData.name,
                    phone: `+880${formData.contact}`,
                    password: formData.password,
                });

                if (res.success) {
                    toast.success("Account created! Logging you in...");

                    // Auto Login
                    const loginRes = await signIn('credentials', {
                        phone: `+880${formData.contact}`,
                        password: formData.password,
                        redirect: false,
                    });

                    if (loginRes?.error) {
                        toast.error("Login failed. Please try logging in manually.");
                        setIsLogin(true);
                    } else {
                        // Check Role immediately
                        const session = await getSession();
                        // @ts-ignore
                        const role = session?.user?.role;
                        if (role === 'SUPER_ADMIN' || role === 'HUB_ADMIN') {
                            router.push('/admin');
                        } else {
                            router.push('/account');
                        }
                        router.refresh();
                    }
                } else {
                    toast.error(res.error || "Failed to create account.");
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="w-full max-w-md mx-auto pb-20 md:pb-12"
        >
            <div className="text-center mb-6">
                {/* Header Image/Icon - Restored Mascot with Physics-Based Water Drop Effect */}
                <div className="flex justify-center mb-4">
                    <div className="relative">
                        {/* Premium Glow Effect */}
                        <div className="absolute inset-0 bg-crab-red/20 rounded-full blur-2xl animate-pulse" />

                        {/* Rotating Gradient Ring */}
                        <motion.div
                            className="absolute -inset-4 rounded-full border border-crab-red/10 border-t-crab-red/40 border-r-crab-red/40"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                        />

                        {/* Counter-Rotating Inner Ring */}
                        <motion.div
                            className="absolute -inset-1 rounded-full border border-orange-500/5 border-b-orange-500/20"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 12, ease: "linear", repeat: Infinity }}
                        />

                        {/* Impact Mascot */}
                        <motion.div
                            className="relative group cursor-pointer z-10"
                            animate={{
                                scale: [1, 0.95, 1.05, 1],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1.2,
                                ease: "easeInOut",
                            }}
                        >
                            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-xl shadow-gray-200 group-hover:scale-105 transition-transform duration-300">
                                <img src="/mascot-avatar.png" alt="Allow" className="w-full h-full object-cover p-2" />
                            </div>
                        </motion.div>
                    </div>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-1 font-heading">
                    {isLogin ? 'Welcome Back' : 'Join the Family'}
                </h2>
                <p className="text-gray-500 text-sm font-medium font-body">
                    {isLogin ? 'Enter your details to continue' : 'Create an account to get started'}
                </p>
            </div>

            {/* Social Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Button variant="outline" onClick={() => handleSocialLogin('google')} disabled={isLoading} className="h-12 rounded-2xl border-0 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50 hover:ring-crab-red/20 transition-all">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                    Google
                </Button>
                <Button variant="outline" onClick={() => handleSocialLogin('apple')} disabled={isLoading} className="h-12 rounded-2xl border-0 shadow-sm ring-1 ring-gray-100 hover:bg-gray-50 hover:ring-crab-red/20 transition-all">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" /></svg>
                    Apple
                </Button>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase cursor-default">
                    <span className="bg-gray-50 px-2 text-gray-400 font-bold tracking-widest">Or continue with</span>
                </div>
            </div>

            {/* Email/Phone Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait" initial={false}>
                    {!isLogin && (
                        <motion.div
                            key="name-field"
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-2 pb-2">
                                <Label htmlFor="name" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    autoComplete="name"
                                    required
                                    placeholder="e.g. Rakib Hassan"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-6 bg-white rounded-2xl border-0 shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-crab-red/20 font-medium text-gray-900 transition-all font-body"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="space-y-2">
                    <Label htmlFor="contact" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone Number</Label>
                    <div className={`flex items-center w-full bg-white rounded-xl border shadow-sm transition-all focus-within:ring-2 focus-within:ring-crab-red/20 ${formData.contact && !/^1[3-9]\d{8}$/.test(formData.contact)
                            ? 'border-red-500 focus-within:ring-red-200'
                            : 'border-0 ring-1 ring-gray-100'
                        }`}>
                        <div className="pl-4 pr-3 py-3.5 flex items-center justify-center border-r border-gray-100 bg-gray-50/50 rounded-l-xl">
                            <span className="text-gray-500 font-medium text-sm select-none font-body flex items-center gap-1">
                                +880
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            </span>
                        </div>
                        <Input
                            id="contact"
                            name="contact"
                            autoComplete="tel"
                            type="tel"
                            required
                            placeholder="17..."
                            value={formData.contact}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.startsWith('0')) {
                                    setFormData({ ...formData, contact: val.substring(1) });
                                } else {
                                    setFormData({ ...formData, contact: val });
                                }
                            }}
                            maxLength={10}
                            className="w-full px-4 py-3.5 bg-transparent border-0 shadow-none ring-0 focus-visible:ring-0 font-medium text-gray-900 placeholder:text-gray-400 font-body text-base h-auto"
                        />
                    </div>
                    {formData.contact && !/^1[3-9]\d{8}$/.test(formData.contact) && (
                        <p className="text-xs text-red-500 font-medium">Please enter a valid mobile number (e.g. 17...)</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        required
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        minLength={6}
                        className="w-full px-5 py-6 bg-white rounded-2xl border-0 shadow-sm ring-1 ring-gray-100 focus:ring-2 focus:ring-crab-red/20 font-medium text-gray-900 transition-all font-body"
                    />
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="pt-2">
                    <Button
                        type="submit"
                        disabled={
                            isLoading ||
                            !formData.contact ||
                            !/^1[3-9]\d{8}$/.test(formData.contact) ||
                            formData.password.length < 6
                        }
                        className="w-full py-5 bg-crab-red text-white font-bold rounded-2xl shadow-xl shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                        {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (isLogin ? 'Login' : 'Sign Up')}
                    </Button>
                </motion.div>
            </form>

            <div className="mt-6 text-center space-y-3">
                <p className="text-gray-500 text-sm font-medium font-body flex items-center justify-center gap-2">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-crab-red font-black hover:underline transition-all"
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>

                <div className="text-[10px] text-gray-400 font-medium font-body px-8 leading-tight">
                    By continuing, you agree to our <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
                </div>
            </div>
        </motion.div >
    );
}
