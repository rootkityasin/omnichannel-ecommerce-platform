import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLayoutClient from './AdminLayoutClient';
import { headers } from 'next/headers';

// How often to verify device against DB (30 minutes)
const DB_VERIFY_INTERVAL = 30 * 60 * 1000;

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const deviceId = cookieStore.get('trusted_device')?.value;
    const lastDbCheck = cookieStore.get('device_verified')?.value;
    const headersList = await headers();
    const pathname = headersList.get('x-pathname') || '';

    // Server-side Auth Check
    const session = await auth();
    if (!session || !session.user || (session.user as any).role === 'USER') {
        redirect('/');
    }

    // Check if we are on the setup page to avoid loops
    const isSetupPage = pathname.includes('/admin/security/device-setup');

    if (!deviceId && !isSetupPage) {
        redirect('/admin/security/device-setup');
    }

    if (deviceId) {
        const now = Date.now();
        const lastCheck = lastDbCheck ? parseInt(lastDbCheck, 10) : 0;
        const shouldVerifyDb = (now - lastCheck) > DB_VERIFY_INTERVAL;

        // Only query DB if:
        // 1. We haven't verified recently (> 30 min), OR
        // 2. No verification timestamp exists
        if (shouldVerifyDb) {
            const trustedDevice = await prisma.trustedDevice.findUnique({
                where: { deviceId },
            });

            if (!trustedDevice) {
                // Cookie exists but DB record missing (Stale/Deleted/Revoked)
                if (!isSetupPage) {
                    redirect('/api/clear-auth');
                }
            } else {
                // Valid Device - Update lastUsed (throttled to 5 min in DB already)
                const FIVE_MINUTES = 5 * 60 * 1000;
                const lastUsed = trustedDevice.lastUsed ? new Date(trustedDevice.lastUsed).getTime() : 0;

                if (now - lastUsed > FIVE_MINUTES) {
                    try {
                        await prisma.trustedDevice.update({
                            where: { deviceId },
                            data: { lastUsed: new Date() }
                        });
                    } catch (e) {
                        // Ignore update errors
                    }
                }

                // Set cookie to track last DB verification (expires in 1 day)
                // This is done via API route or we return a header
                // For now, we'll just continue - the middleware/API can set this
            }
        }
        // If we're within the 30-min window, skip DB call entirely - trust the cookie
    }

    // Return Client Layout
    return <AdminLayoutClient initialUser={session.user} session={session}>{children}</AdminLayoutClient>;
}

