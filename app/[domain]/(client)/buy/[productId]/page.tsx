"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getProduct } from "@/app/actions/product";
import { getProductReviews } from "@/app/actions/review";
import { ProductReviews } from "@/components/client/ProductReviews";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string;
    image: string | null;
  };
};

type ProductDetail = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  image?: string | null;
  images?: string[] | null;
  pieces?: number | null;
  servingSize?: number | null;
  sku?: string | null;
};

function ProductImageCarousel({
  images,
  name,
}: Readonly<{ images: string[]; name: string }>) {
  // Revert to default settings for standard responsive swipe
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  const imageCounts = new Map<string, number>();
  const keyedImages = images.map((src) => {
    const nextCount = (imageCounts.get(src) ?? 0) + 1;
    imageCounts.set(src, nextCount);
    return { src, key: `${src}-${nextCount}` };
  });

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  return (
    <div
      className="relative w-full h-full group overflow-hidden"
      ref={emblaRef}
    >
      <div className="flex h-full touch-pan-y">
        {keyedImages.map((imageItem, index) => (
          <div
            key={imageItem.key}
            className="flex-[0_0_100%] min-w-0 h-full relative"
          >
            <Image
              src={imageItem.src}
              alt={`${name} view ${index + 1}`}
              fill
              className="object-cover select-none"
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        ))}
      </div>

      {/* Arrows - Only visible if multiple images */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              scrollPrev();
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              scrollNext();
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
          {keyedImages.map((imageItem, index) => (
            <button
              key={`dot-${imageItem.key}`}
              className={cn(
                "w-2 h-2 rounded-full transition-all shadow-sm",
                index === selectedIndex
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/80",
              )}
              onClick={(e) => {
                e.stopPropagation();
                emblaApi?.scrollTo(index);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SmartLinkPage() {
  const params = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerCount] = useState(() => Math.floor(Math.random() * 15) + 5);

  useEffect(() => {
    const loadProduct = async () => {
      const productId = Array.isArray(params.productId)
        ? params.productId[0]
        : params.productId;
      if (productId) {
        try {
          const [productData, reviewsData] = await Promise.all([
            getProduct(productId),
            getProductReviews(productId),
          ]);

          if (productData) setProduct(productData);
          setReviews(reviewsData || []);
        } catch (error) {
          console.error("Failed to load product data:", error);
          // Try to at least get product if reviews failed?
          // Optional fallback logic could go here.
          const productOnly = await getProduct(productId).catch(() => null);
          if (productOnly) setProduct(productOnly);
          setReviews([]); // Ensure reviews is an empty array if fetch fails
        }
      }
      setLoading(false);
    };
    loadProduct();
  }, [params.productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800">Product Not Found</h2>
          <p className="text-gray-500 mt-2">
            The product you are looking for does not exist or has been removed.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              globalThis.location.href = "/";
            }}
          >
            Go Home
          </Button>
        </Card>
      </div>
    );
  }

  const handleWhatsAppOrder = () => {
    const text = `Hi, I want to order *${product.name}* (Price: ৳${product.price}). Please confirm.`;
    globalThis.open(
      `https://wa.me/8801804221161?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const pieces = product.servingSize ?? 0;
  const imageList =
    product.images && product.images.length > 0
      ? product.images
      : [product.image || "/placeholder.png"];

  return (
    <div className="min-h-screen bg-[#FDFCF8]">
      {/* Desktop Background Elements */}
      <div className="fixed inset-0 pointer-events-none hidden md:block">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-50/50 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/30 rounded-full blur-3xl -z-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-12 relative z-10">
        {/* Desktop: Split Layout / Mobile: Stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
          {/* Left Column: Imagery (Sticky on Desktop) */}
          <div className="relative md:sticky md:top-24">
            <Card className="border-0 shadow-none bg-transparent md:bg-white md:shadow-2xl md:rounded-[2rem] overflow-hidden md:border-4 md:border-white">
              <div className="aspect-square relative bg-gray-100 group overflow-hidden">
                {/* Glass Pieces Tag */}
                {pieces > 0 && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <span className="w-2 h-2 rounded-full bg-crab-red animate-pulse" />
                      <span className="text-sm font-bold text-slate-900">
                        {pieces} pcs inside
                      </span>
                    </div>
                  </div>
                )}

                <ProductImageCarousel images={imageList} name={product.name} />
              </div>
            </Card>

            {/* Trust Badges - Desktop Only */}
            <div className="hidden md:flex justify-center gap-8 mt-8 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="p-2 bg-green-100 rounded-full text-green-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span>Fresh Daily</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.001 0 0012 21a9.003 9.001 0 008.354-5.646z"
                    />
                  </svg>
                </div>
                <span>Organic Feed</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="flex flex-col space-y-8 md:pt-4">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge
                  variant="outline"
                  className="rounded-full px-4 py-1 text-xs uppercase tracking-widest border-slate-300 text-slate-500"
                >
                  Premium Selection
                </Badge>
                {product.sku && (
                  <span className="text-xs text-slate-400 font-mono">
                    SKU: {product.sku}
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-heading font-black text-slate-900 leading-tight mb-4">
                {product.name}
              </h1>

              <div className="flex flex-col gap-1 mb-6 relative z-50">
                <div className="flex items-center gap-2 text-sm font-bold text-orange-700 bg-white w-fit px-3 py-1.5 rounded-full border border-orange-200 shadow-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs sm:text-sm">
                    🔥 {viewerCount} people are looking at this!
                  </span>
                </div>
                <div className="flex items-baseline gap-4 mt-2">
                  <span className="text-4xl font-black text-crab-red font-heading">
                    ৳{product.price}
                  </span>
                  <span className="text-sm text-slate-400 font-medium uppercase tracking-wide">
                    Per Unit
                  </span>
                </div>
              </div>

              <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed mb-8">
                <p>{product.description}</p>
              </div>
            </div>

            {/* Action Area */}
            <Card className="bg-white border-none shadow-xl shadow-orange-500/5 rounded-2xl overflow-hidden">
              <div className="p-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 opacity-20" />
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex gap-3 text-blue-800">
                  <span className="text-xl">⚡</span>
                  <div>
                    <p className="font-bold text-sm">Instant WhatsApp Order</p>
                    <p className="text-xs text-blue-600/80">
                      No account required • Fast confirmation
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <Button
                    onClick={handleWhatsAppOrder}
                    className="w-full h-14 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-[#25D366]/30 transition-all transform hover:-translate-y-0.5"
                  >
                    <MessageCircle className="w-6 h-6 mr-2" />
                    Order via WhatsApp
                  </Button>

                  <div className="relative flex items-center gap-4 py-2">
                    <div className="h-px bg-slate-100 flex-1" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      or
                    </span>
                    <div className="h-px bg-slate-100 flex-1" />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-14 border-2 border-slate-200 text-slate-700 font-bold text-lg rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                    onClick={() => {
                      globalThis.location.href = "/";
                    }}
                  >
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews Section */}
        <ProductReviews productId={product.id} reviews={reviews} />
      </div>
    </div>
  );
}
