import { MobileHeader } from "@/components/client/MobileHeader";
import { BottomNav } from "@/components/client/BottomNav";
import { ThemeInjector } from "@/components/client/ThemeInjector";
import PageTransition from "@/components/PageTransition";
import { getSiteConfig } from "@/app/actions/settings";
import { DesktopNavbar } from "@/components/client/DesktopNavbar";
import { CartDrawer } from "@/components/client/CartDrawer";
import { DynamicCheckout } from "@/components/client/DynamicCheckout";
import { PromoModal } from "@/components/client/PromoModal";
import { getActivePromo } from "@/app/actions/promo";
import { Metadata } from "next";

const getTwitterCardType = (card: string | null | undefined) => {
  if (card === "summary" || card === "player" || card === "app") return card;
  return "summary_large_image";
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const config = await getSiteConfig(domain);
  let twitterImages: string[] = [];
  if (config.twitterImage) twitterImages = [config.twitterImage];
  else if (config.ogImage) twitterImages = [config.ogImage];

  return {
    title: config.seoTitle || config.shopName || "Premium Store",
    description: config.seoDescription,
    keywords: config.seoKeywords,
    openGraph: {
      title: config.ogTitle || config.seoTitle || config.shopName,
      description: config.ogDescription || config.seoDescription || undefined,
      images: config.ogImage ? [{ url: config.ogImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: getTwitterCardType(config.twitterCard),
      title: config.twitterTitle || config.seoTitle || undefined,
      description:
        config.twitterDescription || config.seoDescription || undefined,
      images: twitterImages,
    },
    alternates: {
      canonical: config.canonicalUrl,
    },
    robots: {
      index: config.robots?.includes("index") ?? true,
      follow: config.robots?.includes("follow") ?? true,
    },
  };
}

export default async function ClientLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}>) {
  const { domain } = await params;
  const config = await getSiteConfig(domain);
  const activePromo = await getActivePromo(config.tenantId);

  // ... (JSON-LD construction remains same)

  // Construct JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": config.jsonLdType || "Restaurant",
    name: config.shopName,
    url: config.canonicalUrl || `https://${domain}`,
    logo: config.logoUrl,
    description: config.seoDescription,
    address: {
      "@type": "PostalAddress",
      streetAddress: config.contactAddress,
    },
    telephone: config.contactPhone,
    email: config.contactEmail,
    sameAs: [
      config.socialFacebook,
      config.socialInstagram,
      config.socialTwitter,
      config.socialLinkedIn,
      config.socialYoutube,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ThemeInjector
        primaryColor={config?.primaryColor}
        secondaryColor={config?.secondaryColor}
      />
      <div className="client-shell flex flex-col min-h-screen bg-white relative font-body">
        <div className="md:hidden sticky top-0 z-50">
          <MobileHeader />
        </div>
        <DesktopNavbar />
        <CartDrawer />
        <DynamicCheckout />
        <main className="flex-1 w-full relative">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav />
        <PromoModal promo={activePromo} />
      </div>
    </>
  );
}
