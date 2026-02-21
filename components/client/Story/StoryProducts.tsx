"use client";

import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  image: string | null;
  price: number;
  description: string | null;
}

interface StoryProductsProps {
  data: {
    title: string;
    productIds: string[];
  } | null;
  products: Product[];
}

export function StoryProducts({ data, products }: StoryProductsProps) {
  if (!data || !products || products.length === 0) return null;

  const title = data.title || "Our Signature Selections";

  return (
    <section className="relative py-24 px-6 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-white mb-6"
          >
            {title}
          </motion.h2>
          <div className="h-1 w-24 bg-crab-red mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-crab-red/30 transition-all duration-300"
            >
              <div className="aspect-square relative overflow-hidden bg-slate-800">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Link href={`/products/${product.id}`}>
                    <Button
                      size="sm"
                      className="bg-white text-slate-900 hover:bg-slate-200 font-bold rounded-full"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-crab-red font-black text-lg font-heading">
                    ৳ {product.price}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:text-crab-red hover:bg-crab-red/10 rounded-full"
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link href="/products">
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 rounded-full group"
            >
              Explore Full Menu
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
