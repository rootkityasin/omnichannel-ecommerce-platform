'use client';

import { useAnimationStore } from "@/lib/animationStore";
import { normalizeMediaUrl } from "@/lib/media";
import { AnimatePresence, motion } from "framer-motion";

export function FlyOverlay() {
    const { flyingItems, targetRect, removeFlyItem } = useAnimationStore();

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
            <AnimatePresence>
                {flyingItems.map((item) => (
                    <FlyItem
                        key={item.id}
                        item={item}
                        targetRect={targetRect}
                        onComplete={() => removeFlyItem(item.id)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FlyItem({ item, targetRect, onComplete }: { item: any, targetRect: any, onComplete: () => void }) {
    if (!targetRect) return null;

    return (
        <motion.img
            src={normalizeMediaUrl(item.image)}
            initial={{
                position: 'absolute',
                top: item.startRect.top,
                left: item.startRect.left,
                width: item.startRect.width,
                height: item.startRect.height,
                opacity: 1,
                scale: 1,
                borderRadius: '8px'
            }}
            animate={{
                top: targetRect.top + 10, // Center in target
                left: targetRect.left + 10,
                width: 20,
                height: 20,
                opacity: 0.5,
                scale: 0.5,
                transition: { duration: 0.8, ease: "easeInOut" }
            }}
            exit={{ opacity: 0 }}
            onAnimationComplete={onComplete}
            className="object-cover shadow-xl border-2 border-white rounded-full"
        />
    );
}
