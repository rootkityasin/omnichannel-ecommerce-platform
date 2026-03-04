"use client";

import { ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StickyCartFooterProps {
  totalAmount: number;
  itemCount: number;
  onCheckout: (e: React.FormEvent) => void;
  isAnimating: boolean;
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  isPreview?: boolean;
}

export function StickyCartFooter({
  totalAmount,
  itemCount,
  onCheckout,
  isAnimating,
  children,
  isOpen,
  onOpenChange,
  disabled,
  isPreview,
}: StickyCartFooterProps) {
  return (
    <>
      {/* Bottom bar trigger */}
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
            className="font-heading flex-1 h-14 bg-crab-red hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-crab-red/20 active:scale-95 transition-all"
            disabled={isPreview}
            onClick={() => onOpenChange(true)}
          >
            Checkout
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Full-screen checkout overlay (immune to keyboard resize) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ height: '100%' }}>
          <div className="w-full max-w-lg mx-auto flex flex-col h-full bg-white">
            {/* Header */}
            <div className="border-b border-gray-100 pb-3 pt-4 bg-white flex-shrink-0 relative px-4">
              <h2 className="text-2xl font-black text-center text-slate-900">
                Checkout
              </h2>
              <p className="text-center font-medium text-sm text-slate-500 mt-1">
                Complete your order
              </p>
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-50 focus:outline-none"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Form Area */}
            <div className="p-4 overflow-y-auto overscroll-contain flex-1 pb-28">{children}</div>

            {/* Sticky bottom button */}
            <div className="p-4 bg-white border-t border-gray-100 safe-area-bottom flex-shrink-0">
              <Button
                onClick={onCheckout}
                disabled={isAnimating || disabled}
                className="w-full h-14 bg-crab-red hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-crab-red/20 active:scale-95 transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnimating ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  `Place Order - ৳${totalAmount}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

