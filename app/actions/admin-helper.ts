'use server';

import { prisma } from '@/lib/prisma';


export async function getPendingOrderCount() {
    try {
        const count = await prisma.order.count({
            where: { status: 'PENDING' }
        });
        return count;
    } catch {
        return 0;
    }
}

export async function getAdminSetupToken() {
    const config = await prisma.siteConfig.findFirst({
        select: { adminSetupToken: true }
    });
    const token = config?.adminSetupToken || process.env.ADMIN_SETUP_SECRET;

    // STRICT SECURITY: Do not allow default fallbacks in production
    // if (!token) throw new Error("ADMIN_SETUP_SECRET is missing");

    return token || "";
}

export async function updateAdminSetupToken(rawToken: string) {
    const newToken = rawToken.trim(); // Sanitize input
    try {
        const config = await prisma.siteConfig.findFirst({
            select: { id: true }
        });

        if (config) {
            await prisma.siteConfig.update({
                where: { id: config.id },
                data: { adminSetupToken: newToken }
            });
        } else {
            await prisma.siteConfig.create({
                data: { adminSetupToken: newToken }
            });
        }

        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: "Failed to update token" };
    }
}
