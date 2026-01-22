import { Suspense } from 'react';
import { getProducts } from '@/app/actions/product';
import { getCategories } from '@/app/actions/category';
import { MenuClient } from '@/components/client/MenuClient';

export default async function MenuPage() {
    // Fetch initial data on the server for instant load
    const [products, categories] = await Promise.all([
        getProducts(),
        getCategories()
    ]);

    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 pt-12 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-crab-red border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Preparing the Catch...</p>
            </div>
        }>
            <MenuClient
                initialProducts={JSON.parse(JSON.stringify(products))}
                initialCategories={JSON.parse(JSON.stringify(categories))}
            />
        </Suspense>
    );
}

export const dynamic = 'force-dynamic';
