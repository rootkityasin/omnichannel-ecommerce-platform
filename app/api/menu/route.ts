import { NextResponse } from "next/server";
import { getMenuData } from "@/app/actions/menu";
import { normalizeHost } from "@/lib/domain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawDomain = searchParams.get("domain") || "";
  const domain = normalizeHost(rawDomain);

  try {
    const { products, categories } = await getMenuData(domain);

    return NextResponse.json({ products, categories, domain });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load menu data" },
      { status: 500 },
    );
  }
}
