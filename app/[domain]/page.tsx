import { Suspense } from "react";
import { getHeroSlides } from "@/app/actions/hero";
import { getSiteConfig } from "@/app/actions/settings";
import { getCategories } from "@/app/actions/category";
import { HomeClient } from "@/components/client/HomeClient";
import { HomeSections } from "@/components/server/HomeSections";

export const dynamic = "force-dynamic";

export default async function DomainHome({
  params,
}: Readonly<{ params: Promise<{ domain: string }> }>) {
  const { domain } = await params;
  const [heroSlides, config, categories] = await Promise.all([
    getHeroSlides(domain),
    getSiteConfig(domain),
    getCategories(domain),
  ]);

  return (
    <HomeClient heroSlides={heroSlides} config={config} categories={categories}>
      <Suspense fallback={<SectionsLoading />}>
        <HomeSections domain={domain} />
      </Suspense>
    </HomeClient>
  );
}

function SectionsLoading() {
  return (
    <div className="space-y-12 py-8">
      {[1, 2].map((i) => (
        <div key={i} className="container mx-auto px-4 space-y-4">
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="w-[160px] h-[240px] bg-slate-100 rounded-xl flex-none animate-pulse"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
