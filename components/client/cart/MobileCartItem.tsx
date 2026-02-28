"use client";

import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { CartItem } from "@/lib/store";

interface CartSettings {
  measurementUnit?: string;
  weightUnitValue?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow other settings properties
}

interface MobileCartItemProps {
  item: CartItem;
  onQuantityChange: (item: CartItem, change: number) => void;
  onRemove: (id: string) => void;
  settings: CartSettings;
}

export function MobileCartItem({
  item,
  onQuantityChange,
  settings,
}: MobileCartItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100"
    >
      {/* Image */}
      <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-100">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-heading font-bold text-slate-900 text-base line-clamp-2 leading-tight">
            {item.name}
          </h3>
          <p className="font-body text-xs text-slate-500 mt-1 font-medium">
            {settings.measurementUnit === "WEIGHT"
              ? (() => {
                  const g = item.quantity * (settings.weightUnitValue || 200);
                  return g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${g} g`;
                })()
              : `${item.quantity} units`}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="font-black text-crab-red text-lg font-heading">
            ৳{item.price * item.quantity}
          </span>

          {/* Compact Actions */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{
                scale: 1.1,
                backgroundColor: "#FFF5F5",
                color: "#E02E2E",
              }}
              onClick={() => onQuantityChange(item, -1)}
              className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm border border-slate-200 text-slate-900 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </motion.button>

            <motion.span
              key={item.quantity}
              initial={{ scale: 0.8, y: 5, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              className="text-xs font-bold min-w-[3rem] text-center font-heading"
            >
              {settings.measurementUnit === "WEIGHT"
                ? (() => {
                    const g = item.quantity * (settings.weightUnitValue || 200);
                    return g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${g} g`;
                  })()
                : item.quantity}
            </motion.span>

            <motion.button
              whileTap={{ scale: 0.8 }}
              whileHover={{
                scale: 1.1,
                backgroundColor: "#FFF5F5",
                color: "#E02E2E",
              }}
              onClick={() => onQuantityChange(item, 1)}
              className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm border border-slate-200 text-slate-900 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
