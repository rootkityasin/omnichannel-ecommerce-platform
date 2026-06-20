import { NextRequest, NextResponse } from "next/server";

import { getRustfsPublicUrl } from "@/lib/server-media";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (!segments.length || segments.some((segment) => segment === "..")) {
    return new NextResponse("Invalid media path", { status: 400 });
  }

  try {
    return NextResponse.redirect(getRustfsPublicUrl(segments.join("/")), 308);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
