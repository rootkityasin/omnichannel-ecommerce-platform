import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
import { Inter, Hind_Siliguri, Playfair_Display } from "next/font/google";
import { Toaster } from '@/components/ui/sonner';
import PromoPopup from '@/components/client/PromoPopup';
import SessionProvider from '@/components/providers/SessionProvider';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const hindSiliguri = Hind_Siliguri({
  weight: ['400', '500', '600', '700'],
  subsets: ['bengali'],
  variable: "--font-hind",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-poster",
});

export const metadata: Metadata = {
  title: "Crab & Khai - Authentic Seafood",
  description: "Best Crab and Seafood Restaurant in Dhaka",
};

// remove imports
import { getSiteConfig } from '@/app/actions/settings';
import { ThemeInjector } from '@/components/client/ThemeInjector';
import { SettingsProvider } from '@/components/providers/SettingsProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${hindSiliguri.variable} ${playfair.variable} antialiased bg-white text-ocean-blue font-body`}
        suppressHydrationWarning
      >
        <main className="min-h-screen relative">
          <SessionProvider>
            <SettingsProvider>
              {children}
              <PromoPopup />
              <Toaster richColors position="top-center" />
              <SpeedInsights />
              <Analytics />
            </SettingsProvider>
          </SessionProvider>
        </main>
      </body>
    </html>
  );
}
