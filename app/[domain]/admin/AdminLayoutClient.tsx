'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminProvider, useAdmin } from '@/components/providers/AdminProvider';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { cn } from '@/lib/utils';

// Check if browser has the trusted device cookie
function hasTrustedDeviceCookie(): boolean {
    if (typeof document === 'undefined') return true; // SSR safety
    return document.cookie.split(';').some(c => c.trim().startsWith('trusted_device='));
}

export default function AdminLayoutClient({
    children,
    initialUser,
}: {
    children: React.ReactNode;
    initialUser: any;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // Client-side device authorization check on EVERY route change
    useEffect(() => {
        const isSetupPage = pathname?.includes('/admin/security/device-setup');

        // Skip check if we're on the setup page
        if (isSetupPage) return;

        // Check if trusted device cookie exists
        if (!hasTrustedDeviceCookie()) {
            // Redirect to device setup
            router.push('/admin/security/device-setup');
        }
    }, [pathname, router]);

    return (
        <AdminProvider initialUser={initialUser}>
            <div className="min-h-screen bg-gray-50">
                <AdminSidebar />
                <MainContentWrapper>
                    {children}
                </MainContentWrapper>
            </div>
        </AdminProvider>
    );
}

function MainContentWrapper({ children }: { children: React.ReactNode }) {
    const { isSidebarCollapsed } = useAdmin();
    return (
        <main className={cn("transition-all duration-300 ease-in-out w-auto", isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64")}>
            <AdminHeader />
            <div className="p-4 lg:p-8">
                {children}
            </div>
        </main>
    )
}

