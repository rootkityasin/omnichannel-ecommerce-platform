import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  getRootDomain,
  isPlatformMode,
  isSuperAdminEnabled,
  isTenantMode,
} from "@/lib/deployment";
import { encodeHost, normalizeHost } from "@/lib/domain";

export const dynamic = "force-dynamic";

export async function GET() {
  const headerList = await headers();
  const rawHost = headerList.get("host") || "";
  const rawForwardedHost = headerList.get("x-forwarded-host") || "";
  const rawProto = headerList.get("x-forwarded-proto") || "";

  const rootDomain = getRootDomain();
  const normalizedHost = normalizeHost(
    (rawForwardedHost || rawHost).replace(".localhost:3000", `.${rootDomain}`),
  );

  return NextResponse.json({
    rawHost,
    rawForwardedHost,
    rawProto,
    rootDomain,
    normalizedHost,
    safeHost: encodeHost(normalizedHost || rootDomain),
    deploymentMode: isTenantMode ? "tenant" : "platform",
    isPlatformMode,
    isSuperAdminEnabled,
  });
}
