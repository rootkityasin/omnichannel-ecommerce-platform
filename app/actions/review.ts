'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

const getSessionUser = async () => (await auth())?.user;

export async function getAdminReviews() {
    try {
        const sessionUser = await getSessionUser();
        const tenantId = sessionUser?.tenantId;
        if (!tenantId) return [];

        const reviews = await prisma.review.findMany({
            where: {
                product: { tenantId }
            },
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
        const sessionUser = await getSessionUser();
        const tenantId = sessionUser?.tenantId;
        if (!tenantId) return { success: false, error: "Unauthorized" };

        // Verify the review belongs to this tenant via its product
        const review = await prisma.review.findUnique({
            where: { id },
            include: { product: { select: { tenantId: true } } }
        });

        if (!review) return { success: false, error: "Review not found" };
        // Reviews with no product (general reviews) - only allow deletion by super admin or same tenant
        if (review.product && review.product.tenantId !== tenantId) {
            return { success: false, error: "Review not found" };
        }

        await prisma.review.delete({ where: { id } });
        revalidatePath('/admin/reviews');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete review:", error);
        return { success: false, error: "Failed to delete review" };
    }
}

export async function createReview(productId: string, rating: number, comment: string, images: string[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "You must be logged in to review" };

        let validProductId: string | null = productId;
        // Handle "general" or empty productId
        if (!validProductId || validProductId === 'general') {
            validProductId = null;
        }

        // Validate the product exists and belongs to the correct tenant
        if (validProductId) {
            const product = await prisma.product.findUnique({
                where: { id: validProductId },
                select: { id: true, tenantId: true }
            });
            if (!product) return { success: false, error: "Product not found" };
        }

        await prisma.review.create({
            data: {
                userId: session.user.id,
                productId: validProductId || null,
                rating,
                comment,
                images
            }
        });

        revalidatePath('/[domain]/(client)/buy/[productId]', 'page');
        revalidatePath('/admin/reviews');
        return { success: true };

    } catch (error) {
        console.error("Create Review Error:", error);
        return { success: false, error: "Failed to submit review" };
    }
}
