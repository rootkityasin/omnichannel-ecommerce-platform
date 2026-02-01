import { MobileHeader } from "@/components/client/MobileHeader";
import { BottomNav } from "@/components/client/BottomNav";
import { ThemeInjector } from "@/components/client/ThemeInjector";
import PageTransition from "@/components/PageTransition";
import { getSiteConfig } from "@/app/actions/settings";
import { DesktopNavbar } from "@/components/client/DesktopNavbar";
import { CartDrawer } from "@/components/client/CartDrawer";
import { DynamicCheckout } from "@/components/client/DynamicCheckout";

export default async function ClientLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ domain: string }>;
}) {
    const { domain } = await params;
    const config = await getSiteConfig(domain);

    return (
        <>
            <ThemeInjector primaryColor={config?.primaryColor} secondaryColor={config?.secondaryColor} />
            <div className="flex flex-col min-h-screen bg-white relative">
                <div className="md:hidden sticky top-0 z-50">
                    <MobileHeader />
                </div>
                <DesktopNavbar />
                <CartDrawer />
                <DynamicCheckout />
                <main className="flex-1 w-full relative">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
                <BottomNav />
            </div>
        </>
    );
}
