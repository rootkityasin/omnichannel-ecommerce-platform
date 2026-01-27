'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPendingOrderCount() {
    try {
        const count = await prisma.order.count({
            where: { status: 'PENDING' }
        });
        return count;
    } catch (error) {
        return 0;
    }
}

export async function getAdminSetupToken() {
    // try to find config
    const config = await prisma.siteConfig.findFirst();
    return config?.adminSetupToken || process.env.ADMIN_SETUP_SECRET || "crab-secret-setup-123";
}

export async function updateAdminSetupToken(newToken: string) {
    try {
        const config = await prisma.siteConfig.findFirst();

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
