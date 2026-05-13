import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const DEFAULT_MEDIA_ROOT = "/data/media";
const DEFAULT_MEDIA_PUBLIC_PATH = "/media";

export const MEDIA_VARIANTS = {
  original: "original.webp",
  card: "card.webp",
  hero: "hero.webp",
  full: "full.webp",
  thumb: "thumb.webp",
  lqip: "lqip.webp",
} as const;

export type MediaVariant = keyof typeof MEDIA_VARIANTS;

type StoredMedia = {
  mediaId: string;
  directory: string;
  publicUrl: string;
};

const sanitizeSegment = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "uploads";

const sanitizeRelativePath = (value: string) =>
  value
    .split("/")
    .map(sanitizeSegment)
    .filter(Boolean)
    .join("/") || "uploads";

export const getMediaRoot = () =>
  path.resolve(process.env.MEDIA_ROOT || DEFAULT_MEDIA_ROOT);

export const getMediaPublicPath = () =>
  (process.env.MEDIA_PUBLIC_PATH || DEFAULT_MEDIA_PUBLIC_PATH).replace(/\/$/, "");

export const createMediaDirectory = async (resource = "uploads") => {
  const now = new Date();
  const mediaId = randomUUID();
  const relativeDirectory = path.posix.join(
    sanitizeRelativePath(resource),
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    mediaId,
  );
  const directory = path.join(getMediaRoot(), ...relativeDirectory.split("/"));
  await mkdir(directory, { recursive: true });

  return {
    mediaId,
    directory,
    publicUrl: `${getMediaPublicPath()}/${relativeDirectory}/${MEDIA_VARIANTS.original}`,
  } satisfies StoredMedia;
};

const fitCover = (width: number, height: number) => ({
  width,
  height,
  fit: "cover" as const,
  position: "attention" as const,
});

export const generateMediaVariants = async (
  input: Buffer,
  outputDirectory: string,
) => {
  await mkdir(outputDirectory, { recursive: true });

  const base = sharp(input, { failOn: "none" }).rotate();

  await Promise.all([
    base
      .clone()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toFile(path.join(outputDirectory, MEDIA_VARIANTS.original)),
    base
      .clone()
      .resize(fitCover(480, 600))
      .webp({ quality: 78 })
      .toFile(path.join(outputDirectory, MEDIA_VARIANTS.card)),
    base
      .clone()
      .resize(fitCover(900, 506))
      .webp({ quality: 80 })
      .toFile(path.join(outputDirectory, MEDIA_VARIANTS.hero)),
    base
      .clone()
      .resize({ width: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(outputDirectory, MEDIA_VARIANTS.full)),
    base
      .clone()
      .resize(fitCover(160, 160))
      .webp({ quality: 74 })
      .toFile(path.join(outputDirectory, MEDIA_VARIANTS.thumb)),
    base
      .clone()
      .resize(fitCover(20, 25))
      .blur(8)
      .webp({ quality: 28 })
      .toFile(path.join(outputDirectory, MEDIA_VARIANTS.lqip)),
  ]);
};

export const storeMediaBuffer = async (input: Buffer, resource = "uploads") => {
  const media = await createMediaDirectory(resource);
  await generateMediaVariants(input, media.directory);
  return media.publicUrl;
};

export const writeMigrationReport = async (filePath: string, data: unknown) => {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};
