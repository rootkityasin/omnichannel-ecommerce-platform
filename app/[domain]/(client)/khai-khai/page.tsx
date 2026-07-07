import { Suspense } from "react";
import { getSiteConfig, getPaymentConfig, getDeliveryConfig } from "@/app/actions/settings";
import { getProducts } from "@/app/actions/product";
import { Loader2 } from "lucide-react";
import KhaiKhaiClient from "./KhaiKhaiClient";

async function getKhaiKhaiPageData(domain: string) {
  try {
    const siteConfig = await getSiteConfig(domain);
    const tenantId = siteConfig?.tenantId;

    const [paymentConfig, deliveryConfig, products] = await Promise.all([
      getPaymentConfig(tenantId),
      getDeliveryConfig(tenantId),
      getProducts(domain),
    ]);

    return {
      paymentConfig,
      deliveryConfig,
      siteConfig,
      products,
    };
  } catch (error) {
    console.error("Failed to fetch page data:", error);
    return {
      paymentConfig: null,
      deliveryConfig: null,
      siteConfig: null,
      products: [],
    };
  }
}

export default async function KhaiKhaiPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const { paymentConfig, deliveryConfig, siteConfig, products } = await getKhaiKhaiPageData(domain);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-crab-red" />
        </div>
      }
    >
      <KhaiKhaiClient
        initialPaymentConfig={paymentConfig as any}
        initialDeliveryConfig={deliveryConfig as any}
        initialSiteConfig={siteConfig}
        products={products as any[]}
        domain={domain}
      />
    </Suspense>
  );
}
