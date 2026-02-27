import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const hubs = await prisma.hub.findMany();
    return NextResponse.json({
      success: true,
      hubs,
      count: hubs.length,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}
