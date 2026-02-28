const CLOUDINARY_HOST = "res.cloudinary.com";

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

export const buildCloudinaryUrl = (
  url: string | null | undefined,
  options: CloudinaryOptions,
) => {
  if (!url || !isCloudinaryUrl(url)) return url || "";
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
  if (!url || !isCloudinaryUrl(url)) return "";
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
