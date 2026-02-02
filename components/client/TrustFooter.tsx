'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, ShieldCheck, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface TrustFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    config?: {
        contactPhone: string;
        contactEmail: string;
        contactAddress: string;
        shopName?: string;
        logoUrl?: string;
        allergensText: string;
        certificates: string[];
        privacyPolicy?: string;
        refundPolicy?: string;
        termsPolicy?: string;
    } | null;
}

import { useState } from 'react';

export default function TrustFooter({ config, ...props }: TrustFooterProps) {
    const [policyOpen, setPolicyOpen] = useState<'privacy' | 'refund' | 'terms' | null>(null);

    // Direct usage of props - no client-side refetching needed
    // The parent (HomeClient) already provides the server-fetched config

    // Default Fallbacks
    const phone = config?.contactPhone || "";
    const email = config?.contactEmail || "";
    const address = config?.contactAddress || "";
    const allergenText = config?.allergensText || "";
    const shopName = config?.shopName || "CrabKhai"; // Keep brand name fallback if desired, or make empty
    const logoUrl = config?.logoUrl || "";

    const certificates = config?.certificates || [];
    return (
        <section className="bg-gradient-to-br from-red-600 to-red-700 text-white pt-12 pb-32 md:pb-8 px-4 overflow-hidden relative">
            {/* Artistic Background Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-br-full blur-2xl" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-black/10 rounded-tl-full blur-2xl" />

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">

                {/* Contact Section - Only show if at least one contact method exists */}
                {(phone || email || address) && (
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-3"
                    >
                        <div className="inline-block px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium tracking-wider mb-1">
                            OFFICIAL CONTACT
                        </div>

                        <div className="space-y-2">
                            {phone && (
                                <a
                                    href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                                    className="flex items-start gap-4 group p-2 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10 cursor-pointer"
                                >
                                    <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors shadow-sm shrink-0">
                                        <Phone className="w-4 h-4" />
                                    </div>
                                    <span className="font-mono text-base tracking-wide group-hover:text-amber-200 transition-colors break-all pt-1.5">{phone}</span>
                                </a>
                            )}

                            {address && (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-4 group p-2 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10 cursor-pointer"
                                >
                                    <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors shadow-sm shrink-0">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium text-sm group-hover:text-amber-200 transition-colors pt-1.5">{address}</span>
                                </a>
                            )}

                            {email && (
                                <a
                                    href={`mailto:${email}`}
                                    className="flex items-start gap-4 group p-2 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10 cursor-pointer"
                                >
                                    <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors shadow-sm shrink-0">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm opacity-90 group-hover:text-amber-200 transition-colors break-all pt-1.5">{email}</span>
                                </a>
                            )}
                        </div>

                        {/* Allergens Warning - Only show if text exists */}
                        {allergenText && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <div className="flex items-start gap-3 text-red-100 bg-red-900/30 p-3 rounded-xl backdrop-blur-sm border border-red-500/30">
                                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-300 animate-pulse" />
                                    <div>
                                        <h4 className="font-bold text-sm uppercase tracking-wider text-amber-200 mb-1">Consumer Advisory</h4>
                                        <p className="text-xs leading-relaxed opacity-90">
                                            <strong className="text-amber-400">Allergen Advice:</strong> Contains <a href={`https://www.google.com/search?q=${encodeURIComponent(allergenText)}`} target="_blank" rel="noopener noreferrer" className="text-white font-bold border-b border-amber-400/50 hover:text-amber-300 hover:border-amber-300 transition-colors cursor-pointer" title="Search for this allergen">{allergenText}</a>.
                                            Please inform us about any food allergies before ordering.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Certification Section - Only show if certificates exist */}
                {certificates && certificates.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col items-center text-center p-6 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-6 h-6 text-green-300" />
                            <h3 className="text-lg font-bold font-serif tracking-wide">Quality Guaranteed</h3>
                        </div>

                        <p className="text-xs text-white/70 mb-4 max-w-xs">
                            Our products are processed in facilities adhering to the highest international safety standards.
                        </p>

                        <div className="mt-4 text-[10px] font-mono text-white/40 tracking-widest uppercase mb-2">
                            Verified & Certified By
                        </div>

                        <div className="flex flex-wrap justify-center gap-4">
                            {certificates.map((cert: any, index: number) => {
                                const imageSrc = typeof cert === 'string' ? cert : (cert.image || cert.src);
                                const linkUrl = typeof cert === 'string' ? null : (cert.link || cert.url);

                                const Content = (
                                    <img
                                        src={imageSrc}
                                        alt="Certificate"
                                        className="w-full h-full object-contain"
                                    />
                                );

                                if (linkUrl) {
                                    return (
                                        <motion.a
                                            key={index}
                                            href={linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.1, rotate: 2 }}
                                            className="w-16 h-16 bg-white rounded-full p-2 shadow-lg flex items-center justify-center transform hover:z-10 transition-all duration-300 border-2 border-white/50 cursor-pointer hover:border-amber-400"
                                            title="View Certification"
                                        >
                                            {Content}
                                        </motion.a>
                                    );
                                }

                                return (
                                    <motion.div
                                        key={index}
                                        whileHover={{ scale: 1.1, rotate: 2 }}
                                        className="w-16 h-16 bg-white rounded-full p-2 shadow-lg flex items-center justify-center transform hover:z-10 transition-all duration-300 border-2 border-white/50 hover:border-amber-400"
                                    >
                                        {Content}
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div className="mt-8 text-xs font-mono text-white/40 tracking-widest uppercase">
                            Verified & Certified for {shopName}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Bottom Bar: Copyright & Policies */}
            <div className="max-w-5xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col-reverse md:flex-row justify-between items-center bg-transparent relative z-10 gap-4">
                <p className="text-xs text-white/50 font-mono text-center md:text-left">
                    &copy; {new Date().getFullYear()} {shopName}. All rights reserved.
                </p>

                <div className="flex gap-6 text-xs text-white/90 font-medium tracking-wide">
                    <button onClick={() => setPolicyOpen('privacy')} className="hover:text-amber-200 transition-colors uppercase border-b border-transparent hover:border-amber-200">
                        Privacy Policy
                    </button>
                    <button onClick={() => setPolicyOpen('refund')} className="hover:text-amber-200 transition-colors uppercase border-b border-transparent hover:border-amber-200">
                        Refund Policy
                    </button>
                    <button onClick={() => setPolicyOpen('terms')} className="hover:text-amber-200 transition-colors uppercase border-b border-transparent hover:border-amber-200">
                        Terms & Conditions
                    </button>
                </div>
            </div>

            <PolicyModal
                isOpen={policyOpen === 'privacy'}
                onClose={() => setPolicyOpen(null)}
                title="Privacy Policy"
                content={config?.privacyPolicy || "We value your privacy. Content loading..."}
            />
            <PolicyModal
                isOpen={policyOpen === 'refund'}
                onClose={() => setPolicyOpen(null)}
                title="Refund Policy"
                content={config?.refundPolicy || "Our freshness guarantee. Content loading..."}
            />
            <PolicyModal
                isOpen={policyOpen === 'terms'}
                onClose={() => setPolicyOpen(null)}
                title="Terms & Conditions"
                content={config?.termsPolicy || "Terms of service. Content loading..."}
            />
        </section >
    );
}

import { PolicyModal } from './PolicyModal';
