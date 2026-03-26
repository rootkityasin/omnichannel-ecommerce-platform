import { getCategories } from "@/app/actions/category";
import { getProducts } from "@/app/actions/product";
import { getSiteConfig } from "@/app/actions/settings";
import { normalizeHost } from "@/lib/domain";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hostHeader =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    url.host;
  const domain = normalizeHost(hostHeader);
  const config = await getSiteConfig(domain);
  const baseUrl = config.canonicalUrl || `https://${domain}`;

  const staticRoutes = [
    "",
    "/menu",
    "/story",
    "/account/login",
    "/account/register",
  ];
  const [products, categories] = await Promise.all([
    getProducts(domain),
    getCategories(domain),
  ]);

  const urls = [
    ...staticRoutes.map((route) => ({
      loc: `${baseUrl}${route}`,
      changefreq: route === "" ? "daily" : "weekly",
      priority: route === "" ? "1.0" : "0.8",
    })),
    ...products.map((product) => ({
      loc: `${baseUrl}/buy/${product.id}`,
      changefreq: "weekly",
      priority: "0.9",
    })),
    ...categories.map((category) => ({
      loc: `${baseUrl}/menu?category=${category.id}`,
      changefreq: "weekly",
      priority: "0.7",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=3600",
    },
  });
}
