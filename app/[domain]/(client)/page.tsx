import { getHeroSlides } from "@/app/actions/hero";
import { getSiteConfig } from "@/app/actions/settings";
import { getCategories } from "@/app/actions/category";
import { getHomepageSeoCopy } from "@/app/actions/story";
import { HomeClient } from "@/components/client/HomeClient";

export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ domain: string }> }>) {
  // Fetch TOP FOLD data instantly
  // We do NOT wait for sections here to allow instant FCP
  const { domain } = await params;
  const [heroSlides, config, categories, categorySeoCopy] = await Promise.all([
    getHeroSlides(domain),
    getSiteConfig(domain),
    getCategories(domain),
    getHomepageSeoCopy(),
  ]);

  return (
    <HomeClient
      domain={domain}
      heroSlides={heroSlides}
      config={config}
      categories={categories}
      categorySeoCopy={categorySeoCopy}
    />
  );
}

// Use ISR with 60-second revalidation for optimal caching
// Admin changes trigger revalidatePath('/') to update immediately
export const revalidate = 60;
