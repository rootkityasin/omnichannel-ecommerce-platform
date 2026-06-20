const LEGACY_CLOUDINARY_HOST = "res.cloudinary.com";
const LOCAL_MEDIA_PREFIX = "/media/";
const RUSTFS_PUBLIC_BASE_URL = (
  process.env.NEXT_PUBLIC_RUSTFS_PUBLIC_BASE_URL || ""
).replace(/\/$/, "");
const MEDIA_VARIANT_PATTERN =
  /\/(?:original|card|hero|full|thumb|lqip)\.webp(\?.*)?$/;

type MediaOptions = {
  width?: number;
  aspect?: string;
  crop?: "fill" | "fit" | "scale" | "thumb" | "limit";
  gravity?: "auto" | "face" | "center";
  quality?: string;
  format?: string;
};

type LqipOptions = {
  aspect?: string;
  crop?: "fill" | "fit" | "scale" | "thumb" | "limit";
  gravity?: "auto" | "face" | "center";
};

const isLegacyCloudinaryUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes(LEGACY_CLOUDINARY_HOST) &&
      parsed.pathname.includes("/upload/")
    );
  } catch {
    return false;
  }
};

const injectTransform = (url: string, transform: string) => {
  const [before, after] = url.split("/upload/");
  if (!after) return url;
  if (after.startsWith("v") || after.startsWith("q_") || after.includes("/")) {
    return `${before}/upload/${transform}/${after}`;
  }
  return `${before}/upload/${transform}/${after}`;
};

const isLocalMediaUrl = (url: string) => url.startsWith(LOCAL_MEDIA_PREFIX);

const isVariantMediaUrl = (url: string) => MEDIA_VARIANT_PATTERN.test(url);

export const normalizeMediaUrl = (url: string | null | undefined) => {
  if (!url) return "";
  if (isLocalMediaUrl(url)) return url;
  if (RUSTFS_PUBLIC_BASE_URL && url.startsWith(`${RUSTFS_PUBLIC_BASE_URL}/`)) {
    return `${LOCAL_MEDIA_PREFIX}${url.slice(RUSTFS_PUBLIC_BASE_URL.length + 1)}`;
  }

  try {
    const parsed = new URL(url);
    const pathWithSearch = `${parsed.pathname}${parsed.search}`;
    if (!isVariantMediaUrl(pathWithSearch)) return url;

    const segments = parsed.pathname.split("/").filter(Boolean);
    const keyStart = segments.findIndex(
      (segment) => segment === "tenants" || segment === "global",
    );
    if (keyStart === -1) return url;

    return `${LOCAL_MEDIA_PREFIX}${segments.slice(keyStart).join("/")}${parsed.search}`;
  } catch {
    return url;
  }
};

const replaceMediaVariant = (url: string, variant: string) =>
  url.replace(MEDIA_VARIANT_PATTERN, `/${variant}$1`);

const selectLocalVariant = (options: MediaOptions) => {
  if ((options.width || 0) >= 1400 || options.crop === "limit") return "full.webp";
  if ((options.width || 0) <= 200) return "thumb.webp";
  if (options.aspect === "16:9" || (options.width || 0) >= 800) return "hero.webp";
  if (options.aspect === "4:5" || (options.width || 0) >= 360) return "card.webp";
  return "original.webp";
};

export const buildMediaUrl = (
  url: string | null | undefined,
  options: MediaOptions,
) => {
  if (!url) return "";
  const mediaUrl = normalizeMediaUrl(url);
  if (isLocalMediaUrl(mediaUrl) || isVariantMediaUrl(mediaUrl)) {
    return replaceMediaVariant(mediaUrl, selectLocalVariant(options));
  }
  if (!isLegacyCloudinaryUrl(mediaUrl)) return mediaUrl;
  const parts = [
    options.format || "f_auto",
    options.quality || "q_auto:good",
    options.crop ? `c_${options.crop}` : null,
    options.gravity ? `g_${options.gravity}` : null,
    options.aspect ? `ar_${options.aspect}` : null,
    options.width ? `w_${options.width}` : null,
  ].filter(Boolean);
  const transform = parts.join(",");
  return injectTransform(mediaUrl, transform);
};

export const buildMediaLqip = (
  url: string | null | undefined,
  options: LqipOptions,
) => {
  if (!url) return "";
  const mediaUrl = normalizeMediaUrl(url);
  if (isLocalMediaUrl(mediaUrl) || isVariantMediaUrl(mediaUrl)) {
    return replaceMediaVariant(mediaUrl, "lqip.webp");
  }
  if (!isLegacyCloudinaryUrl(mediaUrl)) return "";
  const parts = [
    "f_auto",
    "q_10",
    "e_blur:200",
    options.crop ? `c_${options.crop}` : null,
    options.gravity ? `g_${options.gravity}` : null,
    options.aspect ? `ar_${options.aspect}` : null,
    "w_20",
  ].filter(Boolean);
  const transform = parts.join(",");
  return injectTransform(mediaUrl, transform);
};
