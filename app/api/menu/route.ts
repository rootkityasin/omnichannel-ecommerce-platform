import { NextResponse } from "next/server";
import { getProducts } from "@/app/actions/product";
import { getCategories } from "@/app/actions/category";
import { normalizeHost } from "@/lib/domain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawDomain = searchParams.get("domain") || "";
  const domain = normalizeHost(rawDomain);

  try {
    const [products, categories] = await Promise.all([
      getProducts(domain),
      getCategories(domain),
    ]);

    return NextResponse.json({ products, categories, domain });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load menu data" },
      { status: 500 },
    );
  }
}
