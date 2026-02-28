import { platformPrisma } from "@/lib/platformPrisma";
import { normalizePlan } from "@/lib/planUtils";
import { DashboardClient } from "./DashboardClient";

export default async function SuperAdminDashboard() {
  // Parallel data fetching with retry for Accelerate stability
  type DashboardProps = React.ComponentProps<typeof DashboardClient>;
  let tenants: DashboardProps["tenants"] = [];
  let plans: DashboardProps["plans"] = [];

  let retries = 0;
  const MAX_RETRIES = 2;
  let lastError = null;

  while (retries < MAX_RETRIES) {
    try {
      const [_tenants, _plans] = await Promise.all([
        platformPrisma.tenantRegistry.findMany({
          orderBy: { createdAt: "desc" },
        }),
        platformPrisma.planCatalog.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        }),
      ]);
      tenants = (_tenants as unknown as DashboardProps["tenants"]).map(
        (tenant) => ({
          ...tenant,
          plan: normalizePlan(
            (tenant as { planSlug?: string }).planSlug ?? "FREE",
          ),
          isActive: (tenant as { status?: string }).status === "ACTIVE",
          primaryDomain: (tenant as { primaryDomain?: string }).primaryDomain,
          _count: { users: 0, orders: 0, products: 0 },
        }),
      );
      plans = _plans as DashboardProps["plans"];
      break;
    } catch (err: any) {
      retries++;
      lastError = err;
      if (err?.message?.includes("Accelerate") && retries < MAX_RETRIES) {
        console.warn(
          `⚠️ SuperAdminDashboard: Prisma Accelerate retry ${retries}/${MAX_RETRIES}...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        break;
      }
    }
  }

  if (tenants.length === 0 && lastError) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-semibold">
            Database Connection Issue
          </p>
          <p className="text-sm text-slate-500 max-w-md">
            We&apos;re having trouble connecting to the database engine. This is
            usually transient.
          </p>
          <p className="text-xs text-slate-400">
            Please refresh the page to try again.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardClient tenants={tenants} plans={plans} />;
}
