'use client';

import { motion } from 'framer-motion';

export function ScrollMouse({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
    const borderColor = theme === 'dark' ? 'border-slate-300' : 'border-white/30';
    const textColor = theme === 'dark' ? 'text-slate-400' : 'text-white/50';

    return (
        <div className="flex flex-col items-center gap-3 opacity-80 hover:opacity-100 transition-opacity duration-300">
            {/* Mouse Icon */}
            <motion.div
                className={`w-6 h-9 border-2 ${borderColor} rounded-full flex justify-center p-1.5 backdrop-blur-sm`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="w-1 h-1.5 bg-crab-red rounded-full"
                    animate={{ y: [0, 8, 0] }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>

            {/* Text */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-[10px] font-bold tracking-[0.3em] uppercase ${textColor} flex items-center gap-2`}
            >
                <span className="text-crab-red">•</span>
                SCROLL
                <span className="text-crab-red">•</span>
            </motion.div>

            {/* Vertical Line */}
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 40, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="w-[1px] bg-gradient-to-b from-crab-red to-transparent"
            />
        </div>
    );
}
