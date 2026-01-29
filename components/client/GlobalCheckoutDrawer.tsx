'use client';

import { useCartStore } from '@/lib/store';
import { Loader2, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createOrder } from '@/app/actions/order';
import { getSiteConfig } from '@/app/actions/settings';
import { CouponSection } from './CouponSection';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/track';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

export function GlobalCheckoutDrawer() {
    const { checkoutOpen, closeCheckout, items, total, discount, clearCart, coupon } = useCartStore();
    const [isAnimating, setIsAnimating] = useState(false);
    const [siteConfig, setSiteConfig] = useState<any>(null);
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Form State
    const [formData, setFormData] = useState<any>({
        name: '',
        phone: '',
        area: '',
        address: ''
    });

    useEffect(() => {
        getSiteConfig().then(setSiteConfig);
    }, []);

    // Track InitiateCheckout when drawer opens
    useEffect(() => {
        if (checkoutOpen && items.length > 0) {
            trackEvent({
                eventName: 'InitiateCheckout',
                eventData: {
                    content_ids: items.map(i => i.id),
                    contents: items.map(i => ({ id: i.id, quantity: i.quantity })),
                    num_items: items.length,
                    value: totalAmount,
                    currency: 'BDT'
                }
            });
        }
    }, [checkoutOpen]);

    // Totals
    const subTotalAmount = total();
    const discountAmount = discount();
    const discountedTotal = Math.max(0, subTotalAmount - discountAmount);
    const deliveryFee = 60;
    const taxRate = siteConfig?.taxPercentage || 0;
    const taxAmount = Math.ceil((discountedTotal * taxRate) / 100);
    const totalAmount = discountedTotal + deliveryFee + taxAmount;

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
            totalAmount: totalAmount,
            couponCode: coupon?.code,
            discountAmount: discountAmount
        };

        const res = await createOrder(orderData);

        if (res.success) {
            // Server-Side Tracking: Purchase
            trackEvent({
                eventName: 'Purchase',
                eventData: {
                    content_ids: items.map(i => i.id),
                    contents: items.map(i => ({ id: i.id, quantity: i.quantity })),
                    num_items: items.length,
                    value: totalAmount,
                    currency: 'BDT',
                    order_id: res.orderId
                },
                userData: {
                    email: '',
                    phone: formData.phone,
                    name: formData.name,
                    area: formData.area,
                    city: 'Dhaka'
                }
            });

            toast.success("Order placed successfully!");
            setTimeout(() => {
                setIsAnimating(false);
                clearCart();
                closeCheckout();
                router.push('/cart');
            }, 1000);
        } else {
            toast.error(res.error || "Failed to place order");
            setIsAnimating(false);
        }
    };

    if (items.length === 0) return null;

    // Shared Form Component
    function CheckoutForm({ className }: { className?: string }) {
        return (
            <form id="checkout-form" onSubmit={handlePlaceOrder} className={`space-y-4 ${className}`}>
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 border-b pb-2">Delivery Details</h3>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Full Name"
                            required
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium text-black"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <input
                            type="tel"
                            placeholder="Phone Number"
                            required
                            className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium text-black"
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
                                    <SelectTrigger className="w-full h-[58px] bg-white border-gray-200 rounded-xl focus:ring-crab-red/20 text-black">
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
                                className="col-span-2 p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all outline-none font-medium text-black"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </form>
        );
    }

    // Shared Order Summary Component
    function OrderSummary() {
        return (
            <div className="space-y-4 h-full">
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 space-y-4 shadow-sm">
                    <h3 className="font-bold text-gray-900 border-b border-orange-200 pb-2">Order Summary</h3>

                    <div className="flex justify-between text-base">
                        <span className="text-gray-600">Subtotal ({items.length} items)</span>
                        <span className="font-bold">৳{subTotalAmount}</span>
                    </div>
                    <div className="flex justify-between text-base">
                        <span className="text-gray-600">Delivery Fee</span>
                        <span className="font-bold">৳{deliveryFee}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-base text-green-600 font-bold">
                            <span>Discount</span>
                            <span>-৳{discountAmount}</span>
                        </div>
                    )}
                    <div className="border-t border-orange-200 pt-3 flex justify-between text-xl font-black text-crab-red">
                        <span>Total to Pay</span>
                        <span>৳{totalAmount}</span>
                    </div>
                </div>

                <div className="pt-2">
                    <CouponSection />
                </div>
            </div>
        );
    }

    // Shared Button Component
    function CheckoutButton() {
        return (
            <Button
                form="checkout-form"
                type="submit"
                disabled={isAnimating}
                className="w-full h-14 bg-crab-red hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-crab-red/20 active:scale-95 transition-all mt-6"
                style={{ backgroundColor: '#E60000' }} // Force color to override any defaults
            >
                {isAnimating ? <Loader2 className="animate-spin w-5 h-5" /> : `Place Order - ৳${totalAmount}`}
            </Button>
        );
    }

    if (isDesktop) {
        return (
            <Dialog open={checkoutOpen} onOpenChange={(open) => !open && closeCheckout()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900">Checkout</DialogTitle>
                        <DialogDescription>Review your order and enter delivery details to complete your purchase.</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                        {/* Right: Order Summary (Displayed first on mobile if we weren't using Dialog for desktop only, but here order doesn't fail accessibility) */}
                        {/* Actually, let's put Summary on right for typical eCommerce feel */}

                        {/* Left: Form */}
                        <div className="order-2 md:order-1">
                            <CheckoutForm />
                            <div className="hidden md:block">
                                <CheckoutButton />
                            </div>
                        </div>

                        {/* Right: Summary */}
                        <div className="order-1 md:order-2">
                            <OrderSummary />
                            {/* Mobile-only button placement if we ever switch back, but here we can just keep it simple */}
                            <div className="md:hidden mt-4">
                                <CheckoutButton />
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Mobile Drawer
    return (
        <Drawer open={checkoutOpen} onOpenChange={(open) => !open && closeCheckout()}>
            <DrawerContent className="max-h-[90vh] bg-white border-t-0">
                <div className="w-full max-w-lg mx-auto bg-white flex flex-col h-full">
                    <DrawerHeader className="border-b border-gray-100 pb-4 bg-white flex-shrink-0">
                        <DrawerTitle className="text-2xl font-black text-center text-slate-900">Checkout</DrawerTitle>
                        <DrawerDescription className="text-center font-medium">
                            Complete your order
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className="p-4 overflow-y-auto flex-1 space-y-6">
                        <OrderSummary />
                        <CheckoutForm />
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100 safe-area-bottom flex-shrink-0">
                        <CheckoutButton />
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
