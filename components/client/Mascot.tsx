'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAnimationStore } from '@/lib/animationStore';

type MascotState = 'idle' | 'searching' | 'found' | 'empty' | 'delivery';

interface MascotProps {
    state: MascotState;
    className?: string;
}

export function Mascot({ state, className }: MascotProps) {
    // Delivery run animation state
    const { isDeliveryRunning } = useAnimationStore();
    const [localIsDelivering, setLocalIsDelivering] = useState(false);

    // Sync local state with global store
    useEffect(() => {
        if (isDeliveryRunning) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLocalIsDelivering(true);
        } else {
            // Allow animation to finish visually if needed, or sync immediately
            // eslint-disable-next-line react-hooks/set-state-in-effect
            const timer = setTimeout(() => setLocalIsDelivering(false), 8000);
            return () => clearTimeout(timer);
        }
    }, [isDeliveryRunning]);

    const variants = {
        idle: { y: 0, opacity: 1, scale: 1 },
        searching: { y: 10, rotate: -5, scale: 1.1 },
        found: { y: -10, rotate: 10, scale: 1.2 },
        empty: { rotate: -15, scale: 0.9 },
        hidden: { y: 50, opacity: 0 }
    };

    return (
        <div className={`fixed pointer-events-none z-[60] ${className}`}>
            <AnimatePresence mode="wait">
                {state === 'idle' && (
                    <motion.img
                        key="idle"
                        src="/mascot/pose-idle.png"
                        variants={variants}
                        initial="hidden"
                        animate="idle"
                        exit="hidden"
                        className="w-24 h-24 object-contain filter drop-shadow-lg"
                    />
                )}
                {state === 'searching' && (
                    <motion.img
                        key="searching"
                        src="/mascot/pose-searching.png"
                        variants={variants}
                        initial="hidden"
                        animate="searching"
                        exit="hidden"
                        className="w-24 h-24 object-contain filter drop-shadow-lg"
                    />
                )}
                {state === 'found' && (
                    <motion.img
                        key="found"
                        src="/mascot/pose-happy.png"
                        variants={variants}
                        initial="hidden"
                        animate="found"
                        exit="hidden"
                        className="w-24 h-24 object-contain filter drop-shadow-lg"
                    />
                )}
                {state === 'empty' && (
                    <motion.img
                        key="empty"
                        src="/mascot/pose-eating.png"
                        variants={variants}
                        initial="hidden"
                        animate="empty"
                        exit="hidden"
                        className="w-24 h-24 object-contain filter drop-shadow-lg opacity-80 grayscale-[0.5]"
                    />
                )}
            </AnimatePresence>

            {/* Background Delivery Run */}
            <div className={`fixed bottom-20 left-0 w-full z-[70] pointer-events-none overflow-hidden h-32`}>
                <AnimatePresence>
                    {localIsDelivering && (
                        <motion.img
                            key="delivery-crab"
                            src="/mascot/pose-delivery-cleaned.gif"
                            initial={{ x: '-100vw' }}
                            animate={{ x: '100vw' }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 6, ease: "linear" }}
                            className="w-32 h-32 object-contain absolute bottom-0"
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
