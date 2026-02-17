'use client';

import { motion } from 'framer-motion';

interface ValuesProps {
    data: {
        manifestoTitle: string;
        manifestoText: string;
        brandValues: string[];
    } | null;
}

export function ValuesSection({ data }: ValuesProps) {
    const defaultParagraph = "So, it's 2023. We're in Dhaka, craving good crab. Not the sad, frozen kind—we wanted the REAL deal. But finding it? Harder than finding a rickshaw in the rain. So we said, 'Forget it, let's do it ourselves.' Now we bring the fattest, juiciest crabs from the Bay straight to you. No middlemen, no nonsense. Just pure, messy, delicious happiness. Get your bibs ready!";
    const defaultValues = ["FRESH", "ORGANIC", "PREMIUM", "SUSTAINABLE", "LOCAL", "AUTHENTIC", "HYGIENIC", "DELICIOUS", "CRABTASTIC", "OCEANIC"];

    const paragraph = data?.manifestoText || defaultParagraph;
    const values = (data?.brandValues && data.brandValues.length > 0) ? data.brandValues : defaultValues;
    const title = data?.manifestoTitle || "The Manifesto";

    return (
        <section className="relative py-32 bg-slate-950 overflow-hidden min-h-screen flex flex-col justify-center">

            {/* VERTICAL MARQUEE BACKGROUND */}
            <div className="absolute inset-0 flex justify-between opacity-10 pointer-events-none select-none">
                {/* Left Column - Scroll Up */}
                <div className="w-1/3 md:w-1/4 h-full overflow-hidden relative">
                    <motion.div
                        className="flex flex-col gap-12 py-12"
                        animate={{ y: [0, -1000] }}
                        transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
                    >
                        {[...values, ...values, ...values, ...values].map((value, i) => (
                            <span key={i} className="text-6xl md:text-8xl font-black text-white writing-vertical-lr rotate-180 text-center">
                                {value}
                            </span>
                        ))}
                    </motion.div>
                </div>

                {/* Right Column - Scroll Down */}
                <div className="w-1/3 md:w-1/4 h-full overflow-hidden relative">
                    <motion.div
                        className="flex flex-col gap-12 py-12"
                        animate={{ y: [-1000, 0] }}
                        transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
                    >
                        {[...values, ...values, ...values, ...values].map((value, i) => (
                            <span key={i} className="text-6xl md:text-8xl font-black text-white writing-vertical-lr text-center">
                                {value}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* TEXT REVEAL MANIFESTO */}
            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="text-crab-red font-bold tracking-widest uppercase mb-12 text-sm md:text-base"
                >
                    {title}
                </motion.h3>

                <div className="space-y-4">
                    {paragraph.split('. ').map((sentence, i) => (
                        <div key={i} className="overflow-hidden">
                            <motion.p
                                initial={{ y: "100%", opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                viewport={{ once: true, margin: "-10%" }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.33, 1, 0.68, 1] }}
                                className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight"
                            >
                                {sentence}{i < paragraph.split('. ').length - 1 ? '.' : ''}
                            </motion.p>
                        </div>
                    ))}
                </div>
            </div>

        </section>
    );
}
