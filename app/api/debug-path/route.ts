import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { normalizeHost } from "@/lib/domain";
import { getRootDomain } from "@/lib/deployment";

export const dynamic = "force-dynamic";

export async function GET() {
  const headerList = await headers();
  const rawHost =
    headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const rootDomain = getRootDomain();
  const normalizedHost = normalizeHost(
    rawHost.replace(".localhost:3000", `.${rootDomain}`),
  );
  const slug = (normalizedHost || rootDomain).split(".")[0];

  return NextResponse.json({
    rawHost,
    rootDomain,
    normalizedHost,
    slug,
    expectedPath: `/${slug}`,
  });
}
