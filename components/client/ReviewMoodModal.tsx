'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Camera, Check, ChevronsUpDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createReview } from '@/app/actions/review';
import { getProducts } from '@/app/actions/product';
import { cn } from '@/lib/utils';

interface ReviewMoodModalProps {
    productId?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ReviewMoodModal({ productId, isOpen, onClose }: ReviewMoodModalProps) {
    const [sliderValue, setSliderValue] = useState(50); // 0-100
    const [noteOpen, setNoteOpen] = useState(false);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Product Selector State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string | 'general'>('general');
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {

            getProducts().then(setProducts);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedProductId(productId || 'general');
        }
    }, [isOpen, productId]);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Dynamic Theme Logic
    const getThemeData = (val: number) => {
        if (val < 25) return {
            color: '#FF3333', // Vivid Red
            label: 'Terrible',
            eyeScale: 0.9,
            eyeRotate: -15,
            mouthPath: "M 30 80 Q 50 60 70 80" // Frown
        };
        if (val < 50) return {
            color: '#FFD93D', // Orange/Yellow
            label: 'Bad',
            eyeScale: 0.95,
            eyeRotate: -5,
            mouthPath: "M 30 75 Q 50 75 70 75" // Flat
        };
        if (val < 75) return {
            color: '#D4F550', // Lime
            label: 'Good',
            eyeScale: 1.0,
            eyeRotate: 0,
            mouthPath: "M 25 70 Q 50 90 75 70" // Smile
        };
        return {
            color: '#4ADE80', // Green
            label: 'Excellent',
            eyeScale: 1.2,
            eyeRotate: 0,
            mouthPath: "M 20 65 Q 50 100 80 65" // Big Smile
        };
    };

    const mood = getThemeData(sliderValue);
    const rating = Math.ceil((sliderValue / 100) * 5) || 1;

    // Image Handling
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const maxSizeInBytes = 5 * 1024 * 1024; // 5MB limit

        Array.from(files).forEach(file => {
            if (file.size > maxSizeInBytes) {
                toast.error(`"${file.name}" is too large. Max size is 5MB.`);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        // Reset input to allow re-selecting the same file
        e.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setLoading(true);
        // Use selectedProductId
        const result = await createReview(selectedProductId, rating, comment, images);
        setLoading(false);

        if (result.success) {
            toast.success("Thanks for your feedback!");
            onClose();
            // Reset state after close
            setTimeout(() => {
                setSliderValue(50);
                setComment('');
                setImages([]);
                setNoteOpen(false);
            }, 300);
        } else {
            toast.error(result.error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[50000] flex items-end md:items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal/Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0, backgroundColor: mood.color }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                            backgroundColor: { duration: 0.15 } // Fast color change
                        }}
                        // Mobile: Full screen vertical. Desktop: Split Row view wide.
                        className="pointer-events-auto relative w-full h-[100dvh] md:w-[800px] md:h-auto md:max-h-[85vh] rounded-none md:rounded-[2.5rem] shadow-none md:shadow-2xl overflow-hidden flex flex-col md:flex-row"
                    >

                        {/* DESKTOP LEFT: Visuals (Hidden on Mobile) */}
                        <div className="hidden md:flex w-[320px] shrink-0 border-r border-[#1a2e05]/5 flex-col items-center justify-center p-8 bg-black/5">
                            {/* FACE ANIMATION */}
                            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
                                {/* Left Eye */}
                                <motion.div
                                    className="absolute left-4 top-12 w-16 h-16 bg-[#1a2e05] rounded-full"
                                    animate={{ scale: mood.eyeScale, rotate: mood.eyeRotate, y: sliderValue > 80 ? -5 : 0 }}
                                />
                                {/* Right Eye */}
                                <motion.div
                                    className="absolute right-4 top-12 w-16 h-16 bg-[#1a2e05] rounded-full"
                                    animate={{ scale: mood.eyeScale, rotate: -mood.eyeRotate, y: sliderValue > 80 ? -5 : 0 }}
                                />
                                {/* Mouth SVG */}
                                <svg width="100" height="120" viewBox="0 0 100 120" className="absolute top-12">
                                    <motion.path
                                        d={mood.mouthPath}
                                        fill="transparent"
                                        stroke="#1a2e05"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        animate={{ d: mood.mouthPath }}
                                        transition={{ type: "spring", bounce: 0.4 }}
                                    />
                                </svg>
                            </div>

                            {/* MOOD LABEL */}
                            <motion.h3
                                key={mood.label + '-desktop'}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-5xl font-black uppercase tracking-tight text-[#1a2e05]/90"
                            >
                                {mood.label}
                            </motion.h3>
                        </div>

                        {/* CONTENT AREA (Right Col on Desktop, Full Stack on Mobile) */}
                        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                            {/* Close Button Row (Top Right) */}
                            <div className="flex justify-between md:justify-end items-center px-6 pt-6 pb-2">
                                {/* Helper button only on Mobile if needed, or remove. Keeping generic close. */}
                                {/* On mobile we might want left aligned info button? Keeping consistent. */}
                                <button className="md:hidden p-2 rounded-full">
                                    <span className="text-xs font-bold ring-1 ring-black/20 rounded-full w-5 h-5 flex items-center justify-center text-black/40">i</span>
                                </button>

                                <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:bg-red-600 hover:scale-110 active:scale-95 z-20">
                                    <X className="w-4 h-4" strokeWidth={3} />
                                </button>
                            </div>

                            {/* Scrollable Form */}
                            <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-24 md:pb-8 flex flex-col items-center md:items-stretch">
                                <h2 className="text-center md:text-left text-lg font-medium text-black/80 mb-6 md:mb-8 leading-tight max-w-[200px] md:max-w-none mx-auto md:mx-0 transition-colors">
                                    How was your shopping experience?
                                </h2>

                                {/* PRODUCT SELECTOR (Choosebox) */}
                                <div className="w-full relative mb-6 z-40">
                                    <button
                                        onClick={() => setIsComboboxOpen(!isComboboxOpen)}
                                        className="w-full flex items-center justify-between bg-white border border-black/10 px-4 py-3 rounded-xl text-sm font-medium text-[#1a2e05] hover:bg-black/5 transition-colors"
                                    >
                                        <span className="truncate">
                                            {selectedProductId === 'general'
                                                ? "General / Site Review"
                                                : products.find(p => p.id === selectedProductId)?.name || "Select Product..."}
                                        </span>
                                        <ChevronsUpDown className="w-4 h-4 opacity-50" />
                                    </button>

                                    <AnimatePresence>
                                        {isComboboxOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-black/5 overflow-hidden max-h-[240px] flex flex-col"
                                            >
                                                {/* Search Input */}
                                                <div className="p-2 border-b border-black/5 sticky top-0 bg-white z-10">
                                                    <div className="relative">
                                                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search product..."
                                                            value={searchQuery}
                                                            onChange={(e) => setSearchQuery(e.target.value)}
                                                            className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-lg text-sm border-none focus:ring-1 focus:ring-[#1a2e05]/20 outline-none"
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>

                                                {/* List */}
                                                <div className="overflow-y-auto popup-scrollbar p-1">
                                                    {/* General Option */}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedProductId('general');
                                                            setIsComboboxOpen(false);
                                                            setSearchQuery('');
                                                        }}
                                                        className={cn(
                                                            "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-orange-50 transition-colors",
                                                            selectedProductId === 'general' ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700"
                                                        )}
                                                    >
                                                        <span>General / Site Review</span>
                                                        {selectedProductId === 'general' && <Check className="w-4 h-4" />}
                                                    </button>

                                                    {/* Product Options */}
                                                    {filteredProducts.map(product => (
                                                        <button
                                                            key={product.id}
                                                            onClick={() => {
                                                                setSelectedProductId(product.id);
                                                                setIsComboboxOpen(false);
                                                                setSearchQuery('');
                                                            }}
                                                            className={cn(
                                                                "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between hover:bg-orange-50 transition-colors",
                                                                selectedProductId === product.id ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-700"
                                                            )}
                                                        >
                                                            <span className="truncate pr-2">{product.name}</span>
                                                            {selectedProductId === product.id && <Check className="w-4 h-4 flex-shrink-0" />}
                                                        </button>
                                                    ))}

                                                    {filteredProducts.length === 0 && (
                                                        <div className="px-3 py-4 text-center text-xs text-gray-400">
                                                            No products found
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* MOBILE VISUALS (Face + Label) - Hidden on desktop */}
                                <div className="md:hidden flex flex-col items-center mb-8">
                                    <div className="relative w-48 h-48 mb-4 flex items-center justify-center scale-75 origin-center">
                                        <motion.div className="absolute left-4 top-12 w-16 h-16 bg-[#1a2e05] rounded-full" animate={{ scale: mood.eyeScale, rotate: mood.eyeRotate, y: sliderValue > 80 ? -5 : 0 }} />
                                        <motion.div className="absolute right-4 top-12 w-16 h-16 bg-[#1a2e05] rounded-full" animate={{ scale: mood.eyeScale, rotate: -mood.eyeRotate, y: sliderValue > 80 ? -5 : 0 }} />
                                        <svg width="100" height="120" viewBox="0 0 100 120" className="absolute top-12">
                                            <motion.path d={mood.mouthPath} fill="transparent" stroke="#1a2e05" strokeWidth="8" strokeLinecap="round" animate={{ d: mood.mouthPath }} transition={{ type: "spring", bounce: 0.4 }} />
                                        </svg>
                                    </div>
                                    <motion.h3 key={mood.label + '-mobile'} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-black uppercase tracking-tight text-[#1a2e05]/90">
                                        {mood.label}
                                    </motion.h3>
                                </div>

                                {/* SLIDER */}
                                <div className="w-full relative py-4 mb-4 md:mb-6">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={sliderValue}
                                        onChange={(e) => setSliderValue(Number(e.target.value))}
                                        className="w-full h-1 bg-black/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-[#1a2e05] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white/50"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold uppercase mt-4 text-black/40 px-1 tracking-widest">
                                        <span>Bad</span>
                                        <span>Okay</span>
                                        <span>Good</span>
                                    </div>
                                </div>

                                {/* IMAGE PREVIEWS */}
                                <AnimatePresence>
                                    {images.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="w-full flex gap-2 mb-4 overflow-x-auto pb-2"
                                        >
                                            {images.map((img, i) => (
                                                <div key={i} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-black/10">
                                                    <img src={img} alt="review" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeImage(i)}
                                                        className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Add Photos Prominent Button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-3 mb-3 border-2 border-dashed border-[#1a2e05]/20 hover:border-[#1a2e05]/40 rounded-2xl flex items-center justify-center gap-2 text-[#1a2e05]/70 hover:text-[#1a2e05] hover:bg-[#1a2e05]/5 transition-all group"
                                >
                                    <div className="p-2 bg-[#1a2e05]/10 rounded-full group-hover:bg-[#1a2e05]/20 transition-colors">
                                        <Camera className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm">Add Photos</span>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileSelect}
                                />

                                {/* ACTION BUTTONS */}
                                <div className="w-full flex gap-3 mt-auto shrink-0 z-10">
                                    {/* Note Button */}
                                    <button
                                        onClick={() => setNoteOpen(!noteOpen)}
                                        className={`flex-1 py-4 rounded-[1.2rem] font-bold text-sm transition-all flex items-center justify-center gap-2 ${noteOpen ? 'bg-[#1a2e05] text-white' : 'bg-white/40 ring-1 ring-inset ring-[#1a2e05]/10 hover:bg-white/60 text-[#1a2e05]'}`}
                                    >
                                        {noteOpen ? 'Close' : 'Add Note'}
                                    </button>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex-[1.5] py-4 bg-[#1a2e05] text-white rounded-[1.2rem] font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#1a2e05]/10"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                                    </button>
                                </div>

                                {/* NOTE TEXTAREA */}
                                <AnimatePresence>
                                    {noteOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="w-full overflow-hidden shrink-0"
                                        >
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                placeholder="What did you like or dislike?"
                                                // Fixed outline with border-2 and stronger opacity
                                                className="w-full mt-4 bg-white/60 border-2 border-[#1a2e05]/10 placeholder:text-black/40 text-[#1a2e05] p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1a2e05]/50 focus:border-[#1a2e05]/30 text-sm min-h-[100px] resize-none transition-all"
                                                autoFocus
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
