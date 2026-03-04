"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";

interface StickyCartFooterProps {
  totalAmount: number;
  itemCount: number;
  isPreview?: boolean;
}

export function StickyCartFooter({
  totalAmount,
  itemCount,
  isPreview,
}: StickyCartFooterProps) {
  const openCheckout = useCartStore((state) => state.openCheckout);

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:hidden z-40 safe-area-bottom">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="font-heading text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">
            Total
          </p>
          <p className="font-heading text-2xl font-black text-slate-900">
            ৳{totalAmount}
          </p>
        </div>

        <Button
          className="font-heading flex-1 h-11 bg-crab-red hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-crab-red/20 active:scale-95 transition-all"
          disabled={isPreview}
          onClick={() => openCheckout()}
        >
          Checkout
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
