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
// ... imports
import { EditCompanyModal } from './EditCompanyModal';


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
    plans: any[]; // Prisma Plan[]
}

export function TenantCard({ tenant, plans }: TenantProps) {
    const [isPending, startTransition] = useTransition();
    // ... items
    const [isOpen, setIsOpen] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [showPlan, setShowPlan] = useState(false);
    const [showEdit, setShowEdit] = useState(false);

    // Dynamic Plan Details
    const planDetails = plans.find(p => p.slug === tenant.plan || p.id === tenant.plan) || plans[0] || { name: tenant.plan, color: 'bg-slate-500' };

    // ... handlers
    const handleAction = async (action: string) => {
        // ...
        // (Keeping existing handlers)
        if (action === 'delete') { setShowDelete(true); return; }
        if (action === 'edit') { setShowEdit(true); return; }
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
                    toast.success("Redirecting...");
                    window.open(res.url, '_blank');
                } else {
                    toast.error(res.error || "Failed to link");
                }
            });
        }
    };

    // ... confirmDelete

    const handleUpgrade = async (newPlan: string) => {
        startTransition(async () => {
            // Pass SKU/Slug or ID depending on how we store it. Assuming logic stores slug currently.
            // If new system uses plan ID, we might need to adjust `updateTenantPlan`.
            // For back-compat, assuming we store SLUG in tenant.plan.
            const res = await updateTenantPlan(tenant.id, newPlan);
            if (res.success) {
                toast.success(`Plan updated to ${newPlan}`);
                setShowPlan(false);
            } else {
                toast.error(res.error);
            }
        });
    };

    const confirmDelete = async () => {
        startTransition(async () => {
            const res = await deleteTenant(tenant.id);
            if (res.success) { toast.success("Deleted"); setShowDelete(false); }
            else toast.error(res.error);
        });
    }

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
                        <Badge className={`${planDetails.color} hover:opacity-90`}>
                            {planDetails.name}
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
                {/* Content... */}
                <CardContent className="py-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-rose-50 p-2 rounded text-rose-600">
                            <Users className="w-4 h-4 mx-auto mb-1" />
                            {tenant._count.users}
                        </div>
                        <div className="bg-amber-50 p-2 rounded text-amber-600">
                            <ShieldAlert className="w-4 h-4 mx-auto mb-1" />
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
                    <Button disabled={isPending} onClick={() => handleAction('impersonate')} className="w-full bg-indigo-600 gap-2">
                        {isPending ? <span className="animate-pulse">Loading...</span> : <><LogIn className="w-4 h-4" /> Login as Company</>}
                    </Button>
                </CardFooter>
            </Card>

            {/* Delete Dialog */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tenant?</DialogTitle>
                        <DialogDescription>This action cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={isPending}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Plan Upgrade Dialog (Using Dynamic Plans) */}
            <Dialog open={showPlan} onOpenChange={setShowPlan}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Upgrade Plan: {tenant.name}</DialogTitle>
                        <DialogDescription>Choose a subscription tier.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-3 py-4">
                        {plans.map((p) => {
                            const featuresArray = typeof p.features === 'string'
                                ? JSON.parse(p.features)  // Handle potential stringified JSON
                                : Array.isArray(p.features) ? p.features : [];

                            return (
                                <div key={p.id} className={`flex items-center justify-between p-4 rounded-lg border ${tenant.plan === p.slug ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-200'}`}>
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            {p.name}
                                            {p.isPopular && <Badge className="bg-emerald-500 text-[10px] h-5">POPULAR</Badge>}
                                            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                                ${p.price}{p.period}
                                            </span>
                                            {p.originalPrice && p.originalPrice > p.price && (
                                                <span className="text-xs font-normal text-slate-400 line-through">
                                                    ${p.originalPrice}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={tenant.plan === p.slug ? 'secondary' : 'default'}
                                        onClick={() => handleUpgrade(p.slug)} // Sending SLUG
                                        disabled={isPending || tenant.plan === p.slug}
                                        className={tenant.plan === p.slug ? "text-emerald-700 bg-emerald-100" : "bg-slate-900"}
                                    >
                                        {tenant.plan === p.slug ? 'Current' : 'Select'}
                                    </Button>
                                </div>
                            )
                        })}
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
