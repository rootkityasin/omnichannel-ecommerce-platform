
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { TenantCard } from './TenantCard';
import { AddCompanyModal } from './AddCompanyModal';

export default async function SuperAdminDashboard() {
    const session = await auth();

    // Security Check (Pseudo-code for now - assuming only specific email is Super Admin)
    // In real implementation, check role === 'SUPER_ADMIN'
    // if (session?.user?.email !== process.env.SUPER_ADMIN_EMAIL) return <div>Access Denied</div>

    const tenants = await prisma.tenant.findMany({
        include: {
            _count: {
                select: { users: true, orders: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Manage Companies</h1>
                    <p className="text-slate-500 mt-1">Dashboard {'>'} Companies • {tenants.length} Total</p>
                </div>
                <AddCompanyModal />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tenants.map((tenant) => (
                    <TenantCard key={tenant.id} tenant={tenant} />
                ))}
            </div>
        </div>
    );
}
