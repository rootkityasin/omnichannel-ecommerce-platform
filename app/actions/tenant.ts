'use server';

import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

/**
 * Resolves a tenant by its domain (custom domain or subdomain slug).
 * Optimized with Next.js unstable_cache.
 */
export const getTenantByDomain = unstable_cache(
    async (domain: string) => {
        if (!domain) return null;

        try {
            const tenant = await prisma.tenant.findFirst({
                where: {
                    OR: [
                        { slug: domain },
                        { customDomain: domain },
                        { slug: domain.split('.')[0] } // Fallback for 'slug.localhost'
                    ]
                }
            });
            return tenant;
        } catch (error) {
            console.error("Failed to resolve tenant by domain:", error);
            return null;
        }
    },
    ['tenant-by-domain'],
    { revalidate: 3600, tags: ['tenant-by-domain'] }
);
