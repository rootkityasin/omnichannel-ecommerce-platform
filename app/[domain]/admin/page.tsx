import { getDashboardMetrics } from "@/app/actions/analytics";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  params,
}: {
  readonly params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  // Fetch aggregated true 'All Time' stats from the database instead of client memory
  const metrics = await getDashboardMetrics(domain);

  return <DashboardClient metrics={metrics} />;
}
