import { readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

import { getMediaRoot } from "@/lib/server-media";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const mediaRoot = getMediaRoot();
  const requestedPath = path.resolve(mediaRoot, ...segments);

  if (!requestedPath.startsWith(`${mediaRoot}${path.sep}`)) {
    return new NextResponse("Invalid media path", { status: 400 });
  }

  try {
    const fileStat = await stat(requestedPath);
    if (!fileStat.isFile()) return new NextResponse("Not found", { status: 404 });

    const file = await readFile(requestedPath);
    const extension = path.extname(requestedPath).toLowerCase();
    return new NextResponse(file, {
      headers: {
        "Content-Type": CONTENT_TYPES[extension] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
