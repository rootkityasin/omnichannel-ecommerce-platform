"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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

        <Drawer open={isOpen} onOpenChange={onOpenChange}>
          <DrawerTrigger asChild>
            <Button
              className="font-heading flex-1 h-14 bg-crab-red hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-crab-red/20 active:scale-95 transition-all"
              disabled={isPreview}
            >
              Checkout
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </DrawerTrigger>

          <DrawerContent className="h-[90dvh] bg-white">
            <div className="w-full max-w-lg mx-auto flex flex-col h-full bg-white">
              <DrawerHeader className="border-b border-gray-100 pb-4 bg-white flex-shrink-0">
                <DrawerTitle className="text-2xl font-black text-center text-slate-900">
                  Checkout
                </DrawerTitle>
                <DrawerDescription className="text-center font-medium">
                  Complete your order
                </DrawerDescription>
              </DrawerHeader>

              {/* Scrollable Form Area */}
              <div className="p-4 overflow-y-auto flex-1">{children}</div>

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
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
