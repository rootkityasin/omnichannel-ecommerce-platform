import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { Shield, AlertTriangle, UserCheck, Smartphone, Key, Users } from 'lucide-react';
import { TokenEditor } from '@/components/admin/TokenEditor';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UsersTab } from '@/components/admin/UsersTab';

import { BlockedListTab } from '@/components/admin/BlockedListTab';

export const dynamic = 'force-dynamic';

export default async function SecurityDashboard() {
    const logs = await prisma.securityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const devices = await prisma.trustedDevice.findMany({
        orderBy: { lastUsed: 'desc' }
    });

    const config = await prisma.siteConfig.findFirst();
    const currentToken = config?.adminSetupToken || 'crab-secret-setup-123';

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                <Shield className="w-8 h-8 text-green-600" />
                Security & Access
            </h1>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white border text-slate-600">
                    <TabsTrigger value="overview">Security Overview</TabsTrigger>
                    <TabsTrigger value="users">Users & Roles</TabsTrigger>
                    <TabsTrigger value="blocked">Block List</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 1. Access Control Settings */}
                        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Key className="w-5 h-5 text-purple-600" />
                                Access Control
                            </h2>
                            <div className="bg-purple-50 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-900">Admin Setup Token</h3>
                                    <p className="text-sm text-slate-500 max-w-xl">
                                        This secret code is required to authorize new devices. Change it periodically to maintain security.
                                    </p>
                                </div>
                                <TokenEditor initialToken={currentToken} />
                            </div>
                        </div>

                        {/* 2. Trusted Devices */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-blue-500" />
                                Trusted Devices (30-Day Access)
                            </h2>
                            <div className="space-y-4">
                                {devices.map((device) => (
                                    <div key={device.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <div>
                                            <p className="font-bold text-slate-800">{device.name}</p>
                                            <p className="text-xs text-slate-500 truncate max-w-[200px]" title={device.userAgent || ''}>
                                                {device.userAgent}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Expires</p>
                                            <p className="text-sm font-bold text-slate-700">{format(device.expiresAt, 'PPP')}</p>
                                        </div>
                                    </div>
                                ))}
                                {devices.length === 0 && <p className="text-slate-400 text-sm">No trusted devices found.</p>}
                            </div>
                        </div>

                        {/* 3. Security Audit Log */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-500" />
                                Security Audit Log
                            </h2>
                            <div className="space-y-0 divide-y divide-slate-100 h-[300px] overflow-y-auto">
                                {logs.map((log) => (
                                    <div key={log.id} className="py-3 flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{log.action}</p>
                                            <p className="text-xs text-slate-500">{log.details || log.userAgent}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.severity === 'HIGH' ? 'bg-red-100 text-red-600' :
                                                log.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {log.severity}
                                            </span>
                                            <p className="text-[10px] text-slate-400 mt-1">{format(log.createdAt, 'PP p')}</p>
                                        </div>
                                    </div>
                                ))}
                                {logs.length === 0 && <p className="text-slate-400 text-sm">No analytics logs found.</p>}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="users">
                    <UsersTab />
                </TabsContent>

                <TabsContent value="blocked">
                    <BlockedListTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
