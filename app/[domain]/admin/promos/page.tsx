// Imports were: import { getPromos, createPromo, deletePromo, togglePromoStatus } from '@/app/actions/promo';
// I need to add coupon actions. 
// Since I can't easily edit imports with this tool if they are scattered or I want to stay safe, I'll read the file first to be sure or just do a smart replace.
// Actually, I'll do a focused replace on the specific sections.

// Changing the imports:
// ...

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ticket, Copy, Trash2, Plus, X, Calendar, Image as ImageIcon, Check, LayoutTemplate, Pencil } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import { getPromos, createPromo, deletePromo, togglePromoStatus, updatePromo } from '@/app/actions/promo';
import { getCoupons, createCoupon, deleteCoupon, updateCoupon, toggleCouponStatus } from '@/app/actions/coupon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PromoPage() {
    // --- STATE ---
    const [loading, setLoading] = useState(true);

    // Promos
    const [promoCards, setPromoCards] = useState<any[]>([]);
    const [isAddingCard, setIsAddingCard] = useState(false);
    const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
    const [newCard, setNewCard] = useState({
        title: '',
        description: '',
        imageUrl: '',
        isActive: true,
        style: 'CLASSIC',
        buttonText: 'Order Now',
        buttonLink: '/menu',
        price: '',
        originalPrice: ''
    });

    // Coupons
    const [coupons, setCoupons] = useState<any[]>([]);
    const [isAddingCoupon, setIsAddingCoupon] = useState(false);
    const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'FIXED', // 'PERCENTAGE' | 'FIXED'
        discountValue: '',
        minOrderAmount: '',
        expiresAt: '',
        usageLimit: ''
    });

    // --- EFFECTS ---
    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = async () => {
        setLoading(true);
        const [pData, cData] = await Promise.all([getPromos(), getCoupons()]);
        setPromoCards(pData);
        setCoupons(cData);
        setLoading(false);
    };

    // --- PROMO HANDLERS ---
    const handleDeleteCard = async (id: string) => {
        if (confirm('Delete this promo card?')) {
            const res = await deletePromo(id);
            if (res.success) {
                toast.success("Promo deleted");
                refreshData();
            } else {
                toast.error("Failed to delete");
            }
        }
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();

        let res;
        if (editingPromoId) {
            res = await updatePromo(editingPromoId, newCard);
        } else {
            res = await createPromo(newCard);
        }

        if (res.success) {
            toast.success(editingPromoId ? "Promo updated!" : "Promo created successfully!");
            setIsAddingCard(false);
            setEditingPromoId(null);
            setNewCard({
                title: '',
                description: '',
                imageUrl: '',
                isActive: true,
                style: 'CLASSIC',
                buttonText: 'Order Now',
                buttonLink: '/menu',
                price: '',
                originalPrice: ''
            });
            refreshData();
        } else {
            toast.error(res.error || "Failed to save promo");
        }
    };

    const handleEditPromo = (card: any) => {
        setNewCard({
            title: card.title,
            description: card.description || '',
            imageUrl: card.imageUrl,
            isActive: card.isActive,
            style: card.style || 'CLASSIC',
            buttonText: card.buttonText || '',
            buttonLink: card.buttonLink || '',
            price: card.price || '',
            originalPrice: card.originalPrice || ''
        });
        setEditingPromoId(card.id);
        setIsAddingCard(true);
    };

    const toggleCardStatus = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        const updatedCards = promoCards.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c);
        setPromoCards(updatedCards);

        // If turning ON, turn others OFF optimistically
        if (!currentStatus) {
            setPromoCards(prev => prev.map(c => c.id === id ? { ...c, isActive: true } : { ...c, isActive: false }));
        }

        const res = await togglePromoStatus(id, !currentStatus);
        if (!res.success) {
            toast.error("Failed to update status");
            refreshData(); // Revert
        } else {
            refreshData(); // Sync
        }
    };

    // --- COUPON HANDLERS ---
    const handleAddCoupon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCoupon.code || !newCoupon.discountValue) {
            toast.error("Code and Discount Value are required");
            return;
        }

        let res;
        if (editingCouponId) {
            res = await updateCoupon(editingCouponId, newCoupon);
        } else {
            res = await createCoupon(newCoupon);
        }

        if (res.success) {
            toast.success(editingCouponId ? "Coupon updated!" : "Coupon created!");
            setIsAddingCoupon(false);
            setEditingCouponId(null);
            setNewCoupon({
                code: '',
                discountType: 'FIXED',
                discountValue: '',
                minOrderAmount: '',
                expiresAt: '',
                usageLimit: ''
            });
            refreshData();
        } else {
            toast.error(res.error || "Failed to save coupon");
        }
    };

    const handleEditCoupon = (coupon: any) => {
        setNewCoupon({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: String(coupon.discountValue),
            minOrderAmount: String(coupon.minOrderAmount),
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
            usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : ''
        });
        setEditingCouponId(coupon.id);
        setIsAddingCoupon(true);
    };

    const handleDeleteCoupon = async (id: string) => {
        if (confirm("Delete this coupon?")) {
            await deleteCoupon(id);
            refreshData();
            toast.success("Coupon deleted");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Code copied!");
    };

    const toggleCoupon = async (id: string, currentStatus: boolean) => {
        // Optimistic update
        const updatedCoupons = coupons.map(c => c.id === id ? { ...c, isActive: !currentStatus } : c);
        setCoupons(updatedCoupons);

        const res = await toggleCouponStatus(id, !currentStatus);
        if (!res.success) {
            toast.error("Failed to update status");
            refreshData(); // Revert
        } else {
            refreshData(); // Sync
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Promotions</h1>
                    <p className="text-sm text-slate-500">Manage coupons and website popups.</p>
                </div>
            </div>

            <Tabs defaultValue="popups" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="popups">Website Popups</TabsTrigger>
                    <TabsTrigger value="coupons">Coupons</TabsTrigger>
                </TabsList>

                {/* --- POPUPS TAB --- */}
                <TabsContent value="popups" className="mt-6 space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={() => {
                            setEditingPromoId(null);
                            setNewCard({
                                title: '',
                                description: '',
                                imageUrl: '',
                                isActive: true,
                                style: 'CLASSIC',
                                buttonText: 'Order Now',
                                buttonLink: '/menu',
                                price: '',
                                originalPrice: ''
                            });
                            setIsAddingCard(true);
                        }} className="bg-ocean-blue hover:bg-ocean-blue/90 text-white shadow-lg shadow-blue-900/20">
                            <Plus className="w-4 h-4 mr-2" /> Create Popup
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400">Loading data...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {promoCards.map((card) => (
                                <Card key={card.id} className={`overflow-hidden group relative flex flex-col h-full border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 ${card.isActive ? 'ring-2 ring-green-500/20' : ''}`}>
                                    <div className="relative h-48 bg-slate-900">
                                        {card.imageUrl && (
                                            <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        <div className="absolute top-3 left-3">
                                            <Badge variant="outline" className="bg-black/40 text-white border-white/20 backdrop-blur-md">
                                                {card.style === 'DARK' ? 'Dark Mode' : 'Classic Mode'}
                                            </Badge>
                                        </div>

                                        <div className="absolute top-3 right-3">
                                            <Badge className={`${card.isActive ? 'bg-green-500' : 'bg-slate-400'} text-white border-none shadow-lg`}>
                                                {card.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{card.title}</h3>
                                            {card.price && (
                                                <span className="font-mono text-sm font-bold text-crab-red">৳{card.price}</span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{card.description}</p>

                                        {card.buttonText && (
                                            <div className="mb-4 pt-2 border-t border-dashed border-slate-100">
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <span className="font-medium text-slate-600">CTA:</span> {card.buttonText}
                                                    <span className="text-slate-300">&rarr;</span>
                                                    <span className="truncate max-w-[100px]">{card.buttonLink}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={card.isActive}
                                                    onCheckedChange={() => toggleCardStatus(card.id, card.isActive)}
                                                />
                                                <span className={`text-xs font-medium ${card.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                                                    {card.isActive ? 'Live' : 'Off'}
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleEditPromo(card)}
                                                    className="text-slate-400 hover:text-blue-500 p-2 hover:bg-blue-50 rounded-full transition-colors"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCard(card.id)}
                                                    className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {promoCards.length === 0 && (
                                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                    <LayoutTemplate className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="font-medium">No active promo popups.</p>
                                    <p className="text-xs opacity-70 mt-1">Create one to engage your visitors.</p>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* --- COUPONS TAB --- */}
                <TabsContent value="coupons" className="mt-6 space-y-6">
                    <div className="flex justify-end">
                        <Button onClick={() => {
                            setEditingCouponId(null);
                            setNewCoupon({
                                code: '',
                                discountType: 'FIXED',
                                discountValue: '',
                                minOrderAmount: '',
                                expiresAt: '',
                                usageLimit: ''
                            });
                            setIsAddingCoupon(true);
                        }} className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20">
                            <Plus className="w-4 h-4 mr-2" /> Create Coupon
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {coupons.map((coupon) => (
                            <Card key={coupon.id} className="p-0 border-dashed border-2 border-orange-200 bg-orange-50/30 relative overflow-hidden group hover:border-orange-300 transition-colors">
                                <div className="absolute top-0 right-0 p-3 bg-orange-100 rounded-bl-2xl text-orange-600">
                                    <Ticket className="w-5 h-5" />
                                </div>

                                <div className="p-6 pb-4">
                                    <div className="flex items-baseline gap-1 mb-1">
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                            {coupon.discountType === 'FIXED' && '৳'}
                                            {coupon.discountValue}
                                            {coupon.discountType === 'PERCENTAGE' && '%'}
                                        </h2>
                                        <span className="text-sm font-bold text-orange-600 uppercase">OFF</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4 font-medium">
                                        Min. Order: ৳{coupon.minOrderAmount}
                                    </p>

                                    <div className="bg-white p-3 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm group-hover:shadow-md transition-shadow">
                                        <code className="font-mono font-bold text-orange-600 text-lg tracking-widest">{coupon.code}</code>
                                        <button onClick={() => copyToClipboard(coupon.code)} className="text-gray-400 hover:text-gray-600 active:scale-95 transition-transform p-1 hover:bg-gray-100 rounded">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="px-6 py-3 bg-white/50 border-t border-orange-100 flex justify-between items-center text-xs text-slate-500">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-slate-400" />
                                            {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'No Expiry'}
                                        </span>
                                        {coupon.usageLimit && (
                                            <span className="text-xs">
                                                Used: {coupon.usedCount} / {coupon.usageLimit}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <Switch
                                                checked={coupon.isActive}
                                                onCheckedChange={() => toggleCoupon(coupon.id, coupon.isActive)}
                                                className="scale-75 origin-left"
                                            />
                                            <span className={`text-[10px] font-bold ${coupon.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                                                {coupon.isActive ? 'LIVE' : 'OFF'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEditCoupon(coupon)} className="text-blue-400 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition-colors flex items-center gap-1">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors flex items-center gap-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {coupons.length === 0 && (
                            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                <Ticket className="w-12 h-12 mb-3 opacity-20" />
                                <p className="font-medium">No active coupons.</p>
                                <p className="text-xs opacity-70 mt-1">Create codes to drive sales.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- ADD COUPON MODAL --- */}
            {isAddingCoupon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm animate-in zoom-in-95 duration-200 p-6 shadow-2xl border-none">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{editingCouponId ? 'Edit Coupon' : 'New Coupon'}</h2>
                                    <p className="text-xs text-slate-500">{editingCouponId ? 'Update discount details' : 'Create a discount code'}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddingCoupon(false)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleAddCoupon} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Coupon Code</Label>
                                <Input
                                    placeholder="e.g. SUMMER25"
                                    value={newCoupon.code}
                                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    required
                                    className="font-mono uppercase tracking-widest placeholder:tracking-normal"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={newCoupon.discountType}
                                        onValueChange={(val) => setNewCoupon({ ...newCoupon, discountType: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FIXED">Fixed (৳)</SelectItem>
                                            <SelectItem value="PERCENTAGE">Percent (%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Value</Label>
                                    <Input
                                        type="number"
                                        placeholder="e.g. 100"
                                        value={newCoupon.discountValue}
                                        onChange={e => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Min Order (৳)</Label>
                                    <Input type="number" value={newCoupon.minOrderAmount} onChange={e => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expires</Label>
                                    <Input type="date" value={newCoupon.expiresAt} onChange={e => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Usage Limit (Optional)</Label>
                                <Input type="number" placeholder="e.g. 100" value={newCoupon.usageLimit} onChange={e => setNewCoupon({ ...newCoupon, usageLimit: e.target.value })} />
                            </div>

                            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-11 shadow-lg shadow-orange-900/10">
                                {editingCouponId ? 'Update Coupon' : 'Create Coupon'}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}

            {/* --- ADD POPUP MODAL (Kept same as before but ensured integration) --- */}
            {isAddingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 p-0 shadow-2xl border-none">
                        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">{editingPromoId ? 'Edit Promotion' : 'New Promotion Popup'}</h2>
                                    <p className="text-xs text-slate-500">Create engaging popups for your visitors</p>
                                </div>
                                <p className="text-xs text-slate-500">Create engaging popups for your visitors</p>
                            </div>
                            <button onClick={() => setIsAddingCard(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>

                        <form onSubmit={handleAddCard} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column: Content */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Campaign Title</Label>
                                        <Input placeholder="e.g. Winter Flash Sale" value={newCard.title} onChange={e => setNewCard({ ...newCard, title: e.target.value })} required />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea placeholder="Short impactful message..." value={newCard.description} onChange={e => setNewCard({ ...newCard, description: e.target.value })} rows={3} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Popup Style</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div
                                                onClick={() => setNewCard({ ...newCard, style: 'CLASSIC' })}
                                                className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${newCard.style === 'CLASSIC' ? 'border-ocean-blue bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <div className="w-full h-12 bg-white rounded border border-slate-200 shadow-sm"></div>
                                                <span className="text-xs font-bold text-slate-600">Classic (White)</span>
                                            </div>
                                            <div
                                                onClick={() => setNewCard({ ...newCard, style: 'DARK' })}
                                                className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center gap-2 transition-all ${newCard.style === 'DARK' ? 'border-crab-red bg-red-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <div className="w-full h-12 bg-slate-900 rounded border border-slate-700 shadow-sm"></div>
                                                <span className="text-xs font-bold text-slate-600">Dark (Premium)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Price (Optional)</Label>
                                            <Input placeholder="e.g. 1200" value={newCard.price} onChange={e => setNewCard({ ...newCard, price: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Original Price</Label>
                                            <Input placeholder="e.g. 1320" value={newCard.originalPrice} onChange={e => setNewCard({ ...newCard, originalPrice: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Visuals & CTA */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Hero Image</Label>
                                        <ImageUpload
                                            value={newCard.imageUrl}
                                            onChange={(url) => setNewCard({ ...newCard, imageUrl: url })}
                                            onRemove={() => setNewCard({ ...newCard, imageUrl: '' })}
                                            recommendedSize="600x600 (Square)"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Button Label</Label>
                                            <Input placeholder="e.g. Order Now" value={newCard.buttonText} onChange={e => setNewCard({ ...newCard, buttonText: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Button Link</Label>
                                            <Input placeholder="e.g. /menu" value={newCard.buttonLink} onChange={e => setNewCard({ ...newCard, buttonLink: e.target.value })} />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between border border-slate-100 mt-4">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Active Immediately</Label>
                                            <p className="text-xs text-slate-500">Will replace any currently active popup</p>
                                        </div>
                                        <Switch checked={newCard.isActive} onCheckedChange={c => setNewCard({ ...newCard, isActive: c })} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddingCard(false)}>Cancel</Button>
                                <Button type="submit" className="flex-1 bg-ocean-blue hover:bg-ocean-blue/90">{editingPromoId ? 'Update Promotion' : 'Create Promotion'}</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
