import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { Loader2 } from "lucide-react";
import { CartClient } from "@/components/client/cart/CartClient";
import {
  getDeliveryConfig,
  getPaymentConfig,
  getSiteConfig,
} from "@/app/actions/settings";
import { CartTexts } from "@/types/common";

async function getCartData(domain: string) {
  try {
    const siteConfig = await getSiteConfig(domain);
    const tenantId = siteConfig?.tenantId;

    const [sections, paymentConfig, deliveryConfig] = await Promise.all([
      prisma.storySection.findMany(),
      getPaymentConfig(tenantId),
      getDeliveryConfig(tenantId),
    ]);

    const cartSection = sections.find((s) => s.type === "CART_TEXTS");
    const cartTexts = cartSection?.content
      ? (cartSection.content as unknown as CartTexts)
      : null;

    return {
      cartTexts,
      paymentConfig,
      deliveryConfig,
      siteConfig,
    };
  } catch (error) {
    console.error("Failed to fetch cart data:", error);
    return {
      cartTexts: null,
      paymentConfig: null,
      deliveryConfig: null,
      siteConfig: null,
    };
  }
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const { cartTexts, paymentConfig, deliveryConfig, siteConfig } =
    await getCartData(domain);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-crab-red" />
        </div>
      }
    >
      <CartClient
        initialCartTexts={cartTexts}
        initialPaymentConfig={paymentConfig as any}
        initialDeliveryConfig={deliveryConfig as any}
        initialSiteConfig={siteConfig}
      />
    </Suspense>
  );
}
