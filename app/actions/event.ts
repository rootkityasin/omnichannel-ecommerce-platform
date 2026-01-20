'use server';

import { prisma } from '@/lib/prisma';

export async function getEventsByDuration(days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    try {
        const events = await prisma.trackingEvent.findMany({
            where: {
                createdAt: {
                    gte: cutoffDate,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return events;
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}
