import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  getRootDomain,
  isPlatformMode,
  isSuperAdminEnabled,
  isTenantMode,
} from "@/lib/deployment";
import { encodeHost, normalizeHost } from "@/lib/domain";

export default async function RootPage() {
  const rootDomain = getRootDomain();
  const headerList = await headers();
  const rawHost =
    headerList.get("x-forwarded-host") || headerList.get("host") || "";
  const normalizedHost = normalizeHost(
    rawHost.replace(".localhost:3000", `.${rootDomain}`),
  );
  const hostname = normalizedHost;
  const isAppHost = hostname === `app.${rootDomain}`;
  const safeHost = encodeHost(hostname || rootDomain);

  if (isTenantMode) {
    if (isAppHost) return notFound();
    redirect(`/${safeHost}`);
  }

  if (isAppHost) {
    if (!isPlatformMode || !isSuperAdminEnabled) return notFound();
    redirect("/app");
  }

  redirect("/home");
}
