import { platformHandlers } from "@/auth.platform";
import { isPlatformMode, isSuperAdminEnabled } from "@/lib/deployment";
import { NextResponse } from "next/server";

const guard = () =>
  isPlatformMode && isSuperAdminEnabled
    ? null
    : NextResponse.json({ error: "Not found" }, { status: 404 });

export async function GET(request: Request) {
  const blocked = guard();
  if (blocked) return blocked;
  return platformHandlers.GET(request as never);
}

export async function POST(request: Request) {
  const blocked = guard();
  if (blocked) return blocked;
  return platformHandlers.POST(request as never);
}
