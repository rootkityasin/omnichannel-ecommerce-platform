"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Minus,
  Flame,
  Activity,
  Timer,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Utensils,
} from "lucide-react";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/providers/SettingsProvider";
import { buildCloudinaryLqip, buildCloudinaryUrl } from "@/lib/cloudinary";

const AnimatedCounter = ({ value }: { value: string | number }) => {
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.]/g, ""))
      : value;
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => {
    if (isNaN(numericValue)) return String(value);
    const isFloat = numericValue % 1 !== 0;
    return current.toFixed(isFloat ? 2 : 0);
  });

  React.useEffect(() => {
    if (!isNaN(numericValue)) {
      spring.set(numericValue);
    }
  }, [spring, numericValue]);

  if (isNaN(numericValue)) return <span>{value}</span>;

  return <motion.span>{display}</motion.span>;
};

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: string | number;
    image: string;
    images?: string[];
    nutritionImage?: string;
    cookingImage?: string;
    nutrition?: string;
    cookingInstructions?: string;
    totalSold?: number;
    weightOptions?: string[];
    weight?: number;
    servingSize?: number;
    pieces?: number;
    isAvailable?: boolean;
  };
}

export function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { settings } = useSettings();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(
    product.weightOptions?.[0] || "Standard",
  );
  const piecesInside = Number(product.servingSize || 0);
  const isOutOfStock =
    product.isAvailable === false ||
    (typeof product.pieces === "number" && product.pieces <= 0);

  // Gallery State
  // Gallery State
  // Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  // Combine main image and gallery images, checking for duplicates
  const rawImages = [product.image, ...(product.images || [])].filter(
    (img) => img && img.trim() !== "",
  );
  const uniqueImages = Array.from(new Set(rawImages));
  const galleryImages = uniqueImages.length > 0 ? uniqueImages : ["/logo.svg"];
  const heroImage = galleryImages[currentImageIndex];
  const optimizedHeroImage = buildCloudinaryUrl(heroImage, {
    width: 900,
    aspect: "16:9",
    crop: "fill",
    gravity: "auto",
  });
  const heroLqip = buildCloudinaryLqip(heroImage, {
    aspect: "16:9",
    crop: "fill",
    gravity: "auto",
  });

  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedVariant(product.weightOptions?.[0] || "Standard");
      setCurrentImageIndex(0);
      setDirection(0);
      setIsPaused(false);
    }
  }, [isOpen, product.weightOptions]);

  // Auto-scroll Gallery
  React.useEffect(() => {
    if (galleryImages.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [galleryImages.length, isPaused]);

  const handleAddToCart = () => {
    const priceNum =
      typeof product.price === "string"
        ? Number(product.price.replace(/[^0-9.]/g, ""))
        : product.price;

    addItem({
      id: product.id,
      name: `${product.name} - ${selectedVariant}`,
      price: priceNum,
      image: product.image,
      quantity: quantity,
    });
    toast.success(`Added ${quantity} x ${selectedVariant} to cart!`);
    onClose();
  };

  const paginate = (newDirection: number) => {
    setIsPaused(true); // Stop auto-scroll on manual interaction
    setDirection(newDirection);
    setCurrentImageIndex((prev) => {
      let nextIndex = prev + newDirection;
      if (nextIndex < 0) nextIndex = galleryImages.length - 1;
      if (nextIndex >= galleryImages.length) nextIndex = 0;
      return nextIndex;
    });
  };

  const variants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 300 : -300,
        opacity: 0,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0,
      };
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden bg-white border-0 shadow-2xl rounded-2xl h-[85vh] flex flex-col">
        {heroLqip && (
          <img
            src={heroLqip}
            alt=""
            className="absolute inset-0 w-full h-[35%] object-cover blur-xl opacity-60 pointer-events-none"
            aria-hidden="true"
          />
        )}
        <DialogTitle className="sr-only">{product.name} Details</DialogTitle>

        {/* Hero Gallery Section */}
        <div className="relative w-full aspect-video bg-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[60] p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image Carousel with Swipe */}
          <div className="relative w-full h-full overflow-hidden touch-pan-y bg-slate-200">
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={currentImageIndex}
                src={optimizedHeroImage}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                onClick={() => setIsZoomed(true)}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.svg";
                }}
                // Drag / Swipe Logic
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragStart={() => setIsPaused(true)}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = offset.x;

                  if (swipe < -50) {
                    paginate(1); // Swipe Left -> Next Image
                  } else if (swipe > 50) {
                    paginate(-1); // Swipe Right -> Prev Image
                  }
                }}
                whileTap={{ cursor: "grabbing" }}
              />
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          {galleryImages.length > 1 && (
            <>
              {/* Dots */}
              <div className="absolute bottom-6 right-6 z-30 flex items-center justify-center gap-1.5 px-2 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/10 shadow-lg">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPaused(true); // Stop auto-scroll
                      setDirection(idx > currentImageIndex ? 1 : -1);
                      setCurrentImageIndex(idx);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      idx === currentImageIndex
                        ? "bg-white w-4 h-1.5 shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                        : "bg-white/50 w-1.5 h-1.5 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {piecesInside > 0 && (
            <div className="absolute top-4 left-4 z-30">
              <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-crab-red animate-pulse" />
                <span className="text-xs font-bold text-white">
                  {piecesInside} pcs inside
                </span>
              </div>
            </div>
          )}

          {/* Gradient Overlay (Only minimal for depth) */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          {/* Zoom Hint Button */}
          <button
            onClick={() => setIsZoomed(true)}
            className="absolute bottom-4 right-4 z-30 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>

        {/* Full Screen Zoom Overlay */}
        <AnimatePresence>
          {isZoomed && (
            <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
              <DialogContent className="!max-w-[100vw] !w-[100vw] !h-[100vh] !max-h-[100vh] !p-0 !bg-black/90 !border-none !shadow-none outline-none overflow-hidden [&>button]:hidden">
                <DialogTitle className="sr-only">
                  Zoomed Image: {product.name}
                </DialogTitle>
                <div className="relative w-full h-full flex items-center justify-center overflow-auto touch-manipulation">
                  <button
                    onClick={() => setIsZoomed(false)}
                    className="absolute top-4 right-4 z-[60] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md"
                  >
                    <X className="w-8 h-8" />
                  </button>

                  {/* Pinch Zoom / Pan capable area */}
                  <ZoomableImage
                    src={optimizedHeroImage}
                    onNext={() => paginate(1)}
                    onPrev={() => paginate(-1)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 bg-white relative z-10 overflow-hidden">
          <div className="px-6 pt-5 pb-2">
            <h2 className="text-xl font-heading font-bold text-slate-900 leading-tight">
              {product.name}
            </h2>
            <p className="text-slate-500 mt-1.5 text-xs leading-relaxed font-medium">
              {/* Dynamic Description based on Settings */}
              {settings.shopType === "GROCERY"
                ? settings.measurementUnit === "WEIGHT"
                  ? `Premium quality pack. Sold in increments of ${product?.weight || settings.weightUnitValue || 200}g. Sustainably sourced.`
                  : `Verified grocery item. Quality checked and sealed for freshness.`
                : `Sustainably sourced, fresh soft shell crab. Cleaned and processed for immediate cooking.`}
            </p>
          </div>

          <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-white p-0 h-auto shrink-0 z-20 relative px-6">
              <TabsTrigger
                value="overview"
                className="flex-1 !outline-none !ring-0 !ring-offset-0 !shadow-none focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none focus:!outline-none data-[state=active]:bg-transparent data-[state=active]:!shadow-none data-[state=active]:border-b-2 data-[state=active]:border-red-600 rounded-none py-3.5 text-slate-500 data-[state=active]:text-red-600 font-bold transition-all"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="cooking"
                className="flex-1 !outline-none !ring-0 !ring-offset-0 !shadow-none focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none focus:!outline-none data-[state=active]:bg-transparent data-[state=active]:!shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none py-3.5 text-slate-500 data-[state=active]:text-orange-600 font-bold transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> Cooking
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="nutrition"
                className="flex-1 !outline-none !ring-0 !ring-offset-0 !shadow-none focus:!ring-0 focus-visible:!ring-0 focus-visible:!outline-none focus:!outline-none data-[state=active]:bg-transparent data-[state=active]:!shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none py-3.5 text-slate-500 data-[state=active]:text-green-600 font-bold transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" /> Nutrition
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="p-0 flex-1 bg-slate-50/50 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <TabsContent
                  key="overview"
                  value="overview"
                  className="mt-0 space-y-4 focus-visible:ring-0 absolute inset-0 p-4 md:p-6 pb-24 overflow-y-auto"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Total Sold Badge */}
                    {(product.totalSold ?? 0) > 0 && (
                      <div className="flex justify-start">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200 shadow-sm">
                          <Activity className="w-3 h-3 mr-1" />
                          {product.totalSold} Total Sold
                        </span>
                      </div>
                    )}

                    {/* Variant Selector (Custom or Auto-Generated) */}
                    {/* 1. Custom defined variants */}
                    {(product.weightOptions?.length ?? 0) > 0 ? (
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">
                          Select Weight
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {product.weightOptions?.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => setSelectedVariant(opt)}
                              className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                                selectedVariant === opt
                                  ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                                  : "border-gray-200 bg-white text-slate-600 hover:border-gray-300",
                              )}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* 2. Auto-generated Weight Options (if Unit = WEIGHT) */
                      settings.measurementUnit === "WEIGHT" && (
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">
                            Select Quantity by Weight
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 5, 10].map((qty) => {
                              const unitVal =
                                product.weight ||
                                settings.weightUnitValue ||
                                200;
                              const totalWeight = qty * unitVal;
                              const label =
                                totalWeight >= 1000
                                  ? `${totalWeight / 1000} kg`
                                  : `${totalWeight} g`;

                              return (
                                <button
                                  key={qty}
                                  onClick={() => setQuantity(qty)}
                                  className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                                    quantity === qty
                                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                                      : "border-gray-200 bg-white text-slate-600 hover:border-gray-300",
                                  )}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-xs text-slate-400">
                            Based on standard unit size of{" "}
                            {product.weight || settings.weightUnitValue || 200}
                            g.
                          </p>
                        </div>
                      )
                    )}
                  </motion.div>
                </TabsContent>

                <TabsContent
                  key="cooking"
                  value="cooking"
                  className="mt-0 space-y-3 focus-visible:ring-0 absolute inset-0 p-4 md:p-6 pb-24 overflow-y-auto"
                >
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Constant (Default) Cooking Cards */}
                    <motion.div
                      className="space-y-3"
                      variants={{
                        hidden: { opacity: 0 },
                        show: {
                          opacity: 1,
                          transition: { staggerChildren: 0.15 },
                        },
                      }}
                      initial="hidden"
                      animate="show"
                    >
                      {/* Deep Fry Card */}
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        }}
                        whileHover={{
                          scale: 1.01,
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-orange-100 relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 z-0" />
                        <div className="relative z-10 flex items-center justify-between">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2 md:p-3 bg-orange-100 rounded-lg text-orange-600 shadow-sm relative overflow-hidden">
                              <Flame className="w-5 h-5 md:w-6 md:h-6 fill-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-base md:text-lg leading-tight">
                                Deep Fry
                              </h4>
                              <p className="text-xs md:text-sm text-slate-500 font-medium">
                                BEST RESULT
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-baseline gap-1 justify-end">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                5-6
                              </span>
                              <span className="text-xs md:text-sm text-slate-500">
                                min
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] md:text-xs text-green-600 font-medium mt-1">
                              <Timer className="w-3 h-3" /> Quick Clean
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Oven Bake Card */}
                      <motion.div
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        }}
                        whileHover={{
                          scale: 1.01,
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-blue-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="p-2 md:p-3 bg-blue-50 rounded-lg text-blue-600">
                              <Utensils className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-base md:text-lg leading-tight">
                                Oven Bake
                              </h4>
                              <p className="text-xs md:text-sm text-slate-500">
                                Low Oil Option
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-baseline gap-1 justify-end">
                              <span className="text-xl md:text-2xl font-bold text-slate-900">
                                10-12
                              </span>
                              <span className="text-xs md:text-sm text-slate-500">
                                min
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </TabsContent>

                <TabsContent
                  key="nutrition"
                  value="nutrition"
                  className="mt-0 focus-visible:ring-0 absolute inset-0 p-4 md:p-6 pb-24 overflow-y-auto"
                >
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      {(function () {
                        // Constant (Default) Items for consistency
                        // Calculate Multiplier based on selected weight
                        // Base nutrition is for 100g.
                        // If Unit=WEIGHT, Total Weight = Quantity * UnitValue (e.g. 200g).
                        // Multiplier = Total Weight / 100.
                        const unitVal =
                          settings.measurementUnit === "WEIGHT"
                            ? product.weight || settings.weightUnitValue || 200
                            : 100;
                        const totalWeight = quantity * unitVal;
                        const multiplier = totalWeight / 100;

                        const defaultItems = [
                          {
                            label: "Energy",
                            value: (125 * multiplier).toFixed(0),
                            unit: "kcal",
                            color: "text-amber-600",
                            bg: "bg-amber-50",
                          },
                          {
                            label: "Protein",
                            value: (9.38 * multiplier).toFixed(1),
                            unit: "g",
                            color: "text-blue-600",
                            bg: "bg-blue-50",
                          },
                          {
                            label: "Carbs",
                            value: (19.79 * multiplier).toFixed(1),
                            unit: "g",
                            color: "text-emerald-600",
                            bg: "bg-emerald-50",
                          },
                          {
                            label: "Fat",
                            value: (1.04 * multiplier).toFixed(1),
                            unit: "g",
                            color: "text-rose-600",
                            bg: "bg-rose-50",
                          },
                          {
                            label: "Sodium",
                            value: (343 * multiplier).toFixed(0),
                            unit: "mg",
                            color: "text-slate-600",
                            bg: "bg-slate-100",
                          },
                          {
                            label: "Cholesterol",
                            value: (31.25 * multiplier).toFixed(1),
                            unit: "mg",
                            color: "text-slate-600",
                            bg: "bg-slate-100",
                          },
                        ];

                        // Always use default items to ensure 'constant' look
                        const itemsToRender = defaultItems;

                        const container = {
                          hidden: { opacity: 0 },
                          show: {
                            opacity: 1,
                            transition: {
                              staggerChildren: 0.1,
                            },
                          },
                        };

                        const itemAnim = {
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        };

                        return (
                          <motion.div
                            className="grid grid-cols-2 gap-4 col-span-2"
                            variants={container}
                            initial="hidden"
                            animate="show"
                          >
                            {itemsToRender.map((item, i) => (
                              <motion.div
                                key={i}
                                variants={itemAnim}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                              >
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">
                                  {item.label}
                                </p>
                                <div className="flex items-baseline gap-1">
                                  <span
                                    className={`text-2xl font-bold ${item.color}`}
                                  >
                                    <AnimatedCounter value={item.value} />
                                  </span>
                                  <span className="text-sm text-slate-500 font-medium">
                                    {item.unit}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        );
                      })()}
                    </div>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </div>
          </Tabs>

          <div className="p-4 border-t border-white/20 bg-white/50 backdrop-blur-sm flex items-center gap-3 absolute bottom-0 left-0 right-0 z-50">
            {/* Sticky Quantity Stepper */}
            <div className="flex items-center bg-white rounded-xl h-12 border border-gray-200 shadow-sm px-1 min-w-[140px]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-full flex items-center justify-center text-slate-600 hover:text-red-600 active:scale-90 transition-transform"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="w-24 flex justify-center font-bold text-lg text-slate-900">
                {(() => {
                  const unit = settings.measurementUnit || "PCS";
                  if (unit === "VOLUME") {
                    const ml = quantity * (settings.volumeUnitValue || 1000); // Default 1L
                    return ml >= 1000
                      ? `${(ml / 1000).toFixed(1)} Ltr`
                      : `${ml} ml`;
                  }
                  if (unit === "WEIGHT") {
                    const grams =
                      quantity *
                      (product.weight || settings.weightUnitValue || 200); // Prioritize product weight
                    return grams >= 1000
                      ? `${(grams / 1000).toFixed(1)} kg`
                      : `${grams} g`;
                  }
                  return quantity;
                })()}
              </div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-full flex items-center justify-center text-slate-600 hover:text-red-600 active:scale-90 transition-transform"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {isOutOfStock ? (
              <Button
                disabled
                className="flex-1 h-12 text-lg bg-slate-200 text-slate-500 rounded-xl font-bold"
              >
                Out of Stock
              </Button>
            ) : (
              <Button
                onClick={handleAddToCart}
                className="flex-1 h-12 text-lg bg-[#F40000] hover:bg-[#D90000] text-white rounded-xl shadow-lg hover:shadow-xl hover:shadow-red-500/20 transition-all font-bold border-t-2 border-white/20 border-b-4 border-[#B00000] active:border-b-0 active:translate-y-1 active:mt-1 relative overflow-hidden group"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FEF08A]/40 to-transparent -translate-x-full group-hover:animate-shine" />
                <div className="flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5 stroke-[3] text-white group-hover:text-[#FEF08A] transition-colors" />
                  <span className="tracking-wide">Add to Cart</span>
                </div>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Component for Zoom Interaction
// Helper Component for Zoom Interaction
function ZoomableImage({
  src,
  onNext,
  onPrev,
}: {
  src: string;
  onNext: () => void;
  onPrev: () => void;
}) {
  const [scale, setScale] = useState(1.25);
  const startDist = React.useRef(0);
  const startScale = React.useRef(1.25);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Calculate initial distance
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      startDist.current = dist;
      startScale.current = scale;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY,
      );
      if (startDist.current > 0) {
        const newScale = startScale.current * (dist / startDist.current);
        setScale(Math.min(Math.max(0.5, newScale), 5)); // Limit zoom
      }
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden touch-none relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <motion.img
        key={src}
        src={src}
        alt="Full Screen"
        className="max-w-none max-h-[90vh] object-contain"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: scale }}
        transition={{ duration: 0.1 }} // Faster transition for pinch
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/logo.svg";
        }}
        drag
        dragConstraints={{
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
        dragElastic={0.2}
      />

      {/* Navigation Arrows - Side Centered */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md z-[60] transition-transform active:scale-90"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md z-[60] transition-transform active:scale-90"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Controls for manual zoom */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-6 z-50">
        <button
          onClick={() => setScale((s) => Math.max(1, s - 0.5))}
          className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-transform active:scale-90 shadow-lg border border-white/10"
        >
          <Minus className="w-6 h-6" />
        </button>
        <button
          onClick={() => setScale((s) => Math.min(4, s + 0.5))}
          className="p-4 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-transform active:scale-90 shadow-lg border border-white/10"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
