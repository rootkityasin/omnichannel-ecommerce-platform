import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';
import { type User } from '@/components/providers/AdminProvider';
import { getAdminOrders } from '@/app/actions/order';
import { getAdminSiteConfig } from '@/app/actions/settings';
import { getProducts } from '@/app/actions/product';

// How often to verify device against DB (30 minutes)
const DB_VERIFY_INTERVAL = 30 * 60 * 1000;

export default async function AdminLayout({
    children,
    params
}: {
    readonly children: React.ReactNode;
    readonly params: Promise<{ domain: string }>;
}) {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('trusted_device')?.value;
    const lastDbCheck = cookieStore.get('device_verified')?.value;
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    // Server-side Auth Check
    const session = await auth();
    if (!session?.user || session.user.role === 'USER') {
        redirect('/');
    }

    // Check if we are on the setup page to avoid loops
    const isSetupPage = pathname.includes('/admin/security/device-setup');

    if (!deviceId && !isSetupPage) {
        redirect('/admin/security/device-setup');
    }

    await verifyTrustedDevice(deviceId, lastDbCheck, isSetupPage);

    const { domain } = await params;

    // Fast Data Load Phase 1: Fetch Server Side to avoid "Loading..." states
    const [initialOrders, initialConfig, initialProducts] = await Promise.all([
        getAdminOrders(),
        getAdminSiteConfig(),
        getProducts(domain)
    ]);

    const initialData = {
        orders: initialOrders || [],
        settings: initialConfig || {},
        products: (initialProducts || []).map(p => ({
            ...p,
            stock: p.isAvailable ?? true
        }))
    };

    // Return Client Layout
    return <AdminLayoutClient initialUser={session?.user as unknown as User} session={session} initialData={initialData}>{children}</AdminLayoutClient>;
}

async function verifyTrustedDevice(deviceId: string | undefined, lastDbCheck: string | undefined, isSetupPage: boolean) {
    if (!deviceId) return;

    const now = Date.now();
    const lastCheck = lastDbCheck ? Number.parseInt(lastDbCheck, 10) : 0;
    const shouldVerifyDb = (now - lastCheck) > DB_VERIFY_INTERVAL;

    if (!shouldVerifyDb) return;

    const trustedDevice = await prisma.trustedDevice.findUnique({
        where: { deviceId },
    });

    if (trustedDevice) {
        // Valid Device - Update lastUsed (throttled to 5 min in DB already)
        const FIVE_MINUTES = 5 * 60 * 1000;
        const lastUsed = trustedDevice.lastUsed ? trustedDevice.lastUsed.getTime() : 0;

        if (now - lastUsed > FIVE_MINUTES) {
            try {
                await prisma.trustedDevice.update({
                    where: { deviceId },
                    data: { lastUsed: new Date() }
                });
            } catch {
                // Ignore update errors
            }
        }
    } else if (!isSetupPage) {
        // Cookie exists but DB record missing (Stale/Deleted/Revoked)
        redirect('/api/clear-auth');
    }
}

