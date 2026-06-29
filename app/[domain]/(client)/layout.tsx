import { MobileHeader } from "@/components/client/MobileHeader";
import { BottomNav } from "@/components/client/BottomNav";
import { ThemeInjector } from "@/components/client/ThemeInjector";
import PageTransition from "@/components/PageTransition";
import { getSiteConfig } from "@/app/actions/settings";
import { DesktopNavbar } from "@/components/client/DesktopNavbar";
import { CartDrawer } from "@/components/client/CartDrawer";
import { DynamicCheckout } from "@/components/client/DynamicCheckout";
import { PromoModal } from "@/components/client/PromoModal";
import { HomepageSoundButton } from "@/components/client/HomepageSoundButton";
import { getActivePromo } from "@/app/actions/promo";
import { Metadata } from "next";
import { SettingsProvider } from "@/components/providers/SettingsProvider";
import Script from "next/script";
import { MetaPixel } from "@/components/client/MetaPixel";

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
    title: config.seoTitle || config.shopName || "Store",
    description: config.seoDescription,
    keywords: config.seoKeywords,
    openGraph: {
      title: config.ogTitle || config.seoTitle || config.shopName || "Store",
      description: config.ogDescription || config.seoDescription || undefined,
      images: config.ogImage ? [{ url: config.ogImage }] : undefined,
      type: "website",
    },
    twitter: {
      card: getTwitterCardType(config.twitterCard),
      title:
        config.twitterTitle || config.seoTitle || config.shopName || undefined,
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
  const gtmContainerId = config.gtmContainerId?.trim();
  const hasValidGtmContainerId = Boolean(
    gtmContainerId && /^GTM-[A-Z0-9]+$/i.test(gtmContainerId),
  );
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
    <SettingsProvider initialSettings={config}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Google Tag (gtag.js) */}
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-S0KZQN2S00"
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-S0KZQN2S00');
          `,
        }}
      />
      {hasValidGtmContainerId && (
        <>
          <Script
            id="gtm-loader"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${JSON.stringify(gtmContainerId)});`,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="gtm"
            />
          </noscript>
        </>
      )}
      {config.metaPixelId && (
        <>
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${config.metaPixelId}');`,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${config.metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
      <ThemeInjector
        primaryColor={config?.primaryColor}
        secondaryColor={config?.secondaryColor}
      />
      <MetaPixel pixelId={config.metaPixelId} />
      <div
        data-vaul-drawer-wrapper=""
        className="client-shell flex flex-col min-h-screen bg-white relative font-body"
      >
        <div className="md:hidden sticky top-0 z-50">
          <MobileHeader />
        </div>
        <DesktopNavbar />
        <CartDrawer />
        <DynamicCheckout />
        <HomepageSoundButton />
        <main className="flex-1 w-full relative">
          <PageTransition>{children}</PageTransition>
        </main>
        <BottomNav />
        <PromoModal promo={activePromo} />
      </div>
    </SettingsProvider>
  );
}
