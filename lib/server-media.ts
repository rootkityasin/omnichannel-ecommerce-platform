import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";

const DEFAULT_RUSTFS_REGION = "us-east-1";
const CACHE_CONTROL = "public, max-age=31536000, immutable";

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
  keyPrefix: string;
  publicUrl: string;
};

let s3Client: S3Client | null = null;

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

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

const getRequiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required for RustFS media storage.`);
  return value;
};

const getRustfsEndpoint = () => getRequiredEnv("RUSTFS_ENDPOINT").replace(/\/$/, "");

export const getRustfsBucket = () => getRequiredEnv("RUSTFS_BUCKET");

export const getRustfsPublicBaseUrl = () =>
  (process.env.RUSTFS_PUBLIC_URL || `${getRustfsEndpoint()}/${getRustfsBucket()}`).replace(
    /\/$/,
    "",
  );

export const getRustfsPublicUrl = (key: string) =>
  `${getRustfsPublicBaseUrl()}/${trimSlashes(key)}`;

const getS3Client = () => {
  if (s3Client) return s3Client;

  s3Client = new S3Client({
    endpoint: getRustfsEndpoint(),
    region: process.env.RUSTFS_REGION || DEFAULT_RUSTFS_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: getRequiredEnv("RUSTFS_ACCESS_KEY"),
      secretAccessKey: getRequiredEnv("RUSTFS_SECRET_KEY"),
    },
  });

  return s3Client;
};

export const createMediaObjectPrefix = async (resource = "uploads") => {
  const now = new Date();
  const mediaId = randomUUID();
  const keyPrefix = [
    sanitizeRelativePath(resource),
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    mediaId,
  ].join("/");

  return {
    mediaId,
    keyPrefix,
    publicUrl: getRustfsPublicUrl(`${keyPrefix}/${MEDIA_VARIANTS.original}`),
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
  keyPrefix: string,
) => {
  const base = sharp(input, { failOn: "none" }).rotate();
  const variants = await Promise.all([
    base
      .clone()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86 })
      .toBuffer()
      .then((body) => ({ filename: MEDIA_VARIANTS.original, body })),
    base
      .clone()
      .resize(fitCover(480, 600))
      .webp({ quality: 78 })
      .toBuffer()
      .then((body) => ({ filename: MEDIA_VARIANTS.card, body })),
    base
      .clone()
      .resize(fitCover(900, 506))
      .webp({ quality: 80 })
      .toBuffer()
      .then((body) => ({ filename: MEDIA_VARIANTS.hero, body })),
    base
      .clone()
      .resize({ width: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
      .then((body) => ({ filename: MEDIA_VARIANTS.full, body })),
    base
      .clone()
      .resize(fitCover(160, 160))
      .webp({ quality: 74 })
      .toBuffer()
      .then((body) => ({ filename: MEDIA_VARIANTS.thumb, body })),
    base
      .clone()
      .resize(fitCover(20, 25))
      .blur(8)
      .webp({ quality: 28 })
      .toBuffer()
      .then((body) => ({ filename: MEDIA_VARIANTS.lqip, body })),
  ]);

  await Promise.all(
    variants.map(({ filename, body }) =>
      getS3Client().send(
        new PutObjectCommand({
          Bucket: getRustfsBucket(),
          Key: `${keyPrefix}/${filename}`,
          Body: body,
          ACL: "public-read",
          ContentType: "image/webp",
          CacheControl: CACHE_CONTROL,
        }),
      ),
    ),
  );
};

export const storeMediaBuffer = async (input: Buffer, resource = "uploads") => {
  const media = await createMediaObjectPrefix(resource);
  await generateMediaVariants(input, media.keyPrefix);
  return media.publicUrl;
};

export const writeMigrationReport = async (filePath: string, data: unknown) => {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};
