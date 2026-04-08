import { NextResponse } from "next/server";
import { getHomeSections } from "@/app/actions/section";
import { normalizeHost } from "@/lib/domain";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawDomain = searchParams.get("domain") || "";
  const domain = normalizeHost(rawDomain);

  try {
    const sections = await getHomeSections(domain);
    return NextResponse.json(
      { sections, domain },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load home sections" },
      { status: 500 },
    );
  }
}
