"use client";

import { useRef, useState, useEffect, memo } from "react";

import { motion } from "framer-motion";
import { useAnimationStore } from "@/lib/animationStore";
import { useCartStore } from "@/lib/store";
import Image from "next/image";
import { useLanguageStore } from "@/lib/languageStore";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { ProductModal } from "./ProductModal";
import { trackEvent } from "@/lib/track";
import { buildMediaLqip, buildMediaUrl } from "@/lib/media";

import { Product } from "@/types/common";

export interface ProductCardProps extends Partial<Product> {
  id: string;
  name: string;
  price: string | number;
  image: string;
  categoryId?: string;
}

export const ProductCard = memo(function ProductCard({
  id,
  name,
  name_bn,
  price,
  price_bn,
  image,
  images = [],
  nutritionImage,
  cookingImage,
  nutrition,
  cookingInstructions,
  pieces,
  totalSold,
  weightOptions,
  type,
  comboItems,
  stage,
  isAvailable = true,
  servingSize,
  weight,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const { language } = useLanguageStore();
  const { triggerFly } = useAnimationStore();
  const imageRef = useRef<HTMLImageElement>(null);

  // Active image state for gallery
  const [activeImage, setActiveImage] = useState(image);
  const optimizedActiveImage = buildMediaUrl(activeImage, {
    width: 480,
    aspect: "4:5",
    crop: "fill",
    gravity: "auto",
  });
  const lqipImage = buildMediaLqip(activeImage, {
    aspect: "4:5",
    crop: "fill",
    gravity: "auto",
  });

  // Reset active image if prop changes
  useEffect(() => {
    setActiveImage(image);
  }, [image]);

  // Combine main image with gallery images for the list
  const galleryItems = [image, ...(images || [])]
    .filter((img, index, self) => img && self.indexOf(img) === index)
    .slice(0, 4);

  // Zoom Logic
  const [isHovering, setIsHovering] = useState(false);

  const displayPrice = language !== "en" && price_bn ? price_bn : price;
  const displayName = language !== "en" && name_bn ? name_bn : name;

  const handleAddToCart = () => {
    // Trigger Fly Animation
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      triggerFly(activeImage, {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }

    // Add to Store
    const priceNum =
      typeof price === "string" ? Number(price.replace(/[^0-9.]/g, "")) : price;
    addItem({ id, name, price: priceNum, image: activeImage, quantity: 1 });

    // Server-Side Tracking: AddToCart
    trackEvent({
      eventName: "AddToCart",
      eventData: {
        content_name: name,
        content_ids: [id],
        content_type: "product",
        value: priceNum,
        currency: "BDT",
      },
    });

    toast.custom(
      (t) => (
        <div className="flex items-center gap-4 w-full bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20">
          <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
            <img
              src={activeImage}
              alt={name}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-sm truncate">{name}</h4>
            <p className="text-gray-500 text-xs">Added to cart</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600">
            <Plus className="w-4 h-4" />
          </div>
        </div>
      ),
      { duration: 2000, position: "top-center" },
    );
  };

  const [showModal, setShowModal] = useState(false);

  const piecesInside = (() => {
    if (type === "COMBO") {
      const totalComboPieces = (comboItems || []).reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            (item.child?.servingSize || 0) * Math.max(0, item.quantity || 0),
          ),
        0,
      );
      return totalComboPieces > 0 ? totalComboPieces : null;
    }
    const serving = Number(servingSize);
    if (Number.isFinite(serving) && serving > 0) return serving;
    return null;
  })();

  const comboAvailableSets =
    type === "COMBO"
      ? (() => {
          if (!comboItems || comboItems.length === 0) return 0;
          const limits = comboItems.map((item) =>
            Math.floor(
              (item.child?.pieces || 0) / Math.max(1, item.quantity || 1),
            ),
          );
          return limits.length > 0 ? Math.max(0, Math.min(...limits)) : 0;
        })()
      : null;

  const isOutOfStock =
    isAvailable === false ||
    (type === "COMBO"
      ? (comboAvailableSets ?? 0) <= 0
      : typeof pieces === "number" && pieces <= 0);

  return (
    <>
      <motion.div
        className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer flex flex-col h-full"
        onClick={() => {
          setShowModal(true);
          // Server-Side Tracking: ViewContent
          trackEvent({
            eventName: "ViewContent",
            eventData: {
              content_name: name,
              content_ids: [id],
              content_type: "product",
              value:
                typeof price === "string"
                  ? Number(price.replace(/[^0-9.]/g, ""))
                  : price,
              currency: "BDT",
            },
          });
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -5 }} // Simple lift instead of 3D tilt for better zoom usability
        transition={{ duration: 0.2 }}
      >
        <div
          className="aspect-[4/5] overflow-hidden bg-gray-100 relative group-hover:shadow-[inset_0_0_40px_rgba(0,0,0,0.05)] transition-all duration-500"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="w-full h-full overflow-hidden relative">
            <Image
              ref={imageRef}
              src={optimizedActiveImage || "/logo.svg"}
              alt={name}
              fill
              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 480px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              priority={false}
              onError={() => setActiveImage("/logo.svg")}
              placeholder={lqipImage ? "blur" : undefined}
              blurDataURL={lqipImage || undefined}
            />
          </div>

          {/* Glass Pieces Tag */}
          {piecesInside && (
            <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none">
              <span className="px-2.5 py-1 rounded-lg bg-white/70 backdrop-blur-md border border-white/50 text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-crab-red inline-block" />
                {piecesInside} pcs inside
              </span>
            </div>
          )}

          {/* Gallery Thumbnails */}
          {galleryItems.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-2 px-2">
              {galleryItems.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage(img);
                  }}
                  onMouseEnter={() => setActiveImage(img)}
                  className={`w-10 h-10 rounded-md overflow-hidden border-2 shadow-sm transition-all ${activeImage === img ? "border-crab-red scale-110" : "border-white/80 hover:border-white"}`}
                >
                  <img
                    src={img}
                    alt={`View ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 bg-white relative z-20 flex flex-col flex-grow overflow-hidden">
          <h3
            className={`font-bold text-gray-800 line-clamp-1 mb-1 relative z-10 ${language !== "en" ? "font-bangla text-base" : "font-heading text-sm"}`}
          >
            {displayName}
          </h3>
          <div className="mt-auto flex items-center justify-between relative z-10">
            <span className="text-crab-red font-black font-heading">
              ৳{displayPrice}
            </span>
            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full uppercase tracking-wide">
                Out of Stock
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
                className="p-1.5 bg-white text-gray-900 border border-gray-200 rounded-full hover:bg-crab-red hover:text-white transition-colors active:scale-95 z-30 shadow-sm"
                aria-label="Add to cart"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Coming Soon Overlay */}
          {pieces === -1 && // Using pieces -1 as a proxy or pass explicit stage? Let's check props.
            // Wait, better to let parent pass a 'stage' prop or check visibility.
            // Since I can't easily change the prop signature everywhere without ripple effects, I'll rely on a new visual overlay if I can detect it,
            // OR, cleaner: just add 'stage' prop to interface.
            null}
        </div>
      </motion.div>

      <ProductModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product={{
          id,
          name,
          price,
          image: activeImage,
          nutritionImage,
          cookingImage,
          nutrition,
          cookingInstructions,
          totalSold,
          weightOptions,
          images,
          weight,
          servingSize,
          pieces,
          isAvailable,
          type,
          comboItems,
        }}
      />
    </>
  );
});
