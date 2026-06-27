import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";

/**
 * Server-side tracking utility for Meta Conversions API (CAPI) and Internal Logging
 */

interface UserData {
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
  area?: string;
  clientIpAddress?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
}

interface CustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  num_items?: number;
  order_id?: string;
  [key: string]: unknown; // Allow for extra raw data
}

interface MetaEvent {
  event_name: string;
  event_id?: string;
  event_time: number;
  action_source:
    | "website"
    | "app"
    | "physical_store"
    | "system_generated"
    | "other";
  user_data: {
    em?: string[]; // Hashed email
    ph?: string[]; // Hashed phone
    fn?: string[]; // Hashed first name
    ln?: string[]; // Hashed last name
    ct?: string[]; // Hashed city
    st?: string[]; // Hashed state/area
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: CustomData;
  event_source_url?: string;
}

const hashData = (data: string) => {
  return crypto
    .createHash("sha256")
    .update(data.trim().toLowerCase())
    .digest("hex");
};

export async function trackMetaEvent(
  eventName: string,
  userData: UserData,
  customData?: CustomData,
  sourceUrl?: string,
) {
  let headersList;
  try {
    headersList = await headers();
  } catch (e) {
    // Dynamic headers not available (e.g. static compilation/build time)
  }

  const resolvedIp =
    userData.clientIpAddress ||
    headersList?.get("x-forwarded-for")?.split(",")[0] ||
    "127.0.0.1";
  const resolvedUA = userData.userAgent || headersList?.get("user-agent") || "";

  // Parse cookies for fbc and fbp if not provided
  let resolvedFbc = userData.fbc;
  let resolvedFbp = userData.fbp;
  if (headersList && (!resolvedFbc || !resolvedFbp)) {
    try {
      const cookieHeader = headersList.get("cookie") || "";
      const cookiesMap: Record<string, string> = {};
      cookieHeader.split(";").forEach((cookie) => {
        const parts = cookie.trim().split("=");
        if (parts.length >= 2) {
          const key = parts[0];
          const val = parts.slice(1).join("=");
          cookiesMap[key] = val;
        }
      });
      if (!resolvedFbc) resolvedFbc = cookiesMap["_fbc"];
      if (!resolvedFbp) resolvedFbp = cookiesMap["_fbp"];
    } catch (cookieError) {
      console.warn("Failed to parse cookies for server tracking", cookieError);
    }
  }

  // 1. Internal Logging (Save Raw Data to Database)
  try {
    await prisma.trackingEvent.create({
      data: {
        eventName,
        customerName: userData.name,
        customerPhone: userData.phone,
        customerEmail: userData.email,
        customerArea: userData.area,
        customerCity: userData.city,
        ipAddress: resolvedIp,
        userAgent: resolvedUA,
        sourceUrl: sourceUrl,
        eventData: (customData || {}) as unknown as Prisma.InputJsonValue,
        rawPayload: {
          userData: {
            ...userData,
            clientIpAddress: resolvedIp,
            userAgent: resolvedUA,
            fbc: resolvedFbc,
            fbp: resolvedFbp,
          },
          customData,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (dbError) {
    console.error("Internal Tracking Log Error:", dbError);
  }

  // 2. Meta CAPI (External Signal with Hashed PII)
  // Fetch Credentials from DB first, fallback to Env
  let config: {
    metaPixelId?: string | null;
    metaAccessToken?: string | null;
  } | null = null;
  try {
    config = await prisma.siteConfig.findFirst({
      select: { metaPixelId: true, metaAccessToken: true },
    });
  } catch (dbError) {
    console.warn(
      "Meta CAPI config lookup failed. Falling back to env.",
      dbError,
    );
  }

  const pixelId = config?.metaPixelId || process.env.META_PIXEL_ID;
  const accessToken = config?.metaAccessToken || process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn(
      "Meta Pixel ID or Access Token missing. Skipping Meta CAPI signal.",
    );
    return;
  }

  const payload: MetaEvent = {
    event_name: eventName,
    event_id:
      typeof customData?.event_id === "string" ? customData.event_id : undefined,
    event_time: Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: {
      client_ip_address: resolvedIp,
      client_user_agent: resolvedUA,
      fbc: resolvedFbc,
      fbp: resolvedFbp,
    },
    custom_data: customData,
    event_source_url: sourceUrl || process.env.NEXT_PUBLIC_BASE_URL,
  };


  // Add Hashed User Data for Meta Matching
  if (userData.email) payload.user_data.em = [hashData(userData.email)];
  if (userData.phone) payload.user_data.ph = [hashData(userData.phone)];

  if (userData.name) {
    const parts = userData.name.trim().split(/\s+/);
    if (parts.length > 0) {
      payload.user_data.fn = [hashData(parts[0])]; // First Name
      if (parts.length > 1) {
        payload.user_data.ln = [hashData(parts[parts.length - 1])]; // Last Name
      }
    }
  }

  if (userData.city) payload.user_data.ct = [hashData(userData.city)];
  if (userData.area) payload.user_data.st = [hashData(userData.area)];

  try {
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: [payload],
        }),
      },
    );

    const result = await response.json();
    if (!response.ok) {
      console.error("Meta CAPI Error:", result);
    }
    return result;
  } catch (error) {
    console.error("Meta CAPI Fetch Error:", error);
  }
}
