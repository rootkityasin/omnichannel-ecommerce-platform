'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
// You might need an updateTenant action in super-admin.ts if not present, checking...
// Assuming createTenant logic covers similar ground or I need to add updateTenant.
// For now, I will use updateTenantStatus as a placeholder or add a specific updateDetails action.
import { updateTenantStatus } from '@/app/actions/super-admin';
import { Loader2, Edit, Building2 } from 'lucide-react';

// Ideally, add updateTenantDetails to super-admin.ts. 
// For this turn, I will create the file but realizing I need the server action first.
// I will create the file assuming the action exists, then update server actions.

interface EditCompanyModalProps {
    tenant: {
        id: string;
        name: string;
        slug: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditCompanyModal({ tenant, open, onOpenChange }: EditCompanyModalProps) {
    const [isPending, startTransition] = useTransition();

    const [formData, setFormData] = useState({
        name: tenant.name,
        slug: tenant.slug,
    });

    const handleUpdate = async () => {
        // Placeholder for real update logic
        toast.info("Update logic would go here. (Requires updateTenantDetails action)");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="w-5 h-5 text-blue-600" /> Edit Company
                    </DialogTitle>
                    <DialogDescription>
                        Update details for {tenant.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="edit-name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="col-span-3"
                        />
                    </div>
                    {/* Slug usually immutable or dangerous to change, keeping read-only or warning */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-slug" className="text-right">
                            Slug
                        </Label>
                        <Input
                            id="edit-slug"
                            value={formData.slug}
                            disabled
                            className="col-span-3 bg-slate-50"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" onClick={handleUpdate} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
