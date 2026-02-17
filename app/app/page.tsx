import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from './DashboardClient';

export default async function SuperAdminDashboard() {
    const session = await auth();

    // Parallel data fetching
    const [tenants, plans] = await Promise.all([
        prisma.tenant.findMany({
            include: {
                _count: {
                    select: { users: true, orders: true, products: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        })
    ]);

    type DashboardProps = React.ComponentProps<typeof DashboardClient>;
    return <DashboardClient tenants={tenants as DashboardProps['tenants']} plans={plans as DashboardProps['plans']} />;
}
