'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

async function checkPermission() {
    const session = await auth();
    // Assuming SUPER_ADMIN or some validation
    // if (!session) throw new Error("Unauthorized");
    return session;
}

export async function getPlans() {
    await checkPermission();
    try {
        const plans = await prisma.plan.findMany({
            orderBy: { sortOrder: 'asc' }
        });
        return { success: true, plans };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

export async function savePlan(data: {
    id?: string;
    slug?: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    features: string[]; // Receive as array
    color: string;
    isPopular: boolean;
    isActive: boolean;
}) {
    await checkPermission();

    try {
        const payload = {
            slug: data.slug || data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
            name: data.name,
            description: data.description,
            price: data.price,
            originalPrice: data.originalPrice,
            features: JSON.stringify(data.features), // Store as JSON string if not native array in db, but Prisma JSON type handles objects/arrays directly usually. 
            // Prisma schema says Json, so can pass array directly if typed correctly.
            color: data.color,
            isPopular: data.isPopular,
            isActive: data.isActive
        };

        // Prisma Json type quirk in some versions: pass exact array

        if (data.id) {
            await prisma.plan.update({
                where: { id: data.id },
                data: {
                    ...payload,
                    features: data.features as any
                }
            });
        } else {
            await prisma.plan.create({
                data: {
                    ...payload,
                    features: data.features as any,
                    sortOrder: 0 // Default
                }
            });
        }

        revalidatePath('/app/plans');
        revalidatePath('/app');
        return { success: true };
    } catch (error) {
        console.error("Save Plan Error:", error);
        return { success: false, error: String(error) };
    }
}

export async function deletePlan(id: string) {
    await checkPermission();
    try {
        await prisma.plan.delete({ where: { id } });
        revalidatePath('/app/plans');
        return { success: true };
    } catch (error) {
        return { success: false, error: String(error) };
    }
}

// Initial Seed function (callable via UI or script)
export async function seedPlans() {
    await checkPermission();

    const count = await prisma.plan.count();
    if (count > 0) return { success: false, message: "Plans already exist" };

    const plans = [
        {
            slug: 'BASIC',
            name: 'Basic',
            price: 1000,
            period: '/month',
            description: 'Perfect for small businesses just starting out.',
            features: [
                'Up to 1,000 Orders/mo',
                'Basic Analytics',
                'Email Support',
                '1 Admin User'
            ],
            color: 'bg-slate-500',
            sortOrder: 1
        },
        {
            slug: 'STANDARD',
            name: 'Standard',
            price: 3500,
            originalPrice: 5000,
            period: '/month',
            description: 'Ideal for growing shops with steady traffic.',
            features: [
                'Up to 10,000 Orders/mo',
                'Advanced Analytics',
                'Priority Email Support',
                'Custom Domain',
                '5 Admin Users'
            ],
            color: 'bg-amber-500',
            sortOrder: 2,
            isPopular: true
        },
        {
            slug: 'PLATINUM',
            name: 'Platinum',
            price: 8000,
            period: '/month',
            description: 'For high-volume enterprises demanding the best.',
            features: [
                'Unlimited Orders',
                'Real-time Analytics',
                '24/7 Phone Support',
                'Custom Domain & Branding',
                'Unlimited Admin Users',
                'Dedicated Account Manager'
            ],
            color: 'bg-emerald-500',
            sortOrder: 3
        }
    ];

    for (const p of plans) {
        await prisma.plan.create({
            data: p
        });
    }

    revalidatePath('/app/plans');
    return { success: true, message: "Seeded successfully" };
}
