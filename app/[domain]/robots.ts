import { MetadataRoute } from "next";
import { getSiteConfig } from "@/app/actions/settings";
import { decodeHost } from "@/lib/domain";

export default async function robots({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<MetadataRoute.Robots> {
  const { domain } = await params;
  const decodedDomain = decodeHost(domain);
  const config = await getSiteConfig(decodedDomain);
  const baseUrl = config.canonicalUrl || `https://${decodedDomain}`;

  const rules = config.robots?.split(",").map((r: string) => r.trim()) || [
    "index",
    "follow",
  ];
  const isAllowed = rules.includes("index") && rules.includes("follow");

  return {
    rules: {
      userAgent: "*",
      allow: isAllowed ? "/" : undefined,
      disallow: isAllowed ? ["/admin/", "/api/"] : "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
