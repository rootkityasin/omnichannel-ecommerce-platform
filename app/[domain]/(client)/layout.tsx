import { MobileHeader } from "@/components/client/MobileHeader";
import { BottomNav } from "@/components/client/BottomNav";
import { ThemeInjector } from "@/components/client/ThemeInjector";
import PageTransition from "@/components/PageTransition";
import { getSiteConfig } from "@/app/actions/settings";
import { DesktopNavbar } from "@/components/client/DesktopNavbar";
import { CartDrawer } from "@/components/client/CartDrawer";
import { GlobalCheckoutDrawer } from "@/components/client/GlobalCheckoutDrawer";

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const config = await getSiteConfig();

    return (
        <>
            <ThemeInjector primaryColor={config?.primaryColor} secondaryColor={config?.secondaryColor} />
            <div className="flex flex-col min-h-screen bg-white relative">
                <div className="md:hidden sticky top-0 z-50">
                    <MobileHeader />
                </div>
                <DesktopNavbar />
                <CartDrawer />
                <GlobalCheckoutDrawer />
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
