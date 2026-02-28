"use server";

import { getSiteConfig } from "@/app/actions/settings";

export async function fetchSiteConfig(domain?: string) {
  return getSiteConfig(domain);
}
