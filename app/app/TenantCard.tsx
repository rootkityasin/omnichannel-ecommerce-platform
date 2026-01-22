'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import { ShieldAlert, Users, Calendar, LogIn, MoreVertical, Edit, Trash2, KeyRound, Ban, CheckCircle, ExternalLink } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteTenant, updateTenantStatus, updateTenantPlan, getImpersonationLink } from '@/app/actions/super-admin';

import { EditCompanyModal } from './EditCompanyModal';

// Reusing types roughly based on Prisma return
interface TenantProps {
    tenant: {
        id: string;
        name: string;
        slug: string;
        plan: string;
        isActive: boolean;
        createdAt: Date;
        _count: {
            users: number;
            orders: number;
        };
    };
}

export function TenantCard({ tenant }: TenantProps) {
    const [isPending, startTransition] = useTransition();
    const [isOpen, setIsOpen] = useState(false); // For Dropdown
    const [showDelete, setShowDelete] = useState(false);
    const [showPlan, setShowPlan] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    const handleAction = async (action: string) => {
        if (action === 'delete') {
            setShowDelete(true);
            return;
        }
        if (action === 'edit') {
            setShowEdit(true);
            return;
        }
        if (action === 'toggle_status') {
            startTransition(async () => {
                const res = await updateTenantStatus(tenant.id, !tenant.isActive);
                if (res.success) toast.success(`Tenant ${tenant.isActive ? 'disabled' : 'enabled'}`);
                else toast.error(res.error);
            });
        }
        if (action === 'impersonate') {
            startTransition(async () => {
                const res = await getImpersonationLink(tenant.id);
                if (res.success && res.url) {
                    toast.success("Redirecting to tenant admin...");
                    window.open(res.url, '_blank');
                } else {
                    toast.error(res.error || "Failed to generate link");
                }
            });
        }
    };

    const confirmDelete = async () => {
        startTransition(async () => {
            const res = await deleteTenant(tenant.id);
            if (res.success) {
                toast.success("Tenant deleted successfully");
                setShowDelete(false);
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleUpgrade = async (newPlan: string) => {
        startTransition(async () => {
            const res = await updateTenantPlan(tenant.id, newPlan);
            if (res.success) {
                toast.success(`Plan updated to ${newPlan}`);
                setShowPlan(false);
            } else {
                toast.error(res.error);
            }
        });
    };

    return (
        <>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow bg-white">
                <CardHeader className="pb-2 flex flex-row justify-between items-start space-y-0">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl uppercase">
                            {tenant.name.substring(0, 2)}
                        </div>
                        <div className="overflow-hidden">
                            <CardTitle className="text-lg font-semibold truncate" title={tenant.name}>{tenant.name}</CardTitle>
                            <p className="text-xs text-slate-400 truncate">{tenant.slug}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Badge className={
                            tenant.plan === 'PLATINUM' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                tenant.plan === 'GOLD' ? 'bg-amber-500 hover:bg-amber-600' :
                                    'bg-slate-500 hover:bg-slate-600'
                        }>
                            {tenant.plan}
                        </Badge>
                        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleAction('edit')}>
                                    <Edit className="w-4 h-4" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-red-600 focus:text-red-600" onClick={() => handleAction('delete')}>
                                    <Trash2 className="w-4 h-4" /> Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer text-blue-600 focus:text-blue-600" onClick={() => handleAction('impersonate')}>
                                    <LogIn className="w-4 h-4" /> Login As Company
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                    <KeyRound className="w-4 h-4" /> Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleAction('toggle_status')}>
                                    {tenant.isActive ? <Ban className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {tenant.isActive ? 'Login Disable' : 'Enable Login'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="py-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-rose-50 p-2 rounded text-rose-600">
                            <Users className="w-4 h-4 mx-auto mb-1" />
                            {tenant._count.users}
                        </div>
                        <div className="bg-amber-50 p-2 rounded text-amber-600">
                            <ShieldAlert className="w-4 h-4 mx-auto mb-1" />
                            {/* Assuming orders as 'alerts' for visual matching or 0 */}
                            {tenant._count.orders > 99 ? '99+' : tenant._count.orders}
                        </div>
                        <div className={tenant.isActive ? "bg-cyan-50 p-2 rounded text-cyan-600" : "bg-red-50 p-2 rounded text-red-600"}>
                            <Calendar className="w-4 h-4 mx-auto mb-1" />
                            {tenant.isActive ? 'Active' : 'Disabled'}
                        </div>
                    </div>
                    <div className="text-xs text-slate-400 flex justify-between">
                        <span>Created: {new Date(tenant.createdAt).toLocaleDateString()}</span>
                        {!tenant.isActive && <span className="text-red-500 flex items-center gap-1">● Inactive</span>}
                        {tenant.isActive && <span className="text-emerald-600 flex items-center gap-1">● Active</span>}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-0">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="outline" onClick={() => setShowPlan(true)} className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50">Upgrade</Button>
                        <Button variant="secondary" className="w-full bg-slate-100" onClick={() => handleAction('impersonate')}>Admin Hub</Button>
                    </div>
                    <Button
                        disabled={isPending}
                        onClick={() => handleAction('impersonate')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2"
                    >
                        {isPending ? <span className="animate-pulse">Loading...</span> : <><LogIn className="w-4 h-4" /> Login as Company</>}
                    </Button>
                </CardFooter>
            </Card>

            {/* Delete Dialog */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tenant?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete <b>{tenant.name}</b> and ALL associated data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Plan Upgrade Dialog */}
            <Dialog open={showPlan} onOpenChange={setShowPlan}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upgrade Plan: {tenant.name}</DialogTitle>
                        <DialogDescription>Change the subscription tier for this company.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-1 gap-2">
                            {['FREE', 'SILVER', 'GOLD', 'PLATINUM'].map((p) => (
                                <Button
                                    key={p}
                                    variant={tenant.plan === p ? 'default' : 'outline'}
                                    className={tenant.plan === p ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                                    onClick={() => handleUpgrade(p)}
                                    disabled={isPending || tenant.plan === p}
                                >
                                    {p} Plan {tenant.plan === p && '(Current)'}
                                </Button>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <EditCompanyModal
                tenant={tenant}
                open={showEdit}
                onOpenChange={setShowEdit}
            />
        </>

    );
}
