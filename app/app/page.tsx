
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Users, Calendar, LogIn } from 'lucide-react';

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
        }
    });

    return (
        <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Manage Companies</h1>
                    <p className="text-slate-500">Dashboard {'>'} Companies</p>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-600">+ Add Company</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tenants.map((tenant) => (
                    <Card key={tenant.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2 flex flex-row justify-between items-start space-y-0">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                                    {tenant.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-semibold">{tenant.name}</CardTitle>
                                    <p className="text-xs text-slate-400">{tenant.slug}</p>
                                </div>
                            </div>
                            <Badge className={tenant.plan === 'PLATINUM' ? 'bg-emerald-500' : 'bg-slate-500'}>
                                {tenant.plan}
                            </Badge>
                        </CardHeader>
                        <CardContent className="py-4 space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                <div className="bg-rose-50 p-2 rounded text-rose-600">
                                    <Users className="w-4 h-4 mx-auto mb-1" />
                                    {tenant._count.users}
                                </div>
                                <div className="bg-amber-50 p-2 rounded text-amber-600">
                                    <ShieldAlert className="w-4 h-4 mx-auto mb-1" />
                                    0
                                </div>
                                <div className="bg-cyan-50 p-2 rounded text-cyan-600">
                                    <Calendar className="w-4 h-4 mx-auto mb-1" />
                                    Active
                                </div>
                            </div>
                            <div className="text-xs text-slate-400 flex justify-between">
                                <span>Created: {new Date(tenant.createdAt).toLocaleDateString()}</span>
                                <span className="text-emerald-600 flex items-center gap-1">● Active</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2 pt-0">
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button variant="outline" className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50">Upgrade</Button>
                                <Button variant="secondary" className="w-full bg-slate-100">Admin Hub</Button>
                            </div>
                            {/* Login As - The Killer Feature */}
                            {/* This would link to a special auth endpoint to generate a session for that tenant */}
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
                                <LogIn className="w-4 h-4" /> Login as Company
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
