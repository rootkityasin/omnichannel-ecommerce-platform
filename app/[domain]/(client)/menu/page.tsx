import { Suspense } from "react";
import { getMenuBootstrapData } from "@/app/actions/menu";
import { MenuClient } from "@/components/client/MenuClient";

export default async function MenuPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  // Keep first load lightweight and let the client progressively fetch the rest.
  const { products, categories, total, limit } = await getMenuBootstrapData(
    domain,
    18,
  );

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 pt-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-crab-red border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            Preparing the Catch...
          </p>
        </div>
      }
    >
      <MenuClient
        initialProducts={JSON.parse(JSON.stringify(products))}
        initialCategories={JSON.parse(JSON.stringify(categories))}
        initialTotalProducts={total}
        initialBootstrapLimit={limit}
      />
    </Suspense>
  );
}

// Use ISR with 60-second revalidation
// Products/categories already have Prisma Accelerate caching
export const revalidate = 600;
