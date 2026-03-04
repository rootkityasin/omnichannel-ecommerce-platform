'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const getSessionUser = async () => (await auth())?.user;

export async function getPendingOrderCount() {
    try {
        const sessionUser = await getSessionUser();
        const tenantId = sessionUser?.tenantId;
        if (!tenantId) return 0;

        const count = await prisma.order.count({
            where: { tenantId, status: 'PENDING' }
        });
        return count;
    } catch {
        return 0;
    }
}

export async function getAdminSetupToken() {
    const sessionUser = await getSessionUser();
    const tenantId = sessionUser?.tenantId;
    if (!tenantId) return "";

    const config = await prisma.siteConfig.findFirst({
        where: { tenantId },
        select: { adminSetupToken: true }
    });
    const token = config?.adminSetupToken || process.env.ADMIN_SETUP_SECRET;

    return token || "";
}

export async function updateAdminSetupToken(rawToken: string) {
    const newToken = rawToken.trim();
    try {
        const sessionUser = await getSessionUser();
        const tenantId = sessionUser?.tenantId;
        if (!tenantId) return { success: false, error: "Unauthorized" };

        const config = await prisma.siteConfig.findFirst({
            where: { tenantId },
            select: { id: true }
        });

        if (config) {
            await prisma.siteConfig.update({
                where: { id: config.id },
                data: { adminSetupToken: newToken }
            });
        } else {
            await prisma.siteConfig.create({
                data: { tenantId, adminSetupToken: newToken }
            });
        }

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to update token" };
    }
}
