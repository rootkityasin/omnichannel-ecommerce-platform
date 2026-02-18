'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createTenant } from '@/app/actions/super-admin';
import { generateImpersonationToken } from '@/app/actions/user';
import { Loader2, Plus, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShopType } from '@prisma/client';

export function AddCompanyModal() {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        email: '',
        password: '',
        shopType: 'RESTAURANT' as ShopType
    });

    const handleCreate = async () => {
        if (!formData.name || !formData.slug || !formData.email) {
            toast.error("Please fill all required fields");
            return;
        }

        startTransition(async () => {
            const res = await createTenant(formData);
            if (res.success) {
                toast.success("Company created successfully!");

                // Auto Login Redirect
                if (res.user?.id) {
                    toast.loading("Redirecting to your shop dashboard...");
                    const tokenRes = await generateImpersonationToken(res.user.id);

                    if (tokenRes.success && tokenRes.token) {
                        const protocol = window.location.protocol;
                        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';
                        // Construct tenant URL
                        const tenantUrl = `${protocol}//${res.tenant.slug}.${rootDomain}/account?impersonate=${res.user.id}&token=${tokenRes.token}`;

                        window.location.href = tenantUrl;
                        return;
                    }
                }

                setOpen(false);
                setFormData({ name: '', slug: '', email: '', password: '', shopType: 'RESTAURANT' });
            } else {
                toast.error(res.error || "Failed to create company");
            }
        });
    };

    // Auto-generate slug from name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        setFormData(prev => ({ ...prev, name, slug: prev.slug ? prev.slug : slug }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-500 hover:bg-emerald-600 shadow-md">
                    <Plus className="w-4 h-4 mr-2" /> Add Company
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-600" /> Add New Company
                    </DialogTitle>
                    <DialogDescription>
                        Create a new tenant workspace. This will provision a database record and a default admin account.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={handleNameChange}
                            className="col-span-3"
                            placeholder="Acme Corp"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="slug" className="text-right">
                            Slug
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="slug"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="acme-corp"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">{formData.slug}.platform.com</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="col-span-3"
                            placeholder="admin@acme.com"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Shop Type</Label>
                        <Select
                            value={formData.shopType}
                            onValueChange={(val) => setFormData({ ...formData, shopType: val as ShopType })}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                                <SelectItem value="GROCERY">Grocery</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleCreate} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Create Tenant'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

