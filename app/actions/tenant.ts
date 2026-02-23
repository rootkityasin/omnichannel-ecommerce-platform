"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { normalizeHost } from "@/lib/domain";

/**
 * Resolves a tenant by its domain (custom domain or subdomain slug).
 * Optimized with Next.js unstable_cache.
 */
export const getTenantByDomain = unstable_cache(
  async (domain: string) => {
    if (!domain) return null;

    try {
      const normalized = normalizeHost(domain);
      const subdomain = normalized.split(".")[0];

      const tenant = await prisma.tenant.findFirst({
        where: {
          OR: [
            { slug: subdomain }, // Matches 'crabkhai' from 'crabkhai.com'
            { customDomain: domain }, // Exact match 'www.crabkhai.com'
            { customDomain: normalized }, // Match 'crabkhai.com'
            { slug: domain }, // Fallback exact slug match
          ],
        },
      });
      return tenant;
    } catch (error) {
      console.error("Failed to resolve tenant by domain:", error);
      return null;
    }
  },
  ["tenant-by-domain"],
  { revalidate: 3600, tags: ["tenant-by-domain"] },
);
