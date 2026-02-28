"use client";

import { motion } from "framer-motion";
import { ProductRail } from "@/components/client/ProductRail";
import { useCartStore } from "@/lib/store";
import { useEffect } from "react";

interface Section {
  id: string;
  slug: string;
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
}

export function SectionList({ sections }: { sections: Section[] }) {
  const setAllProducts = useCartStore((state) => state.setAllProducts);

  useEffect(() => {
    if (sections.length > 0) {
      const allFoundProducts = sections.flatMap((s) => s.products);
      // Ensure unique products by ID
      const uniqueProducts = Array.from(
        new Map(allFoundProducts.map((p) => [p.id, p])).values(),
      );
      setAllProducts(uniqueProducts);
    }
  }, [sections, setAllProducts]);
  if (sections.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        No active sections found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map(
        (section, index) =>
          section.products.length > 0 && (
            <motion.div
              key={section.id}
              id={`section-${section.slug}`}
              className="scroll-mt-32"
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.2,
                delay: Math.min(index * 0.02, 0.1),
                ease: "easeOut",
              }}
              style={{ willChange: "transform, opacity" }}
            >
              <ProductRail
                title={section.title}
                products={section.products}
                viewAllLink={`/menu?section=${section.slug}`}
                enableScrollAnimation={index === 0}
              />
            </motion.div>
          ),
      )}
    </div>
  );
}
