'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/store';
import { validateCoupon } from '@/app/actions/coupon';
import { toast } from 'sonner';
import { Loader2, Ticket, X } from 'lucide-react';
import { useSettings } from '@/components/providers/SettingsProvider';

export function CouponSection() {
    const { coupon, applyCoupon, removeCoupon, total } = useCartStore();
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { settings } = useSettings();

    const handleApply = async () => {
        if (!code) return;
        setLoading(true);

        try {
            // We need tenantId to validate coupon correctly.
            // Ideally 'settings' has it.
            const tenantId = (settings as any)?.tenantId;
            const result = await validateCoupon(code, total(), tenantId);
            if (result.success && result.code) { // Check for code existence to satisfy type checker if needed, mainly result.success is enough
                applyCoupon({
                    code: result.code!,
                    type: result.type as 'PERCENTAGE' | 'FIXED', // Ensure type matches literal
                    value: result.value as number
                });
                // Note: validateCoupon returns 'discount' as the calculated value?
                // Wait, store expects 'value' to be the coupon's intrinsic value (e.g. 10% or 100tk).
                // validateCoupon returns 'discount' which IS the calculated amount?
                // Let's check validateCoupon return type.
                // It returns { discount, code, type }.
                // If type is PERCENTAGE, discount is calculated amount.
                // The store's discount() function CALCULATES it again.
                // So the store needs the INTRINSIC value (e.g. 10 for 10%).
                // My validateCoupon currently returns the calculated discount.
                // I should modify validateCoupon to return 'value' (intrinsic) OR modify store to accept 'calculatedDiscount'?
                // Store needs to handle cart updates (e.g. add new item -> discount increases).
                // So Store needs INTRINSIC value.
                // I need to update validateCoupon to return 'value' (the raw coupon value).

                toast.success("Coupon applied!");
                setCode('');
            } else {
                toast.error(result.error || "Invalid coupon");
            }
        } catch (error) {
            toast.error("Failed to apply coupon");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = () => {
        removeCoupon();
        toast.info("Coupon removed");
    };

    if (coupon) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in zoom-in">
                <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-green-600" />
                    <div>
                        <p className="text-sm font-bold text-green-700 uppercase tracking-wide">{coupon.code}</p>
                        <p className="text-xs text-green-600">
                            Applied
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleRemove}
                    className="p-1 hover:bg-green-100 rounded-full text-green-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-crab-red font-bold hover:underline flex items-center gap-2 mb-4 group"
            >
                <Ticket className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                Have a promo code?
            </button>
        );
    }

    return (
        <div className="flex gap-2 mb-4 animate-in slide-in-from-top-2 fade-in">
            <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PROMO CODE"
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-crab-red/20 focus:border-crab-red transition-all uppercase placeholder:normal-case font-mono"
                disabled={loading}
                autoFocus
            />
            <button
                onClick={handleApply}
                disabled={loading || !code}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-w-[80px] flex items-center justify-center"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
            </button>
        </div>
    );
}
