'use client';

import { SessionProvider } from 'next-auth/react';
import type { SiteConfig, AdminOrder, AdminProduct, User } from '@/types/common';
import { AdminProvider, useAdmin } from '@/components/providers/AdminProvider';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { cn } from '@/lib/utils';
import React from 'react';
import type { Session } from 'next-auth';

export default function AdminLayoutClient({
    children,
    initialUser,
    session,
    initialData
}: Readonly<{
    children: React.ReactNode;
    initialUser?: User;
    session: Session | null;
    initialData?: {
        orders?: AdminOrder[];
        products?: AdminProduct[];
        settings?: SiteConfig;
    };
}>) {
    return (
        <SessionProvider session={session}>
            <AdminProvider initialUser={initialUser} initialData={initialData}>
                <div className="min-h-screen bg-gray-50">
                    <AdminSidebar />
                    <MainContentWrapper>
                        {children}
                    </MainContentWrapper>
                </div>
            </AdminProvider>
        </SessionProvider>
    );
}

function MainContentWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
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
