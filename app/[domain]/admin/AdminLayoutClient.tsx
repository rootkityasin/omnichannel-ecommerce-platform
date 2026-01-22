'use client';

import { AdminProvider, useAdmin } from '@/components/providers/AdminProvider';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { cn } from '@/lib/utils';

export default function AdminLayoutClient({
    children,
    initialUser,
}: {
    children: React.ReactNode;
    initialUser: any;
}) {
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
