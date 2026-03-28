"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";
import type { Prisma } from "@prisma/client";

const getCachedStorySections = unstable_cache(
  async () => {
    const sections = await prisma.storySection.findMany();
    return sections.map((section) => ({
      ...section,
      updatedAt: section.updatedAt.toISOString(),
    }));
  },
  ["story-sections"],
  { tags: ["story-sections"], revalidate: 300 },
);

const getCachedBlockedCustomers = unstable_cache(
  async () => {
    const section = await prisma.storySection.findUnique({
      where: { type: "BLOCKED_CUSTOMERS" },
      select: { content: true },
    });

    const content = section?.content as {
      phones?: unknown;
      emails?: unknown;
    } | null;

    return {
      phones: Array.isArray(content?.phones)
        ? content.phones.filter((p): p is string => typeof p === "string")
        : [],
      emails: Array.isArray(content?.emails)
        ? content.emails.filter((e): e is string => typeof e === "string")
        : [],
    };
  },
  ["story-blocked-customers"],
  { tags: ["story-sections", "story-blocked-customers"], revalidate: 300 },
);

export async function getStorySections() {
  try {
    return await getCachedStorySections();
  } catch (error) {
    console.error("Failed to fetch story sections:", error);
    return [];
  }
}

export async function getBlockedCustomers() {
  try {
    return await getCachedBlockedCustomers();
  } catch (error) {
    console.error("Failed to fetch blocked customers:", error);
    return { phones: [], emails: [] };
  }
}

export async function getHomepageSeoCopy() {
  try {
    const section = await prisma.storySection.findUnique({
      where: { type: "HOMEPAGE_SEO_COPY" },
      select: { content: true },
    });

    const content = section?.content as {
      topLabel?: unknown;
      introText?: unknown;
    } | null;

    return {
      topLabel:
        typeof content?.topLabel === "string" && content.topLabel.trim()
          ? content.topLabel
          : "Crab Price in Dhaka",
      introText:
        typeof content?.introText === "string" && content.introText.trim()
          ? content.introText
          : "Find premium crab meat in Dhaka with ready-to-fry frozen crab packs from CrabKhai, made for rich flavor and a quick 5-minute fry.",
    };
  } catch (error) {
    console.error("Failed to fetch homepage SEO copy:", error);
    return {
      topLabel: "Crab Price in Dhaka",
      introText:
        "Find premium crab meat in Dhaka with ready-to-fry frozen crab packs from CrabKhai, made for rich flavor and a quick 5-minute fry.",
    };
  }
}

export async function updateStorySection(
  type: string,
  content: Prisma.InputJsonValue,
) {
  try {
    await prisma.storySection.upsert({
      where: { type },
      update: { content },
      create: { type, content },
    });
    revalidatePath("/story"); // Update the public page
    revalidatePath("/admin/landing"); // Update the admin page
    revalidatePath("/"); // Update the homepage
    revalidatePath("/[domain]", "page"); // Update domain logic if dynamic
    revalidateTag("story-sections", {});
    revalidateTag("story-blocked-customers", {});
    return { success: true };
  } catch (error) {
    console.error(`Failed to update story section ${type}:`, error);
    return { success: false, error: "Failed to update section" };
  }
}

export async function getAllProductsSimple() {
  try {
    const products = await prisma.product.findMany({
      select: { id: true, name: true, image: true, price: true },
    });
    return products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function getProductsByIds(ids: string[]) {
  try {
    if (!ids || ids.length === 0) return [];
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        description: true,
      },
    });
    return products;
  } catch (error) {
    console.error("Failed to fetch products by IDs:", error);
    return [];
  }
}
