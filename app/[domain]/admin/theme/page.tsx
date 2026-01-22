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
    const [heroSlides, setHeroSlides] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [storyData, setStoryData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('home');
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        try {
            const [config, slides, allProducts, sections] = await Promise.all([
                getSiteConfig(),
                getHeroSlides(),
                getProducts(),
                getStorySections()
            ]);

            if (config) {
                setConfig(config);
                // @ts-ignore
                if (config.primaryColor) setPrimaryColor(config.primaryColor);
                // @ts-ignore
                if (config.secondaryColor) setSecondaryColor(config.secondaryColor);
            }
            if (slides) setHeroSlides(slides.filter((s: any) => s.isActive));
            if (allProducts) setProducts(allProducts);

            if (sections) {
                const getContent = (type: string) => sections.find((s: any) => s.type === type)?.content as any || null;
                const productsContent = getContent('PRODUCTS');
                setStoryData({
                    hero: getContent('HERO'),
                    values: getContent('VALUES'),
                    productsContent: productsContent,
                    gallery: getContent('GALLERY'),
                    team: getContent('TEAM'),
                    wholesale: getContent('WHOLESALE'),
                    reviews: getContent('REVIEWS'),
                });
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

    // --- Mock Data Helpers ---
    const mockCartItems = [
        { id: 1, name: "Live Mud Crab (XL)", price: 1200, quantity: 1, image: products[0]?.image },
        { id: 2, name: "Special Masala Sauce", price: 150, quantity: 2, image: products[1]?.image }
    ];

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

                        {/* Navigation Preview (for Tab Switching) */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-slate-800">
                                <Layout className="w-4 h-4" />
                                <h2 className="text-sm font-bold">Quick Navigate</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {[{ id: 'home', l: 'Home', i: Home }, { id: 'menu', l: 'Menu', i: Grid }, { id: 'story', l: 'Story', i: BookOpen }, { id: 'cart', l: 'Cart', i: ShoppingCart }, { id: 'account', l: 'Account', i: User }].map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setActiveTab(t.id)}
                                        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold border transition-all ${activeTab === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <t.i className="w-3.5 h-3.5" />
                                        {t.l}
                                    </button>
                                ))}
                            </div>
                        </div>

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
                    className="lg:col-span-9 bg-slate-200/50 rounded-3xl border border-slate-200/50 p-6 flex flex-col shadow-inner relative overflow-hidden"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

                    {/* Preview Centering Container */}
                    <div className="flex-1 flex items-center justify-center overflow-auto z-10">

                        {/* DESKTOP FRAME */}
                        {device === 'desktop' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="w-full h-full max-w-[1200px] aspect-video bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden ring-1 ring-slate-900/5"
                            >
                                {/* Browser Toolbar Mock */}
                                <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center px-4 gap-4 shrink-0">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500/20" />
                                    </div>
                                    <div className="flex-1 bg-white h-6 rounded-md border border-slate-200 flex items-center px-3 text-[10px] text-slate-400 font-mono shadow-sm">
                                        crabkhai.com/{activeTab === 'home' ? '' : activeTab}
                                    </div>
                                </div>

                                {/* Desktop Content Scroll Area */}
                                <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                                    {/* Desktop Navbar */}
                                    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500" style={{ '--tw-gradient-from': primaryColor } as any} />
                                            <span className="text-xl font-black text-slate-900 tracking-tighter">CrabKhai</span>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            {['Home', 'Menu', 'Story'].map(Link => (
                                                <div
                                                    key={Link}
                                                    onClick={() => setActiveTab(Link.toLowerCase())}
                                                    className={`text-sm font-bold cursor-pointer transition-colors ${activeTab === Link.toLowerCase() ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                                                    style={activeTab === Link.toLowerCase() ? { color: primaryColor } : {}}
                                                >
                                                    {Link}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 hover:bg-slate-50 rounded-full cursor-pointer"><Search className="w-5 h-5 text-slate-600" /></div>
                                            <div onClick={() => setActiveTab('cart')} className="p-2 hover:bg-slate-50 rounded-full cursor-pointer relative">
                                                <ShoppingCart className="w-5 h-5 text-slate-600" />
                                                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold" style={{ backgroundColor: primaryColor }}>2</span>
                                            </div>
                                            <button onClick={() => setActiveTab('account')} className="px-5 py-2 rounded-full text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor }}>Login</button>
                                        </div>
                                    </div>

                                    {/* CONTENT SWITHCER */}
                                    <div className="min-h-[800px]">
                                        {activeTab === 'home' && (
                                            <>
                                                {/* Hero Desktop */}
                                                <div className="h-[500px] relative bg-slate-900 flex items-center justify-center overflow-hidden">
                                                    {heroSlides.length > 0 && <img src={heroSlides[0].imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                                                    <div className="relative z-10 text-center space-y-6 max-w-2xl px-4">
                                                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/10 text-white text-xs font-bold uppercase tracking-widest">{heroSlides[0]?.title || "Welcome"}</span>
                                                        <h1 className="text-6xl font-black text-white leading-tight font-serif">{heroSlides[0]?.subtitle || "Best Crabs in Town"}</h1>
                                                        <button className="px-8 py-4 rounded-full text-white font-bold text-lg shadow-2xl hover:scale-105 transition-transform" style={{ backgroundColor: primaryColor }}>{heroSlides[0]?.buttonText || "Order Now"}</button>
                                                    </div>
                                                </div>

                                                {/* Desktop Categories */}
                                                <div className="max-w-[1200px] mx-auto -mt-16 relative z-20 px-8 mb-16">
                                                    <div className="bg-white rounded-2xl shadow-xl p-6 grid grid-cols-6 gap-4">
                                                        {[{ name: 'Live Crabs', icon: Fish }, { name: 'Platters', icon: Utensils }, { name: 'Best Sellers', icon: Award }, { name: 'Spicy', icon: Flame }, { name: 'Sides', icon: Star }, { name: 'More', icon: Grid }].map((c, i) => (
                                                            <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                                                <div className="w-14 h-14 rounded-full bg-slate-50 group-hover:bg-white group-hover:shadow-md flex items-center justify-center transition-all border border-slate-100"><c.icon className="w-6 h-6 text-slate-600" /></div>
                                                                <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Desktop Rails */}
                                                <div className="max-w-[1200px] mx-auto px-8 space-y-16 pb-20">
                                                    {['Best Sellers', 'Super Savings'].map((title, i) => (
                                                        <div key={title} className="space-y-6">
                                                            <div className="flex justify-between items-end">
                                                                <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
                                                                <button className="text-sm font-bold hover:underline" style={{ color: primaryColor }}>View All Collection</button>
                                                            </div>
                                                            <div className="grid grid-cols-4 gap-6">
                                                                {products.slice(0, 4).map(p => (
                                                                    <div key={p.id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                                                                        <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                                                                            {p.image && <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />}
                                                                        </div>
                                                                        <div className="p-4">
                                                                            <h3 className="font-bold text-slate-800 mb-1">{p.name}</h3>
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="font-black text-slate-900">৳{p.price}</span>
                                                                                <button className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {/* Pad with mocks if empty */}
                                                                {products.length < 4 && [1, 2, 3, 4].slice(products.length).map(k => (
                                                                    <div key={k} className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 h-[280px] flex items-center justify-center text-slate-300">Product Placeholder</div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'menu' && (
                                            <div className="max-w-[1200px] mx-auto px-8 py-12 flex gap-12">
                                                {/* Sidebar Filters */}
                                                <div className="w-64 shrink-0 space-y-8 sticky top-32 h-fit">
                                                    <div>
                                                        <h3 className="font-bold text-lg mb-4">Search</h3>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Search menu..." />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg mb-4">Categories</h3>
                                                        <div className="space-y-2">
                                                            {['All Items', 'Live Crabs', 'Platters', 'Sides', 'Beverages'].map((c, i) => (
                                                                <div key={c} className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${i === 0 ? 'bg-slate-50 font-bold text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>
                                                                    <span>{c}</span>
                                                                    <span className="text-xs bg-white px-2 py-0.5 rounded border">12</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Product Grid */}
                                                <div className="flex-1">
                                                    <div className="grid grid-cols-3 gap-6">
                                                        {products.map(p => (
                                                            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all">
                                                                <div className="aspect-[4/3] bg-slate-100 relative">
                                                                    {p.image && <img src={p.image} className="w-full h-full object-cover" />}
                                                                </div>
                                                                <div className="p-4">
                                                                    <h3 className="font-bold text-slate-800 text-sm mb-1">{p.name}</h3>
                                                                    <span className="font-black text-slate-900">৳{p.price}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {products.length < 9 && Array.from({ length: 9 - products.length }).map((_, i) => (
                                                            <div key={i} className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 aspect-[3/4]" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'story' && storyData && (
                                            <div className="h-full overflow-y-auto custom-scrollbar bg-slate-950">
                                                <StoryLayout
                                                    data={storyData}
                                                    products={products.filter((p: any) => storyData.productsContent?.productIds?.includes(p.id))}
                                                />
                                            </div>
                                        )}

                                        {activeTab === 'cart' && (
                                            <div className="max-w-6xl mx-auto px-8 py-12">
                                                <h1 className="text-3xl font-bold text-slate-900 mb-8">Shopping Cart</h1>
                                                <div className="grid grid-cols-3 gap-12">
                                                    {/* Cart Items Table */}
                                                    <div className="col-span-2">
                                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                                            <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                                                <div className="col-span-6">Product</div>
                                                                <div className="col-span-2 text-center">Price</div>
                                                                <div className="col-span-2 text-center">Quantity</div>
                                                                <div className="col-span-2 text-right">Total</div>
                                                            </div>
                                                            {mockCartItems.map(item => (
                                                                <div key={item.id} className="grid grid-cols-12 gap-4 p-6 items-center border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                                                                    <div className="col-span-6 flex items-center gap-4">
                                                                        <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                                                            {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="font-bold text-slate-900">{item.name}</h3>
                                                                            <p className="text-xs text-slate-500">XL Size</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-2 text-center font-bold text-slate-600">৳{item.price}</div>
                                                                    <div className="col-span-2 flex justify-center">
                                                                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-2 py-1">
                                                                            <button className="p-1 hover:text-red-500"><Minus className="w-3 h-3" /></button>
                                                                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                                            <button className="p-1 hover:text-green-500"><Plus className="w-3 h-3" /></button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-2 text-right font-black text-slate-900">৳{item.price * item.quantity}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Summary & Checkout */}
                                                    <div className="space-y-6">
                                                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                                                            <h3 className="font-bold text-lg mb-4">Order Summary</h3>
                                                            <div className="space-y-3 pb-6 border-b border-slate-100">
                                                                <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>৳1500</span></div>
                                                                <div className="flex justify-between text-sm text-slate-600"><span>Delivery</span><span>৳60</span></div>
                                                                <div className="flex justify-between text-sm text-slate-600"><span>Discount</span><span className="text-green-500">-৳0</span></div>
                                                            </div>
                                                            <div className="py-4 flex justify-between text-xl font-black text-slate-900">
                                                                <span>Total</span><span>৳1560</span>
                                                            </div>
                                                            <button className="w-full py-4 rounded-xl text-white font-bold text-sm uppercase tracking-wider shadow-xl hover:opacity-90 transition-opacity" style={{ backgroundColor: primaryColor }}>
                                                                Proceed to Checkout
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeTab === 'account' && (
                                            <div className="max-w-4xl mx-auto px-8 py-12">
                                                <div className="flex items-center gap-6 mb-12">
                                                    <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-2xl overflow-hidden relative">
                                                        <img src="/mascot-avatar.png" className="w-full h-full object-cover bg-slate-100" onError={(e) => e.currentTarget.src = "https://github.com/shadcn.png"} />
                                                    </div>
                                                    <div>
                                                        <h1 className="text-3xl font-bold text-slate-900">Welcome back, Foodie!</h1>
                                                        <div className="flex gap-4 mt-2">
                                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200">Gold Member</span>
                                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">1500 Points</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all cursor-pointer group">
                                                        <Package className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                                                        <h3 className="font-bold text-lg">My Orders</h3>
                                                        <p className="text-sm text-slate-500 mt-1">Track active orders and view history</p>
                                                    </div>
                                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all cursor-pointer group">
                                                        <MapPin className="w-8 h-8 text-green-500 mb-4 group-hover:scale-110 transition-transform" />
                                                        <h3 className="font-bold text-lg">Addresses</h3>
                                                        <p className="text-sm text-slate-500 mt-1">Manage delivery locations</p>
                                                    </div>
                                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all cursor-pointer group">
                                                        <CreditCard className="w-8 h-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                                                        <h3 className="font-bold text-lg">Saved Cards</h3>
                                                        <p className="text-sm text-slate-500 mt-1">Manage payment methods</p>
                                                    </div>
                                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 hover:shadow-lg transition-all cursor-pointer group">
                                                        <User className="w-8 h-8 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
                                                        <h3 className="font-bold text-lg">Profile</h3>
                                                        <p className="text-sm text-slate-500 mt-1">Personal details and security</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Desktop Footer Mock */}
                                    <div className="bg-slate-900 text-slate-400 py-12 text-center text-sm border-t border-slate-800">
                                        &copy; 2026 CrabKhai. Designed with intent.
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* MOBILE FRAME (Existing Implementation) */}
                        {device === 'mobile' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="relative w-[340px] h-[700px] bg-slate-900 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-slate-900 overflow-hidden ring-4 ring-slate-900/10 shrink-0"
                            >
                                {/* Status Bar Mock */}
                                <div className="absolute top-0 left-0 right-0 h-8 bg-slate-900 z-50 flex items-center justify-between px-6">
                                    <span className="text-[10px] font-medium text-white">9:41</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 text-white"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21a9 9 0 0 1-9-9c0-4.97 4.03-9 9-9 9 9 0 0 1 9 9c0 4.97-4.03 9-9 9zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S16.627 0 12 0z" /></svg></div>
                                        <div className="w-3 h-3 text-white"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.6 5.6C12.5 2.5 7.5 2.5 4.4 5.6c-3.1 3.1-3.1 8.1 0 11.2l9.9 9.9 9.9-9.9c3.1-3.1 3.1-8.1 0-11.2-3.1-3.1-8.1-3.1-11.2 0z" /></svg></div>
                                    </div>
                                </div>
                                {/* Dynamic Island Notch */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-50 pointer-events-none" />

                                {/* Content Scroll View - Animate on Tab Switch */}
                                <div className="h-full bg-slate-50 pt-8 pb-16 overflow-y-auto no-scrollbar relative">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="min-h-full"
                                        >
                                            {activeTab === 'home' && (
                                                <>
                                                    {/* Hero Banner */}
                                                    <div className="h-48 relative m-4 rounded-2xl overflow-hidden shadow-sm group">
                                                        {heroSlides.length > 0 ? (
                                                            <>
                                                                <img src={heroSlides[0].imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                                                <div className="absolute top-4 left-4">
                                                                    <span className="px-2 py-1 text-[8px] font-bold text-white rounded" style={{ backgroundColor: primaryColor }}>{heroSlides[0].title}</span>
                                                                </div>
                                                                <div className="absolute bottom-4 left-4 right-4">
                                                                    <h2 className="text-white text-2xl font-serif font-bold mb-2">{heroSlides[0].subtitle}</h2>
                                                                    <button className="px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-lg" style={{ backgroundColor: primaryColor }}>{heroSlides[0].buttonText || "Order Now"}</button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">Hero Slide</div>
                                                        )}
                                                    </div>

                                                    {/* Category Nav Mock */}
                                                    <div className="px-4 py-2 mb-2">
                                                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                                            {[{ name: 'Live', icon: Fish }, { name: 'Platters', icon: Utensils }, { name: 'Best', icon: Award }, { name: 'Spicy', icon: Flame }, { name: 'Sides', icon: Star }].map((c, i) => (
                                                                <div key={i} className="flex flex-col items-center gap-1 min-w-[50px]">
                                                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100"><c.icon className="w-5 h-5 text-slate-600" /></div>
                                                                    <span className="text-[9px] font-medium text-slate-600">{c.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Simplified Rails Mock */}
                                                    {['Best Sellers', 'Super Savings', 'New Arrivals'].map((title, i) => (
                                                        <div key={title} className="px-4 py-3">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
                                                                <span className="text-[10px] font-bold" style={{ color: primaryColor }}>View All</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                {products.slice(i, i + 2).map(p => (
                                                                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100" key={p.id}>
                                                                        <div className="aspect-square bg-slate-100 rounded-lg mb-2 relative overflow-hidden">
                                                                            {p.image && <img src={p.image} className="w-full h-full object-cover" />}
                                                                        </div>
                                                                        <div className="h-3 w-3/4 bg-slate-200 rounded mb-1" />
                                                                        <div className="h-3 w-1/2 bg-slate-200 rounded" />
                                                                    </div>
                                                                ))}
                                                                {products.length === 0 && <div className="col-span-2 text-center text-xs text-slate-400 py-4">No products</div>}
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Trust Footer Mock */}
                                                    <div className="mt-6 bg-gradient-to-br from-red-600 to-red-700 text-white py-6 px-4 relative overflow-hidden">
                                                        <div className="absolute -top-4 -left-4 w-20 h-20 bg-white/10 rounded-full blur-xl" />
                                                        <div className="space-y-3 relative z-10 text-center">
                                                            <div className="flex justify-center gap-4 text-xs opacity-90"><Phone className="w-3 h-3" /> <MapPin className="w-3 h-3" /></div>
                                                            <p className="text-[10px] opacity-70">© 2026 CrabKhai</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {activeTab === 'menu' && (
                                                <div className="min-h-full bg-slate-50">
                                                    {/* Header Mock */}
                                                    <div className="sticky top-0 bg-white z-10 px-4 py-3 shadow-sm">
                                                        <h1 className="text-xl font-bold text-slate-900 mb-2">Full Menu</h1>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                            <div className="w-full bg-slate-100 h-9 rounded-lg pl-9 flex items-center text-xs text-slate-500">Search for crabs...</div>
                                                        </div>
                                                    </div>
                                                    {/* Filters */}
                                                    <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
                                                        {['All', 'Live Crabs', 'Platters', 'Sides'].map((f, i) => (
                                                            <div key={i} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap ${i === 0 ? 'text-white' : 'bg-white text-slate-600 border border-slate-200'}`} style={{ backgroundColor: i === 0 ? primaryColor : 'white' }}>{f}</div>
                                                        ))}
                                                    </div>
                                                    {/* Grid */}
                                                    <div className="px-4 pb-20 grid grid-cols-2 gap-3">
                                                        {products.slice(0, 6).map((product: any) => (
                                                            <div key={product.id} className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                                                <div className="aspect-[4/3] bg-slate-100 rounded-lg mb-2 relative overflow-hidden">
                                                                    {product.image && <img src={product.image} className="w-full h-full object-cover" />}
                                                                </div>
                                                                <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mb-1">{product.name}</h4>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-xs font-black text-crab-red">৳{product.price}</span>
                                                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Plus className="w-3 h-3" /></div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'story' && storyData && (
                                                <div className="h-full overflow-y-auto bg-slate-950 no-scrollbar">
                                                    <StoryLayout
                                                        data={storyData}
                                                        products={products.filter((p: any) => storyData.productsContent?.productIds?.includes(p.id))}
                                                    />
                                                </div>
                                            )}

                                            {activeTab === 'cart' && (
                                                <div className="min-h-full bg-slate-50 p-4 pb-20">
                                                    <h1 className="text-xl font-bold text-slate-900 mb-4">Your Cart</h1>
                                                    <div className="space-y-3 mb-6">
                                                        {mockCartItems.map((item) => (
                                                            <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex gap-3">
                                                                <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                                                    {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{item.name}</h4>
                                                                    <p className="text-xs font-bold text-crab-red mt-1">৳{item.price * item.quantity}</p>
                                                                </div>
                                                                <div className="flex flex-col justify-end items-end gap-2">
                                                                    <Trash2 className="w-3.5 h-3.5 text-slate-300" />
                                                                    <div className="flex items-center gap-2 bg-slate-50 rounded-full px-2 py-0.5">
                                                                        <span className="text-[10px]"><Minus className="w-2.5 h-2.5" /></span>
                                                                        <span className="text-xs font-bold">{item.quantity}</span>
                                                                        <span className="text-[10px]"><Plus className="w-2.5 h-2.5" /></span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {/* Summary */}
                                                    <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 mb-6 space-y-2">
                                                        <div className="flex justify-between text-xs text-slate-600"><span>Subtotal</span><span>৳1500</span></div>
                                                        <div className="flex justify-between text-xs text-slate-600"><span>Delivery</span><span>৳60</span></div>
                                                        <div className="border-t border-orange-200/50 my-1" />
                                                        <div className="flex justify-between text-sm font-black text-slate-800"><span>Total</span><span>৳1560</span></div>
                                                    </div>
                                                    {/* Checkout Mock */}
                                                    <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 space-y-3">
                                                        <div className="flex items-center gap-2 mb-2"><div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">1</div><h3 className="text-sm font-bold">Details</h3></div>
                                                        <div className="h-9 bg-slate-50 rounded border border-slate-200 w-full" />
                                                        <div className="h-9 bg-slate-50 rounded border border-slate-200 w-full" />
                                                        <div className="h-20 bg-slate-50 rounded border border-slate-200 w-full" />
                                                        <div className="flex gap-2 pt-2">
                                                            <div className="flex-1 p-3 border border-crab-red bg-red-50 rounded-lg flex flex-col items-center justify-center gap-1">
                                                                <div className="w-3 h-3 rounded-full bg-crab-red" />
                                                                <span className="text-[9px] font-bold">COD</span>
                                                            </div>
                                                            <div className="flex-1 p-3 border border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 opacity-60">
                                                                <div className="w-3 h-3 rounded-full border border-slate-400" />
                                                                <span className="text-[9px] font-bold">bKash</span>
                                                            </div>
                                                        </div>
                                                        <button className="w-full py-3 bg-crab-red text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg" style={{ backgroundColor: primaryColor }}>
                                                            Confirm Order
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {activeTab === 'account' && (
                                                <div className="min-h-full bg-slate-50">
                                                    {/* Header Profile Card */}
                                                    <div style={{ backgroundColor: primaryColor }} className="text-white p-6 pt-10 rounded-b-[2rem] shadow-xl relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                                                        <div className="relative z-10 flex flex-col items-center">
                                                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/20 mb-3 overflow-hidden">
                                                                <img src="/mascot-avatar.png" className="w-full h-full object-cover" onError={(e) => e.currentTarget.src = "https://github.com/shadcn.png"} />
                                                            </div>
                                                            <h1 className="text-lg font-bold">Foodie Member</h1>
                                                            <p className="text-white/60 text-xs">+880 1700 000 000</p>
                                                            <div className="mt-4 flex gap-4 w-full">
                                                                <div className="flex-1 bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
                                                                    <div className="text-[10px] uppercase opacity-70">Points</div>
                                                                    <div className="text-lg font-black">150</div>
                                                                </div>
                                                                <div className="flex-1 bg-white/10 rounded-xl p-2 text-center backdrop-blur-sm">
                                                                    <div className="text-[10px] uppercase opacity-70">Status</div>
                                                                    <div className="text-lg font-black">Bronze</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Menu Items */}
                                                    <div className="p-4 space-y-3 -mt-2">
                                                        <div className="bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                                                            {[
                                                                { l: 'My Orders', i: Package, c: 'text-blue-500', b: 'bg-blue-50' },
                                                                { l: 'Addresses', i: MapPin, c: 'text-green-500', b: 'bg-green-50' },
                                                                { l: 'Payments', i: CreditCard, c: 'text-purple-500', b: 'bg-purple-50' }
                                                            ].map((m, i) => (
                                                                <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-full ${m.b} ${m.c} flex items-center justify-center`}><m.i className="w-4 h-4" /></div>
                                                                        <span className="text-sm font-bold text-slate-700">{m.l}</span>
                                                                    </div>
                                                                    <ChevronRight className="w-4 h-4 text-slate-300" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="bg-white rounded-xl p-1 shadow-sm border border-slate-100">
                                                            <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
                                                                    <span className="text-sm font-bold text-slate-700">Logout</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>


                                {/* Bottom Dock Navigation - Matching Real Frontend */}
                                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-16 px-6 pb-2 grid grid-cols-5 items-center z-50">
                                    {[
                                        { id: 'home', icon: Home, label: 'Home' },
                                        { id: 'menu', icon: Grid, label: 'Menu' },
                                        { id: 'story', icon: BookOpen, label: 'Story' },
                                        { id: 'cart', icon: ShoppingCart, label: 'Cart', badge: 2 },
                                        { id: 'account', icon: User, label: 'Account' }
                                    ].map((tab) => (
                                        <div
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className="flex flex-col items-center justify-center gap-1 cursor-pointer group"
                                            style={{ color: activeTab === tab.id ? primaryColor : '#cbd5e1' }}
                                        >
                                            <div className="relative transition-transform duration-200 group-active:scale-90">
                                                <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-current' : ''}`} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                                                {tab.badge && (
                                                    <div className="absolute -top-1.5 -right-1.5 bg-crab-red text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white" style={{ backgroundColor: primaryColor }}>
                                                        {tab.badge}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Home Indicator */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/20 rounded-full z-50 pointer-events-none" />
                            </motion.div>
                        )}

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
