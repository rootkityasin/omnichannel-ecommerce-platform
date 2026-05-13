const CLOUDINARY_HOST = "res.cloudinary.com";
const LOCAL_MEDIA_PREFIX = "/media/";

type CloudinaryOptions = {
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

const isCloudinaryUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.includes(CLOUDINARY_HOST) &&
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

const replaceLocalVariant = (url: string, variant: string) => {
  if (!isLocalMediaUrl(url)) return url;
  return url.replace(/\/[^/]+\.webp(?:\?.*)?$/, `/${variant}`);
};

const selectLocalVariant = (options: CloudinaryOptions) => {
  if ((options.width || 0) >= 1400 || options.crop === "limit") return "full.webp";
  if ((options.width || 0) <= 200) return "thumb.webp";
  if (options.aspect === "16:9" || (options.width || 0) >= 800) return "hero.webp";
  if (options.aspect === "4:5" || (options.width || 0) >= 360) return "card.webp";
  return "original.webp";
};

export const buildCloudinaryUrl = (
  url: string | null | undefined,
  options: CloudinaryOptions,
) => {
  if (!url) return "";
  if (isLocalMediaUrl(url)) return replaceLocalVariant(url, selectLocalVariant(options));
  if (!isCloudinaryUrl(url)) return url;
  const parts = [
    options.format || "f_auto",
    options.quality || "q_auto:good",
    options.crop ? `c_${options.crop}` : null,
    options.gravity ? `g_${options.gravity}` : null,
    options.aspect ? `ar_${options.aspect}` : null,
    options.width ? `w_${options.width}` : null,
  ].filter(Boolean);
  const transform = parts.join(",");
  return injectTransform(url, transform);
};

export const buildCloudinaryLqip = (
  url: string | null | undefined,
  options: LqipOptions,
) => {
  if (!url) return "";
  if (isLocalMediaUrl(url)) return replaceLocalVariant(url, "lqip.webp");
  if (!isCloudinaryUrl(url)) return "";
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
  return injectTransform(url, transform);
};
