import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { getRustfsBucket, getS3Client } from "@/lib/server-media";

export const runtime = "nodejs";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (
    !segments.length ||
    segments.some((segment) => !segment || segment === ".." || segment.includes("/"))
  ) {
    return new NextResponse("Invalid media path", { status: 400 });
  }

  try {
    const object = await getS3Client().send(
      new GetObjectCommand({
        Bucket: getRustfsBucket(),
        Key: segments.join("/"),
      }),
    );

    if (!object.Body) {
      return new NextResponse("Not found", { status: 404 });
    }

    const body = object.Body as BodyInit & {
      transformToWebStream?: () => ReadableStream;
    };

    const headers = new Headers({
      "Content-Type": object.ContentType || "application/octet-stream",
      "Cache-Control": object.CacheControl || CACHE_CONTROL,
    });
    if (object.ContentLength) headers.set("Content-Length", String(object.ContentLength));
    if (object.ETag) headers.set("ETag", object.ETag);

    return new NextResponse(
      body.transformToWebStream ? body.transformToWebStream() : body,
      { headers },
    );
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
