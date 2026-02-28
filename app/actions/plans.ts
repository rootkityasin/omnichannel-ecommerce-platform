"use server";

import { platformPrisma } from "@/lib/platformPrisma";
import { isPlatformMode, isSuperAdminEnabled } from "@/lib/deployment";
import { revalidatePath } from "next/cache";
import { platformAuth } from "@/auth.platform";
import type { Prisma } from "@prisma/client";

async function checkPermission() {
  if (!isPlatformMode || !isSuperAdminEnabled) {
    throw new Error("Plans are disabled in this deployment.");
  }
  const session = await platformAuth();
  // Assuming SUPER_ADMIN or some validation
  // if (!session) throw new Error("Unauthorized");
  return session;
}

export async function getPlans() {
  await checkPermission();
  try {
    const plans = await platformPrisma.planCatalog.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return { success: true, plans };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function savePlan(data: {
  id?: string;
  slug?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[]; // Receive as array
  color: string;
  isPopular: boolean;
  isActive: boolean;
}) {
  await checkPermission();

  try {
    const payload = {
      slug: data.slug || data.name.toUpperCase().replace(/[^A-Z0-9]/g, "_"),
      name: data.name,
      description: data.description,
      price: data.price,
      originalPrice: data.originalPrice,
      features: JSON.stringify(data.features), // Store as JSON string if not native array in db, but Prisma JSON type handles objects/arrays directly usually.
      // Prisma schema says Json, so can pass array directly if typed correctly.
      color: data.color,
      isPopular: data.isPopular,
      isActive: data.isActive,
    };

    // Prisma Json type quirk in some versions: pass exact array

    if (data.id) {
      await platformPrisma.planCatalog.update({
        where: { id: data.id },
        data: {
          ...payload,
          features: data.features as Prisma.InputJsonValue,
        },
      });
    } else {
      await platformPrisma.planCatalog.create({
        data: {
          ...payload,
          features: data.features as Prisma.InputJsonValue,
          sortOrder: 0, // Default
        },
      });
    }

    revalidatePath("/app/plans");
    revalidatePath("/app");
    return { success: true };
  } catch (error) {
    console.error("Save Plan Error:", error);
    return { success: false, error: String(error) };
  }
}

export async function deletePlan(id: string) {
  await checkPermission();
  try {
    await platformPrisma.planCatalog.delete({ where: { id } });
    revalidatePath("/app/plans");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Initial Seed function (callable via UI or script)
export async function seedPlans() {
  await checkPermission();

  const count = await platformPrisma.planCatalog.count();
  if (count > 0) return { success: false, message: "Plans already exist" };

  const plans = [
    {
      slug: "free",
      name: "Free Plan",
      price: 0,
      period: "/month",
      description: "Starter access for demos and trials.",
      features: ["1 Staff Account", "20 Products", "50 Orders/mo"],
      color: "bg-slate-500",
      sortOrder: 0,
    },
    {
      slug: "silver",
      name: "Silver Plan",
      price: 1000,
      period: "/month",
      description: "Best for new shops just starting out.",
      features: [
        "2 Staff Accounts",
        "50 Products",
        "100 Orders/mo",
        "Basic Analytics",
        "Standard Support",
      ],
      color: "bg-slate-400",
      sortOrder: 1,
    },
    {
      slug: "gold",
      name: "Gold Plan",
      price: 2500,
      period: "/month",
      description: "Professional tools for growing businesses.",
      features: [
        "5 Staff Accounts",
        "500 Products",
        "1,000 Orders/mo",
        "Advanced Analytics",
        "Priority Support",
        "Custom Domain",
        "Custom Mail Address",
        "Email Marketing",
        "Multiple Hubs/Branches",
        "Payment Gateway Integration",
      ],
      color: "bg-yellow-500",
      sortOrder: 2,
      isPopular: true,
    },
    {
      slug: "platinum",
      name: "Platinum Plan",
      price: 5000,
      period: "/month",
      description: "Maximum power for established businesses.",
      features: [
        "15 Staff Accounts",
        "Unlimited Products",
        "Unlimited Orders",
        "24/7 Priority Support",
        "Multiple Hubs/Branches",
        "Custom Domain",
        "Custom Mail Address",
        "Email Marketing",
        "Payment Gateway Integration",
        "Leads Database",
        "IP Calling",
        "Courier Integration",
        "Full Setup Support",
      ],
      color: "bg-green-500",
      sortOrder: 3,
    },
  ];

  for (const p of plans) {
    await platformPrisma.planCatalog.create({
      data: p,
    });
  }

  revalidatePath("/app/plans");
  return { success: true, message: "Seeded successfully" };
}
