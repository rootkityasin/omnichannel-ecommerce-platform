import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};
import { Inter, Hind_Siliguri, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import SessionProvider from "@/components/providers/SessionProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const hindSiliguri = Hind_Siliguri({
  weight: ["400", "500", "600", "700"],
  subsets: ["bengali"],
  variable: "--font-hind",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-poster",
});

export const metadata: Metadata = {
  title: "Omnichannel Ecommerce Platform",
  description:
    "Enterprise-grade multi-tenant e-commerce suite for scalability and security.",
};

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
            {children}
            <Toaster richColors position="top-center" />
          </SessionProvider>
        </main>
      </body>
    </html>
  );
}
