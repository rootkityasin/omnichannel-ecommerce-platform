import { getSiteConfig } from "@/app/actions/settings";
import { normalizeHost } from "@/lib/domain";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hostHeader =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  const domain = normalizeHost(hostHeader);
  const config = await getSiteConfig(domain);
  const baseUrl = config.canonicalUrl || `https://${domain}`;
  const rules = config.robots?.split(",").map((value) => value.trim()) || [
    "index",
    "follow",
  ];
  const isAllowed = rules.includes("index") && rules.includes("follow");

  const content = [
    "User-agent: *",
    isAllowed ? "Allow: /" : "Disallow: /",
    isAllowed ? "Disallow: /admin/" : "",
    isAllowed ? "Disallow: /api/" : "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ]
    .filter(Boolean)
    .join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=3600",
    },
  });
}
