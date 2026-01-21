'use client';

import { Suspense, useState, useEffect } from 'react';
import { useCartStore } from '@/lib/store';
import { Minus, Plus, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';
import { CouponSection } from '@/components/client/CouponSection';
import { CartRecommendations } from '@/components/client/CartRecommendations';

import { createOrder } from '@/app/actions/order';
import { toast } from 'sonner';
import { useAdmin } from '@/components/providers/AdminProvider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { StickyCartFooter } from '@/components/client/cart/StickyCartFooter';
import { MobileCartItem } from '@/components/client/cart/MobileCartItem';

interface CartClientProps {
    initialCartTexts: any;
    initialPaymentConfig: any;
    initialSiteConfig: any;
}

export function CartClient({ initialCartTexts, initialPaymentConfig, initialSiteConfig }: CartClientProps) {
    const { items, removeItem, addItem, clearCart, total, discount, coupon } = useCartStore();
    const [isOrderPlaced, setIsOrderPlaced] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const { settings } = useAdmin();
    const searchParams = useSearchParams();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get('action') === 'checkout') {
            setIsCheckoutOpen(true);
        }
    }, [searchParams]);

    // Payment State - Initialize from props
    const [paymentConfig, setPaymentConfig] = useState<any>(initialPaymentConfig);
    const [siteConfig, setSiteConfig] = useState<any>(initialSiteConfig);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [trxId, setTrxId] = useState('');

    // Cart Texts - Initialize from props
    const [cartTexts, setCartTexts] = useState<any>(initialCartTexts);

    useEffect(() => {
        // Initialize payment method based on config
        if (initialPaymentConfig) {
            if (initialPaymentConfig.codEnabled) setPaymentMethod('COD');
            else if (initialPaymentConfig.bkashEnabled) setPaymentMethod('BKASH');
            else if (initialPaymentConfig.nagadEnabled) setPaymentMethod('NAGAD');
            else if (initialPaymentConfig.selfMfsEnabled) setPaymentMethod('MANUAL');
        }
    }, [initialPaymentConfig]);

    // Tax Calculation
    const subTotalAmount = total();
    const discountAmount = discount();
    const discountedTotal = Math.max(0, subTotalAmount - discountAmount);

    const deliveryFee = 60;
    const taxRate = siteConfig?.taxPercentage || 0;
    const taxAmount = Math.ceil((discountedTotal * taxRate) / 100);
    const totalAmount = discountedTotal + deliveryFee + taxAmount;

    // Form State
    // Form State (Default structure + dynamic)
    const [formData, setFormData] = useState<any>({
        name: '',
        phone: '',
        area: '',
        address: ''
    });

    const handleQuantityChange = (item: any, change: number) => {
        if (change === -1 && item.quantity === 1) {
            removeItem(item.id);
        } else {
            addItem({ ...item, quantity: change });
        }
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsAnimating(true);

        const orderData = {
            customerName: formData.name,
            customerPhone: formData.phone,
            customerAddress: `${formData.address}, ${formData.area}`,
            items: items.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: totalAmount, // Including delivery fee & tax
            // Append custom fields to address or ignore for now if schema not ready
            // For now, let's append custom fields to the address string for visibility
            orderNotes: Object.keys(formData)
                .filter(k => !['name', 'phone', 'area', 'address'].includes(k))
                .map(k => {
                    const field = cartTexts?.fields?.find((f: any) => f.id === k);
                    return field ? `${field.label}: ${formData[k]}` : `${k}: ${formData[k]}`;
                })
                .join('\n'),
            couponCode: coupon?.code,
            discountAmount: discountAmount
        };

        if (orderData.orderNotes) {
            orderData.customerAddress += `\n\n[Additional Info]\n${orderData.orderNotes}`;
        }

        const res = await createOrder(orderData);

        if (res.success) {
            // Calculate Points (1 point per 100 Taka)
            const pointsEarned = Math.floor(orderData.totalAmount / 100);

            // Update User Points in LocalStorage if logged in
            const storedUser = localStorage.getItem('crabkhai_user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const newPoints = (user.points || 0) + pointsEarned;

                // Determine Status
                let newStatus = 'Bronze';
                if (newPoints >= 500) newStatus = 'Gold';
                else if (newPoints >= 100) newStatus = 'Silver';

                const updatedUser = { ...user, points: newPoints, status: newStatus };
                localStorage.setItem('crabkhai_user', JSON.stringify(updatedUser));
            }

            toast.success("Order placed successfully!");
            setTimeout(() => {
                setIsCheckoutOpen(false); // Close drawer to show success state
                setIsOrderPlaced(true);
                setIsAnimating(false);
                clearCart();
            }, 2000);
        } else {
            toast.error(res.error || "Failed to place order");
            setIsAnimating(false);
        }
    };

    // Translation Hook
    const { language } = useLanguageStore();
    // Use type assertion to avoid transient typescript error while keys propagate
    const t = translations[language] as any;
    const fontClass = language !== 'en' ? 'font-bangla' : 'font-body';
    const headingClass = language !== 'en' ? 'font-bangla' : 'font-heading';

    if (isOrderPlaced) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <div className="w-64 h-64 mb-6 flex items-center justify-center overflow-hidden">
                    <img
                        src={cartTexts?.successImage || "/congrates_animation.gif"}
                        alt="Order Confirmed"
                        className="w-full h-full object-contain scale-105"
                    />
                </div>
                <h2 className={`text-2xl font-bold text-gray-900 mb-2 ${headingClass}`}>{cartTexts?.successTitle || t.cartPage.successTitle}</h2>
                <p className={`text-gray-500 mb-8 max-w-xs mx-auto ${fontClass}`}>
                    {cartTexts?.successMessage || `We'll call you shortly at ${formData.phone}.`}
                </p>
                <Link
                    href="/"
                    className={`px-8 py-3 bg-crab-red text-white font-bold rounded-xl shadow-lg hover:bg-crab-red/90 transition-all ${fontClass}`}
                >
                    {cartTexts?.backHome || t.cartPage.backHome}
                </Link>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100dvh-80px)] w-full p-4 text-center animate-in fade-in zoom-in duration-700 relative bg-white overflow-hidden">

                <h2 className={`text-3xl md:text-4xl font-black text-gray-900 mb-2 md:mb-3 tracking-tight ${headingClass}`}>
                    {cartTexts?.emptyTitle || t.cartPage.emptyTitle}
                </h2>
                {(!cartTexts || cartTexts.emptyMessage !== cartTexts.emptyTitle) && (
                    <p className={`text-base md:text-lg text-gray-500 mb-2 md:mb-10 max-w-sm mx-auto leading-relaxed font-medium ${fontClass}`}>
                        {cartTexts?.emptyMessage || t.cartPage.emptyMessage}
                    </p>
                )}

                <div className="w-full max-w-[450px] h-auto max-h-[40vh] aspect-square mb-2 flex items-center justify-center relative">
                    <img
                        src={cartTexts?.emptyImage || "/empty_cart_animation.gif"}
                        alt="Empty Cart"
                        className="w-full h-full object-contain"
                    />
                </div>

                <Link
                    href="/menu"
                    className={`relative group px-10 md:px-12 py-4 md:py-5 mt-4 md:mt-8 bg-gradient-to-r from-crab-red to-orange-600 text-white text-lg md:text-xl font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-crab-red/30 hover:shadow-crab-red/40 active:scale-95 transition-all overflow-hidden ${fontClass}`}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {cartTexts?.browseMenu || t.cartPage.browseMenu}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 pt-14 pb-32 lg:pt-20 lg:pb-0">
            <h1 className={`text-2xl md:text-3xl font-black text-gray-900 mb-6 md:mb-8 ${headingClass}`}>
                My Basket <span className="text-gray-400 font-medium text-2xl font-body">({items.length} Items)</span>
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

                {/* Left Column: Items */}
                <div className="lg:col-span-8">
                    {/* Desktop Header */}
                    <div className="hidden md:flex justify-between pb-4 border-b border-gray-200 text-sm font-bold text-gray-500 uppercase tracking-wider">
                        <span>Items</span>
                        <span>Price</span>
                    </div>

                    {/* Mobile Items List */}
                    <div className="md:hidden space-y-3">
                        <AnimatePresence mode="popLayout">
                            {items.map((item) => (
                                <MobileCartItem
                                    key={item.id}
                                    item={item}
                                    onQuantityChange={handleQuantityChange}
                                    onRemove={removeItem}
                                    settings={settings}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Desktop Items List */}
                    <div className="hidden md:block divide-y divide-gray-100">
                        <AnimatePresence mode="popLayout">
                            {items.map((item) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    key={item.id}
                                    className="py-8 flex gap-6 group"
                                >
                                    {/* Image */}
                                    <div className="w-32 h-32 md:w-40 md:h-40 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 relative border border-gray-100">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg md:text-xl mb-1">{item.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Item {item.id.slice(-6)}
                                                </p>
                                            </div>
                                            <div className="text-right md:hidden">
                                                <span className="font-bold text-gray-900 text-lg block">৳{item.price * item.quantity}</span>
                                                {item.quantity > 1 && <span className="text-xs text-gray-400">৳{item.price} x {settings.measurementUnit === 'WEIGHT' ? (() => { const g = item.quantity * (settings.weightUnitValue || 200); return g >= 1000 ? `${(g / 1000).toFixed(1)}kg` : `${g}g`; })() : item.quantity}</span>}
                                            </div>
                                            <span className="hidden md:block font-bold text-gray-900 text-xl">৳{item.price * item.quantity}</span>
                                        </div>

                                        <div className="flex justify-between items-end mt-4">
                                            <div className="flex items-center gap-6">
                                                {/* Quantity Selector Style */}
                                                <div className="flex items-center gap-3 border border-gray-200 rounded-lg p-1">
                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        whileHover={{ backgroundColor: "#f3f4f6" }}
                                                        className="w-8 h-8 flex items-center justify-center rounded text-gray-600 transition-colors"
                                                        onClick={() => handleQuantityChange(item, -1)}
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </motion.button>
                                                    <motion.span
                                                        key={item.quantity}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-sm font-bold min-w-[3rem] text-center"
                                                    >
                                                        {settings.measurementUnit === 'WEIGHT'
                                                            ? (() => {
                                                                const grams = item.quantity * (settings.weightUnitValue || 200);
                                                                return grams >= 1000 ? `${(grams / 1000).toFixed(1)}kg` : `${grams}g`;
                                                            })()
                                                            : item.quantity
                                                        }
                                                    </motion.span>
                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        whileHover={{ backgroundColor: "#f3f4f6" }}
                                                        className="w-8 h-8 flex items-center justify-center rounded text-gray-600 transition-colors"
                                                        onClick={() => handleQuantityChange(item, 1)}
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </motion.button>
                                                </div>

                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-sm font-bold text-gray-400 hover:text-red-500 hover:underline decoration-2 underline-offset-4 transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Consolidated Recommendations Section */}
                    <div className="mt-12 mb-8">
                        <CartRecommendations />
                    </div>
                </div>

                {/* Right Column: Summary Sticky (Desktop Only) */}
                <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-32 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-heading font-black text-gray-900 mb-6">Order Summary</h2>

                        <div className="space-y-4 mb-6 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-bold text-gray-900">৳{subTotalAmount}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping & Handling</span>
                                <span className="font-bold text-gray-900">৳{deliveryFee}</span>
                            </div>
                            {taxRate > 0 && (
                                <div className="flex justify-between">
                                    <span>Estimated Tax ({taxRate}%)</span>
                                    <span className="font-bold text-gray-900">৳{taxAmount}</span>
                                </div>
                            )}

                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600 font-medium">
                                    <span>Discount {coupon?.code && `(${coupon.code})`}</span>
                                    <span>-৳{discountAmount}</span>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-200 my-6"></div>

                        <div className="flex justify-between items-end mb-8">
                            <span className="text-lg font-heading font-bold text-gray-900">Estimated Total</span>
                            <span className="text-2xl font-heading font-black text-crab-red">৳{totalAmount}</span>
                        </div>


                        <div className="space-y-4">
                            {/* Promo Code Accordion Style */}
                            <div className="border-b border-gray-200 pb-4 mb-6">
                                <CouponSection />
                            </div>

                            {/* Form Fields */}
                            <form onSubmit={handlePlaceOrder} className="space-y-4">
                                {/* ... [Desktop Form Same as Before] ... */}
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Delivery Details</h3>

                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        required
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-400"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number"
                                        required
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-all outline-none text-sm placeholder:text-gray-400"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                    <div className="grid grid-cols-3 gap-3">
                                        <Select
                                            value={formData.area}
                                            onValueChange={(val) => setFormData({ ...formData, area: val })}
                                            required
                                        >
                                            <SelectTrigger className="col-span-1 p-3 h-auto bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none data-[placeholder]:text-gray-400">
                                                <SelectValue placeholder="Area" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Dhaka">Dhaka</SelectItem>
                                                <SelectItem value="Ctg">Ctg</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <input
                                            type="text"
                                            placeholder="Address"
                                            required
                                            className="col-span-2 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black transition-all outline-none text-sm"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={isAnimating}
                                        className={`w-full py-4 bg-crab-red text-white font-bold rounded-full shadow-lg hover:bg-red-600 active:scale-95 transition-all text-lg flex items-center justify-center gap-2 ${isAnimating ? 'opacity-80' : ''}`}
                                    >
                                        {isAnimating ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            "Checkout Now"
                                        )}
                                    </button>
                                </div>
                            </form>

                            <p className="text-xs text-center text-gray-500 mt-4">
                                By continuing, you agree to our Terms of Service.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Mobile Sticky Footer with Drawer Form */}
            <StickyCartFooter
                totalAmount={totalAmount}
                itemCount={items.length}
                onCheckout={handlePlaceOrder}
                isAnimating={isAnimating}
                isOpen={isCheckoutOpen}
                onOpenChange={setIsCheckoutOpen}
            >
                <div className="space-y-6">
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-bold">৳{subTotalAmount}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Delivery</span>
                            <span className="font-bold">৳{deliveryFee}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-bold mb-2">
                                <span>Discount</span>
                                <span>-৳{discountAmount}</span>
                            </div>
                        )}
                        <div className="border-t border-orange-200 mt-2 pt-2 flex justify-between text-base font-black text-crab-red">
                            <span>Total</span>
                            <span>৳{totalAmount}</span>
                        </div>
                    </div>

                    <CouponSection />

                    {/* The same form fields but for Mobile Drawer */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-gray-900">Delivery Information</h3>
                        <input
                            type="text"
                            placeholder="Full Name"
                            required
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            required
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                                <Select
                                    value={formData.area}
                                    onValueChange={(val) => setFormData({ ...formData, area: val })}
                                    required
                                >
                                    <SelectTrigger className="w-full h-[58px] bg-white border-gray-200 rounded-xl focus:ring-crab-red/20">
                                        <SelectValue placeholder="Area" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dhaka">Dhaka</SelectItem>
                                        <SelectItem value="Ctg">Ctg</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <input
                                type="text"
                                placeholder="Address"
                                required
                                className="col-span-2 p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </StickyCartFooter>
        </div>
    );
}

function RemoveIcon() {
    return <Trash2 className="w-4 h-4" />
}
