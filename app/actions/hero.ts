"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, updateTag, unstable_cache } from "next/cache";
import { getTenantByDomain } from "./tenant";
import type { Prisma } from "@prisma/client";

type HeroSlideInput = Omit<Prisma.HeroSlideCreateInput, "order"> & {
  order?: number;
};

const getCachedHeroSlides = unstable_cache(
  async (domain?: string) => {
    const tenant = domain ? await getTenantByDomain(domain) : null;

    // Note: HeroSlide currently has no tenantId in schema.
    // Using a stop-gap: If domain is provided but tenant not resolved, return nothing.
    if (domain && !tenant) return [];

    const slides = await prisma.heroSlide.findMany({
      orderBy: { order: "asc" },
    });

    return slides.map((slide) => ({
      ...slide,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    }));
  },
  ["hero-slides"],
  { tags: ["hero"], revalidate: 3600 },
);

export async function getHeroSlides(domain?: string) {
  try {
    return await getCachedHeroSlides(domain);
  } catch (error) {
    console.error("Failed to fetch hero slides:", error);
    return [];
  }
}

export async function createHeroSlide(data: HeroSlideInput) {
  try {
    await prisma.heroSlide.create({
      data: {
        imageUrl: data.imageUrl,
        title: data.title,
        title_bn: data.title_bn,
        subtitle: data.subtitle,
        subtitle_bn: data.subtitle_bn,
        buttonText: data.buttonText,
        buttonLink: data.buttonLink,
        isActive: data.isActive,
        order: data.order || 0,
      },
    });
    revalidatePath("/");
    updateTag("hero");
    return { success: true };
  } catch (error) {
    console.error("Failed to create hero slide:", error);
    return { success: false, error: "Failed to create slide" };
  }
}

export async function updateHeroSlide(id: string, data: HeroSlideInput) {
  try {
    await prisma.heroSlide.update({
      where: { id },
      data: {
        imageUrl: data.imageUrl,
        title: data.title,
        title_bn: data.title_bn,
        subtitle: data.subtitle,
        subtitle_bn: data.subtitle_bn,
        buttonText: data.buttonText,
        buttonLink: data.buttonLink,
        isActive: data.isActive,
        order: data.order,
      },
    });
    revalidatePath("/");
    updateTag("hero");
    return { success: true };
  } catch (error) {
    console.error("Failed to update hero slide:", error);
    return { success: false, error: "Failed to update slide" };
  }
}

export async function deleteHeroSlide(id: string) {
  try {
    await prisma.heroSlide.delete({
      where: { id },
    });
    revalidatePath("/");
    updateTag("hero");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete hero slide:", error);
    return { success: false, error: "Failed to delete slide" };
  }
}

export async function updateHeroSlideOrder(
  items: { id: string; order: number }[],
) {
  try {
    for (const item of items) {
      await prisma.heroSlide.update({
        where: { id: item.id },
        data: { order: item.order },
      });
    }
    revalidatePath("/");
    updateTag("hero");
    return { success: true };
  } catch (error) {
    console.error("Failed to update slide order:", error);
    return { success: false, error: "Failed to update order" };
  }
}
