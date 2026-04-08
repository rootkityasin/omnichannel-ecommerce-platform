import { NextResponse } from "next/server";
import {
  getFilteredMenuData,
  getMenuBootstrapData,
  getMenuData,
} from "@/app/actions/menu";
import { normalizeHost } from "@/lib/domain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawDomain = searchParams.get("domain") || "";
  const domain = normalizeHost(rawDomain);
  const category = searchParams.get("category") || undefined;
  const filter = searchParams.get("filter") || undefined;
  const section = searchParams.get("section") || undefined;
  const search = searchParams.get("search") || undefined;
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const bootstrap = searchParams.get("bootstrap") === "1";
  const limit = limitParam ? Number(limitParam) : undefined;
  const offset = offsetParam ? Number(offsetParam) : undefined;

  const hasFilterParams =
    Boolean(category && category !== "all") ||
    Boolean(filter) ||
    Boolean(section) ||
    Boolean(search?.trim()) ||
    Number.isFinite(limit) ||
    Number.isFinite(offset);

  try {
    if (bootstrap) {
      const { products, categories, total, limit: bootstrapLimit } =
        await getMenuBootstrapData(domain, Number.isFinite(limit) ? limit : 18);

      return NextResponse.json(
        {
          products,
          categories,
          total,
          limit: bootstrapLimit,
          domain,
          bootstrap: true,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        },
      );
    }

    if (hasFilterParams) {
      const { products, total } = await getFilteredMenuData(domain, {
        category,
        filter,
        section,
        search,
        limit,
        offset,
      });

      return NextResponse.json(
        { products, total, domain, filtered: true },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          },
        },
      );
    }

    const { products, categories } = await getMenuData(domain);
    return NextResponse.json(
      { products, categories, domain },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load menu data" },
      { status: 500 },
    );
  }
}
