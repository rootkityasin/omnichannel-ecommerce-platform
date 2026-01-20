import { MobileHeader } from "@/components/client/MobileHeader";
import { BottomNav } from "@/components/client/BottomNav";
import PageTransition from "@/components/PageTransition";
import { ThemeInjector } from "@/components/client/ThemeInjector";
import { getSiteConfig } from "@/app/actions/settings";
import { AdminProvider } from "@/components/providers/AdminProvider";

import { DesktopNavbar } from "@/components/client/DesktopNavbar";
import { CartDrawer } from "@/components/client/CartDrawer"; // Import
import { GlobalCheckoutDrawer } from "@/components/client/GlobalCheckoutDrawer";

export default async function ClientLayout({ // Changed to async
    children,
}: {
    children: React.ReactNode;
}) {
    const config = await getSiteConfig();

    return (
        <AdminProvider>
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
        </AdminProvider>
    );
}
