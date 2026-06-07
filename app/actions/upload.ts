"use server";

import { storeMediaBuffer } from "@/lib/server-media";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/avif",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function uploadMedia(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    const resource = String(formData.get("resource") || "uploads");

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return { success: false, error: "Only image uploads are allowed" };
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return { success: false, error: "Image is too large. Max size is 10MB" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    const tenant = tenantId
      ? await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { slug: true },
        })
      : null;
    const tenantPrefix = tenant?.slug ? `tenants/${tenant.slug}` : "global";
    const url = await storeMediaBuffer(buffer, `${tenantPrefix}/${resource}`);

    return { success: true, url };
  } catch (error) {
    console.error("Media upload error:", error);
    return { success: false, error: "Media upload failed" };
  }
}
