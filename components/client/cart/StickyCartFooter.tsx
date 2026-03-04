"use client";

import { ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";

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

      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[80vh] max-h-[80vh] bg-white border-0 flex flex-col p-0 rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">

          {/* Header */}
          <DrawerHeader className="border-b border-gray-50 flex-shrink-0 pt-4 pb-3 bg-white rounded-t-[32px]">
            <DrawerTitle className="text-2xl font-heading font-black text-center text-slate-900 tracking-tight">
              Checkout
            </DrawerTitle>
            <DrawerDescription className="text-center font-bold text-slate-400 text-xs mt-0.5 font-body uppercase tracking-widest">
              Complete your order
            </DrawerDescription>
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-6 top-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-50 focus:outline-none"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </DrawerHeader>

          {/* Scrollable Form Area */}
          <div className="px-6 py-4 overflow-y-auto overscroll-contain flex-1 pb-32">
            {children}
          </div>

          {/* Sticky bottom button */}
          <div className="px-6 py-3 bg-white border-t border-gray-100 safe-area-bottom flex-shrink-0">
            <Button
              onClick={onCheckout}
              disabled={isAnimating || disabled}
              className="w-full h-11 bg-crab-red hover:bg-orange-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-crab-red/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-heading"
            >
              {isAnimating ? (
                <Loader2 className="animate-spin w-6 h-6" />
              ) : (
                `Place Order - ৳${totalAmount}`
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

