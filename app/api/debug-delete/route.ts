import { NextResponse } from "next/server";
import { deleteArchivedProduct } from "@/app/actions/product";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    let p = await prisma.product.findFirst({ where: { stage: "Archived" } });
    if (!p) {
      // Find ANY product and archive it for the test
      p = await prisma.product.findFirst();
      if (!p)
        return NextResponse.json({ message: "No products exist at all!" });

      await prisma.product.update({
        where: { id: p.id },
        data: { stage: "Archived" },
      });
      console.log("Archived product for testing: " + p.id);
    }

    try {
      const res = await deleteArchivedProduct(p.id);
      return NextResponse.json({ message: "Server action executed!", res });
    } catch (err: any) {
      return NextResponse.json({
        error: "Server action threw an unhandled exception!",
        name: err?.name,
        code: err?.code,
        message: err?.message,
        string: String(err),
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: String(error) });
  }
}
