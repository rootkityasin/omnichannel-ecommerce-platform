'use client';

import { motion } from 'framer-motion';

import { TeamMember } from '@/types/common';

interface TeamProps {
    data: TeamMember[] | null;
}

export function TeamSection({ data }: TeamProps) {
    const DEFAULT_TEAM = [
        {
            name: "S. Rahman",
            role: "Founder & Chief Crab Officer",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alexander&backgroundColor=b6e3f4&facialHair=beardLight&top=shortHairShortFlat",
            story: "Started with a bucket and a dream. Now feeds Dhaka's crab cravings."
        },
        {
            name: "Abir H.",
            role: "Head of Operations",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mason&backgroundColor=c0aede&facialHair=beardMedium&top=shortHairTheCaesar",
            story: "Ensures your order gets there faster than you can say 'CrabKhai'."
        },
        {
            name: "Uncle J.",
            role: "Quality Control",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert&backgroundColor=ffdfbf&clothing=collarAndSweater&top=shortHairSides&accessories=prescription02&facialHair=beardMajestic&hairColor=2c1b18",
            story: "Been inspecting crabs since 1985. If it's not perfect, it's not leaving."
        },
        {
            name: "Rootkit",
            role: "The Developer",
            image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Christopher&backgroundColor=e6e6e6&top=winterHat02&clothing=hoodie&accessories=sunglasses&facialHair=beardLight",
            story: "Turns coffee into code and fixing bugs while eating crab."
        }
    ];

    const teamMembers = (data && data.length > 0) ? data : DEFAULT_TEAM;

    return (
        <section className="relative py-32 px-6 bg-slate-900 overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}
            />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-6xl font-black text-white mb-6"
                    >
                        Meet the Crew
                    </motion.h2>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                        The real humans behind your favorite seafood. We don&apos;t bite. (Unlike the crabs).
                    </p>
                </div>

                {/* Spacious Grid - 4 columns for all team members */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 justify-items-center">
                    {teamMembers.map((member, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.2 }}
                            className="group flex flex-col items-center text-center max-w-sm"
                        >
                            <div className="relative mb-8 inline-block w-full">
                                <div className="aspect-square overflow-hidden rounded-3xl bg-slate-800 border-2 border-white/10 group-hover:border-crab-red/50 transition-colors shadow-2xl">
                                    <img
                                        src={member.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                                        alt={member.name}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`;
                                            target.onerror = null;
                                        }}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                                    />
                                </div>
                                <div className="absolute -bottom-6 right-1/2 translate-x-1/2 md:translate-x-0 md:right-6 w-12 h-12 bg-crab-red rounded-full flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                                    👾
                                </div>
                            </div>

                            <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-crab-red transition-colors">{member.name}</h3>
                            <div className="text-orange-400 font-medium tracking-wide uppercase text-sm mb-4">{member.role}</div>
                            <p className="text-slate-400 leading-relaxed text-lg">
                                {member.story}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
