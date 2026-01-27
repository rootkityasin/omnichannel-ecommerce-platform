'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Palette, Layout, Check, Monitor, Smartphone, RotateCcw, Save, Loader2,
    Menu as MenuIcon, Search, MapPin, ShoppingCart, User, Home, Grid, BookOpen,
    Fish, Utensils, Award, Flame, Star, Package, CreditCard,
    HelpCircle, LogOut, ChevronRight, Phone, Mail, ShieldCheck,
    AlertTriangle, Camera, ArrowRight, Minus, Trash2, Plus, Info, X,
    Laptop, Tablet
} from 'lucide-react';
import { toast } from 'sonner';
import { getSiteConfig, updateSiteConfig } from '@/app/actions/settings';
import { getHeroSlides } from '@/app/actions/hero';
import { getProducts } from '@/app/actions/product';
import { getStorySections } from '@/app/actions/story';
import { StoryLayout } from '@/components/client/Story/StoryLayout';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [primaryColor, setPrimaryColor] = useState('#e60000'); // Default Crab Red
    const [secondaryColor, setSecondaryColor] = useState('#0f172a'); // Default Slate 900
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [config, setConfig] = useState<any>(null);

    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        setPreviewUrl(`${window.location.origin}/?preview=true`);
        loadConfig();
    }, []);

    useEffect(() => {
        // Send updates to iframe
        const frame = document.getElementById('preview-frame') as HTMLIFrameElement;
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage({
                type: 'THEME_PREVIEW',
                primaryColor,
                secondaryColor
            }, '*');
        }
    }, [primaryColor, secondaryColor]);

    async function loadConfig() {
        try {
            const config = await getSiteConfig();

            if (config) {
                setConfig(config);
                // @ts-ignore
                if (config.primaryColor) setPrimaryColor(config.primaryColor);
                // @ts-ignore
                if (config.secondaryColor) setSecondaryColor(config.secondaryColor);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            await updateSiteConfig({
                primaryColor,
                secondaryColor
            });
            toast.success('Theme settings updated successfully');
        } catch (error) {
            toast.error('Failed to update theme settings');
        } finally {
            setSaving(false);
        }
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-crab-red" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-6 animate-in fade-in duration-700">
            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-80px)]">

                {/* Left Panel: Design Controls */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-3 flex flex-col gap-4 h-full"
                >
                    <div className="space-y-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Theme Studio</h1>
                        <p className="text-xs text-slate-500 font-medium">Customize your brand identity.</p>
                    </div>

                    <Card className="flex-1 p-5 border-0 shadow-xl bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 flex flex-col gap-6 overflow-y-auto">

                        {/* Device Toggle */}
                        <div className="bg-slate-100/80 p-1 rounded-xl flex gap-1 justify-center shrink-0">
                            {[
                                { id: 'desktop', icon: Monitor, label: 'Desktop' },
                                { id: 'mobile', icon: Smartphone, label: 'Mobile' }
                            ].map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => setDevice(d.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${device === d.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <d.icon className="w-4 h-4" />
                                    {d.label}
                                </button>
                            ))}
                        </div>

                        {/* Color Controls */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-slate-800">
                                <Palette className="w-4 h-4" />
                                <h2 className="text-sm font-bold">Brand Colors</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="group">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Primary Color</Label>
                                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 group-hover:border-slate-200 transition-colors">
                                        <div className="relative overflow-hidden w-8 h-8 rounded-lg ring-1 ring-slate-200 shadow-inner shrink-0 cursor-pointer">
                                            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0 opacity-0" />
                                            <div className="w-full h-full" style={{ backgroundColor: primaryColor }} />
                                        </div>
                                        <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="font-mono uppercase text-xs h-8 border-0 bg-transparent px-0" />
                                    </div>
                                </div>

                                <div className="group">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Secondary Color</Label>
                                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 group-hover:border-slate-200 transition-colors">
                                        <div className="relative overflow-hidden w-8 h-8 rounded-lg ring-1 ring-slate-200 shadow-inner shrink-0 cursor-pointer">
                                            <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer p-0 border-0 opacity-0" />
                                            <div className="w-full h-full" style={{ backgroundColor: secondaryColor }} />
                                        </div>
                                        <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="font-mono uppercase text-xs h-8 border-0 bg-transparent px-0" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Preview (Removed as we use Iframe) */}

                        <div className="mt-auto pt-4 border-t border-slate-100 flex flex-col gap-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-slate-900/10 active:scale-95 flex items-center justify-center gap-2 text-sm"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {saving ? "Saving..." : "Publish Changes"}
                            </button>
                            <button onClick={() => { setPrimaryColor('#e60000'); setSecondaryColor('#0f172a'); }} className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-bold flex items-center justify-center gap-2">
                                <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                            </button>
                        </div>
                    </Card>
                </motion.div>

                {/* Right Panel: Scalable Preview Area */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-9 bg-slate-200/50 rounded-3xl border border-slate-200/50 p-6 flex flex-col shadow-inner relative overflow-hidden items-center justify-center"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

                    {/* Iframe Container */}
                    <div
                        className={`transition-all duration-500 ease-in-out bg-white shadow-2xl overflow-hidden relative ${device === 'mobile'
                            ? 'w-[375px] h-[720px] rounded-[3rem] border-8 border-slate-900 ring-4 ring-slate-900/10'
                            : 'w-full h-full rounded-xl border border-slate-200'
                            }`}
                    >
                        {/* Mobile Status Bar Mock */}
                        {device === 'mobile' && (
                            <>
                                <div className="absolute top-0 left-0 right-0 h-7 bg-slate-900 z-50 flex items-center justify-between px-6 rounded-t-[2.5rem]">
                                    <span className="text-[10px] font-medium text-white">9:41</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 text-white"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21a9 9 0 0 1-9-9c0-4.97 4.03-9 9-9 9 9 0 0 1 9 9c0 4.97-4.03 9-9 9zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S16.627 0 12 0z" /></svg></div>
                                    </div>
                                </div>
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-50 pointer-events-none" />
                            </>
                        )}

                        <iframe
                            id="preview-frame"
                            src={previewUrl}
                            className="w-full h-full bg-white"
                            style={{
                                border: 'none',
                                paddingTop: device === 'mobile' ? '28px' : '0'
                            }}
                        />
                    </div>

                    <div className="mt-4 text-xs text-slate-400 font-medium">
                        Live Preview • Interacting with actual storefront
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
