'use client';

import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Check, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { getPlans, savePlan, deletePlan, seedPlans } from '@/app/actions/plans';

// Types
interface Plan {
    id: string;
    slug: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number | null;
    features: any; // Prisma Json
    color: string;
    isActive: boolean;
    isPopular: boolean;
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});
    const [openDialog, setOpenDialog] = useState(false);

    const fetchPlans = async () => {
        setIsLoading(true);
        const res = await getPlans();
        if (res.success && res.plans) {
            setPlans(res.plans);
        } else {
            toast.error("Failed to load plans");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleSave = async () => {
        if (!currentPlan.name || !currentPlan.price) {
            toast.error("Name and Price are required.");
            return;
        }

        startTransition(async () => {
            const featuresArray = typeof currentPlan.features === 'string'
                ? currentPlan.features.split('\n').filter((f: string) => f.trim() !== '')
                : Array.isArray(currentPlan.features) ? currentPlan.features : [];

            const res = await savePlan({
                id: currentPlan.id,
                slug: currentPlan.slug,
                name: currentPlan.name,
                description: currentPlan.description || '',
                price: parseFloat(String(currentPlan.price)),
                originalPrice: currentPlan.originalPrice ? parseFloat(String(currentPlan.originalPrice)) : undefined,
                features: featuresArray,
                color: currentPlan.color || 'bg-slate-500',
                isPopular: !!currentPlan.isPopular,
                isActive: currentPlan.isActive !== false // defaults true
            });

            if (res.success) {
                toast.success(currentPlan.id ? "Plan updated" : "Plan created");
                setOpenDialog(false);
                fetchPlans();
            } else {
                toast.error(res.error || "Failed to save");
            }
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This might affect existing subscriptions.")) return;
        startTransition(async () => {
            const res = await deletePlan(id);
            if (res.success) {
                toast.success("Plan deleted");
                fetchPlans();
            } else {
                toast.error(res.error);
            }
        });
    };

    const handleSeed = async () => {
        startTransition(async () => {
            const res = await seedPlans();
            if (res.success) {
                toast.success("Plans seeded successfully!");
                fetchPlans();
            } else {
                toast.error(res.message || res.error);
            }
        });
    };

    const openEdit = (plan?: Plan) => {
        if (plan) {
            setCurrentPlan({
                ...plan,
                // Convert JSON features to string for textarea
                features: Array.isArray(plan.features) ? plan.features.join('\n') : ''
            });
            setIsEditing(true);
        } else {
            setCurrentPlan({
                price: 0,
                isActive: true,
                color: 'bg-slate-500',
                features: ''
            });
            setIsEditing(false);
        }
        setOpenDialog(true);
    };

    if (isLoading) return <div className="p-8"><Loader2 className="animate-spin text-emerald-600" /></div>;

    return (
        <div className="p-8 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Pricing Plans</h1>
                    <p className="text-slate-500 mt-1">Manage subscription tiers, prices, and features.</p>
                </div>
                <div className="flex gap-2">
                    {plans.length === 0 && (
                        <Button variant="outline" onClick={handleSeed} disabled={isPending}>
                            <RefreshCcw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} /> Seed Defaults
                        </Button>
                    )}
                    <Button onClick={() => openEdit()} className="bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Plan
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Preview List */}
                {plans.map((plan) => (
                    <Card key={plan.id} className={`border relative ${plan.isPopular ? 'border-emerald-500 shadow-md' : 'border-slate-200'}`}>
                        {plan.isPopular && <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">POPULAR</div>}
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                                        <Badge className={plan.color}>Badge</Badge>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <span className="text-3xl font-bold">৳{plan.price}</span>
                                {plan.originalPrice && (
                                    <span className="text-lg text-slate-400 line-through ml-2">৳{plan.originalPrice}</span>
                                )}
                                <span className="text-slate-500 text-sm">/mo</span>
                            </div>
                            <ul className="space-y-2 text-sm">
                                {(Array.isArray(plan.features) ? plan.features : []).map((f: string, i: number) => (
                                    <li key={i} className="flex gap-2">
                                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 border-t pt-4">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                                <Edit className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(plan.id)}>
                                <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Edit Modal */}
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Plan' : 'New Plan'}</DialogTitle>
                        <DialogDescription>Configure plan details visible to customers.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Plan Name</Label>
                                <Input value={currentPlan.name || ''} onChange={e => setCurrentPlan({ ...currentPlan, name: e.target.value })} placeholder="e.g. Gold" />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (ID)</Label>
                                <Input value={currentPlan.slug || ''} onChange={e => setCurrentPlan({ ...currentPlan, slug: e.target.value.toUpperCase() })} placeholder="GOLD" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input type="number" value={currentPlan.price || ''} onChange={e => setCurrentPlan({ ...currentPlan, price: parseFloat(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Original Price (Discount)</Label>
                                <Input type="number" value={currentPlan.originalPrice || ''} onChange={e => setCurrentPlan({ ...currentPlan, originalPrice: parseFloat(e.target.value) })} placeholder="Optional" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input value={currentPlan.description || ''} onChange={e => setCurrentPlan({ ...currentPlan, description: e.target.value })} />
                        </div>

                        <div className="space-y-2">
                            <Label>Features (One per line)</Label>
                            <Textarea
                                value={currentPlan.features as string || ''}
                                onChange={e => setCurrentPlan({ ...currentPlan, features: e.target.value })}
                                className="h-32"
                                placeholder="Up to 100 orders&#10;Analytics&#10;Support"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Badge Color (Tailwind Class)</Label>
                                <Input value={currentPlan.color || ''} onChange={e => setCurrentPlan({ ...currentPlan, color: e.target.value })} placeholder="bg-blue-500" />
                            </div>
                            <div className="flex flex-col gap-2 pt-6">
                                <div className="flex items-center gap-2">
                                    <Switch checked={currentPlan.isPopular} onCheckedChange={c => setCurrentPlan({ ...currentPlan, isPopular: c })} />
                                    <Label>Mark as Popular</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isPending} className="bg-emerald-600">
                            {isPending ? 'Saving...' : 'Save Plan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
