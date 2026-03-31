import { getAnalyticsMetrics } from "@/app/actions/analytics";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
  params,
}: {
  readonly params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  // Fetch aggregated true 'All Time' stats from the database directly,
  // bypassing the 1000-order client safety limit.
  const metrics = await getAnalyticsMetrics(domain);

  return <AnalyticsClient metrics={metrics} />;
}
