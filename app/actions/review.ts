'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAdminReviews() {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                user: {
                    select: { name: true, phone: true, email: true }
                },
                product: {
                    select: { name: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return reviews;
    } catch (error) {
        console.error("Failed to fetch reviews:", error);
        return [];
    }
}

export async function getProductReviews(productId: string) {
    try {
        const reviews = await prisma.review.findMany({
            where: { productId },
            include: {
                user: {
                    select: { name: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return reviews;
    } catch (error) {
        console.error("Failed to fetch product reviews:", error);
        return [];
    }
}

export async function deleteReview(id: string) {
    try {
        await prisma.review.delete({
            where: { id }
        });
        revalidatePath('/admin/reviews');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete review:", error);
        return { success: false, error: "Failed to delete review" };
    }
}

export async function createReview(productId: string, rating: number, comment: string, images: string[]) {
    try {
        const session = await import("@/auth").then(mod => mod.auth());
        if (!session?.user?.id) return { success: false, error: "You must be logged in to review" };

        let validProductId: string | null = productId;
        // Handle "general" or empty productId
        if (!validProductId || validProductId === 'general') {
            validProductId = null;
        }

        await prisma.review.create({
            data: {
                userId: session.user.id,
                productId: validProductId || null, // Ensure null if "general"
                rating,
                comment,
                images
            }
        });

        revalidatePath('/app/(client)/buy/[productId]'); // Revalidate product page
        revalidatePath('/admin/reviews');
        return { success: true };

    } catch (error) {
        console.error("Create Review Error:", error);
        // Check for Foreign Key constraint if productId was invalid
        return { success: false, error: "Failed to submit review" };
    }
}
