"use server";

import { getSiteConfig, updateSiteConfig } from "@/app/actions/settings";

export async function fetchSiteConfig(domain?: string) {
  return getSiteConfig(domain);
}

export async function saveSiteConfig(data: Record<string, unknown>) {
  return updateSiteConfig(data);
}
