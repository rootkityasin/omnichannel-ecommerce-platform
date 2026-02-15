import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { Loader2 } from 'lucide-react';
import { CartClient } from '@/components/client/cart/CartClient';
import { getPaymentConfig, getSiteConfig } from '@/app/actions/settings';



async function getCartData() {
    try {
        const [sections, paymentConfig, siteConfig] = await Promise.all([
            prisma.storySection.findMany(),
            getPaymentConfig(),
            getSiteConfig()
        ]);

        const cartSection = sections.find((s: any) => s.type === 'CART_TEXTS');
        const cartTexts = cartSection?.content ? (cartSection.content as any) : null;

        return {
            cartTexts,
            paymentConfig,
            siteConfig
        };
    } catch (error) {
        console.error("Failed to fetch cart data:", error);
        return {
            cartTexts: null,
            paymentConfig: null,
            siteConfig: null
        };
    }
}

export default async function CartPage() {
    const { cartTexts, paymentConfig, siteConfig } = await getCartData();

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-crab-red" />
            </div>
        }>
            <CartClient
                initialCartTexts={cartTexts}
                initialPaymentConfig={paymentConfig}
                initialSiteConfig={siteConfig}
            />
        </Suspense>
    );
}
