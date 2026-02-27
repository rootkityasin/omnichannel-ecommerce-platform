import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Assumes this is where prisma is instantiated

export async function GET() {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { name: { contains: "crab", mode: "insensitive" } },
      select: { id: true, name: true, slug: true, plan: true },
    });

    let updatedCount = 0;
    for (const t of tenants) {
      await prisma.tenant.update({
        where: { id: t.id },
        data: { plan: "PREMIUM" },
      });
      updatedCount++;
    }

    return NextResponse.json({ success: true, tenants, updatedCount });
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) });
  }
}
