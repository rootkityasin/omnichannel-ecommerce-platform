'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';

import { menuItems } from '@/lib/data';

interface AnimatedSearchBarProps {
    className?: string; // Applied to the wrapper
    onSearch?: (term: string) => void;
    placeholder?: string;
    width?: string; // Expanded width
    isTransparent?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}

export function AnimatedSearchBar({ className, onSearch, placeholder, width = "w-64", isTransparent = true, onOpenChange }: AnimatedSearchBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();


    const { language } = useLanguageStore();
    const t = translations[language];

    useEffect(() => {
        if (onOpenChange) onOpenChange(isOpen);
    }, [isOpen, onOpenChange]);


    // Filter suggestions
    const suggestions = searchTerm.length > 0
        ? menuItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
        : [];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (!searchTerm || suggestions.length === 0) setIsOpen(false);
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchTerm, suggestions.length]);

    const performSearch = (term: string) => {
        if (onSearch) {
            onSearch(term);
        } else {
            router.push(`/menu?search=${encodeURIComponent(term)}`);
        }
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            performSearch(searchTerm);
        }
    };

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    };

    return (
        <div ref={containerRef} className={cn("relative z-50", className)}>
            <motion.div
                layout
                className={cn(
                    "relative flex items-center overflow-hidden transition-colors border",
                    // Open state: White bg, dark text
                    isOpen ? "bg-white text-slate-900 border-gray-200 shadow-lg" :
                        // Closed state:
                        // Transparent mode -> Dark Blue text, Dark Blue border (High Contrast)
                        // Solid mode -> Slate text, Slate border (New for /account page)
                        isTransparent ? "bg-[#0A3D62]/5 hover:bg-[#0A3D62]/10 text-[#0A3D62] border-[#0A3D62]/10" : "bg-transparent hover:bg-slate-100 text-slate-800 border-slate-200",
                    "h-10 rounded-full",
                    isOpen ? width : "w-10 cursor-pointer"
                )}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                onClick={() => !isOpen && toggleOpen()}
            >
                <form onSubmit={handleSubmit} className="flex items-center w-full h-full">
                    {/* Icon */}
                    <motion.button
                        layout="position"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isOpen && searchTerm) handleSubmit(e);
                            else toggleOpen();
                        }}
                        className={cn(
                            "flex items-center justify-center flex-shrink-0 w-10 h-10 transition-colors",
                            isOpen ? "text-crab-red" : "text-current"
                        )}
                    >
                        <Search className="w-5 h-5" />
                    </motion.button>

                    {/* Input */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="flex-1 flex items-center overflow-hidden pr-2"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={placeholder || t.searchPlaceholder}
                                    className={cn(
                                        "w-full bg-transparent border-none outline-none text-sm px-2 placeholder:text-gray-400",
                                        language !== 'en' ? 'font-bangla' : 'font-body'
                                    )}
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSearchTerm('');
                                            inputRef.current?.focus();
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {isOpen && searchTerm.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-12 right-0 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                    >
                        {suggestions.length > 0 ? (
                            <div className="py-2">
                                {suggestions.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-orange-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                        onClick={() => performSearch(item.name)}
                                    >
                                        <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover bg-gray-100" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                            <p className="text-xs text-crab-red font-bold">৳{item.price}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`p-4 text-center text-sm text-gray-400 ${language !== 'en' ? 'font-bangla' : 'font-body'}`}>
                                {t.noItemsFound}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
