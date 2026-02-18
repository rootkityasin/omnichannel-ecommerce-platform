'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useTransition, useEffect } from 'react';
import { toast } from 'sonner';
import { getTenantDetails, updateTenantDetails } from '@/app/actions/super-admin';
import { Loader2, Edit, Save, Building2, Phone, Mail, MapPin, ImageIcon, SlidersHorizontal, KeyRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { ShopType } from '@prisma/client';

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
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        shopName: tenant.name,
        slug: tenant.slug, // Read-only
        shopType: 'RESTAURANT' as ShopType,
        contactPhone: '',
        contactEmail: '',
        contactAddress: '',
        logoUrl: '',
        measurementUnit: 'PCS',
        weightUnitValue: 200,
        volumeUnitValue: 1000,
        adminEmail: '',
        adminPassword: ''
    });

    // Load data on open
    useEffect(() => {
        if (open) {
            setLoading(true);
            getTenantDetails(tenant.id).then((res) => {
                if (res.success && res.data) {
                    setFormData({
                        shopName: res.data.shopName,
                        slug: res.data.slug,
                        shopType: res.data.shopType,
                        contactPhone: res.data.contactPhone,
                        contactEmail: res.data.contactEmail,
                        contactAddress: res.data.contactAddress,
                        logoUrl: res.data.logoUrl || '',
                        measurementUnit: res.data.measurementUnit || 'PCS',
                        weightUnitValue: res.data.weightUnitValue || 200,
                        volumeUnitValue: res.data.volumeUnitValue || 1000,
                        adminEmail: res.data.adminEmail || '',
                        adminPassword: ''
                    });
                } else {
                    toast.error("Failed to load tenant details");
                }
                setLoading(false);
            });
        }
    }, [open, tenant.id]);

    const handleUpdate = async () => {
        startTransition(async () => {
            const res = await updateTenantDetails(tenant.id, {
                shopName: formData.shopName,
                shopType: formData.shopType,
                contactPhone: formData.contactPhone,
                contactEmail: formData.contactEmail,
                contactAddress: formData.contactAddress,
                logoUrl: formData.logoUrl,
                measurementUnit: formData.measurementUnit,
                weightUnitValue: formData.weightUnitValue,
                volumeUnitValue: formData.volumeUnitValue,
                adminEmail: formData.adminEmail,
                adminPassword: formData.adminPassword
            });

            if (res.success) {
                toast.success("Tenant details updated successfully!");
                onOpenChange(false);
            } else {
                toast.error(res.error || "Failed to update tenant");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="w-5 h-5 text-blue-600" /> Edit Company Details
                    </DialogTitle>
                    <DialogDescription>
                        Manage general settings and branding for <strong>{tenant.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Contact Information */}
                        <div className="space-y-4 border-b border-slate-100 pb-4">
                            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-slate-500" /> Contact Info
                            </h3>
                            <p className="text-xs text-slate-500 ml-6">Displayed in footer and contact page.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-900">Phone Number</Label>
                                    <Input
                                        value={formData.contactPhone}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        placeholder="+880 1..."
                                        className="bg-white text-slate-900 border-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-900">Email Address</Label>
                                    <Input
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        placeholder="hello@example.com"
                                        className="bg-white text-slate-900 border-slate-300"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location & Branding */}
                        <div className="space-y-4 border-b border-slate-100 pb-4">
                            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-500" /> Location & Branding
                            </h3>
                            <p className="text-xs text-slate-500 ml-6">Your store identity and physical address.</p>
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-900">Shop Name</Label>
                                    <Input
                                        value={formData.shopName}
                                        onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                        placeholder="e.g. Crab & Khai"
                                        className="bg-white text-slate-900 border-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-900">Slug (Subdomain)</Label>
                                    <Input value={formData.slug} disabled className="bg-slate-100 text-slate-500 border-slate-200" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-900">Shop Logo</Label>
                                    <div className="max-w-xs">
                                        <ImageUpload
                                            value={formData.logoUrl ? [formData.logoUrl] : []}
                                            onChange={(url) => {
                                                const val = Array.isArray(url) ? url[0] : url;
                                                setFormData({ ...formData, logoUrl: val });
                                            }}
                                            onRemove={() => setFormData({ ...formData, logoUrl: '' })}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Recommended size: <strong>500x500px</strong>. Supported formats: JPG, PNG, WEBP.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-900">Address</Label>
                                    <Textarea
                                        value={formData.contactAddress}
                                        onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
                                        className="h-20 resize-none bg-white text-slate-900 border-slate-300"
                                        placeholder="Street Address, City, Country"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Settings */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                                <SlidersHorizontal className="w-4 h-4 text-slate-500" /> Settings
                            </h3>
                            <p className="text-xs text-slate-500 ml-6">Configure measurement units and system preferences.</p>

                            <div className="space-y-2">
                                <Label className="text-slate-900">Measurement Unit</Label>
                                <Select
                                    value={formData.measurementUnit}
                                    onValueChange={(val) => setFormData({ ...formData, measurementUnit: val })}
                                >
                                    <SelectTrigger className="bg-white text-slate-900 border-slate-300"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PCS">Pieces (Default)</SelectItem>
                                        <SelectItem value="WEIGHT">Weight (Kg/Gm)</SelectItem>
                                        <SelectItem value="VOLUME">Volume (Litre/Ml)</SelectItem>
                                    </SelectContent>
                                </Select>

                                {formData.measurementUnit === 'WEIGHT' && (
                                    <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-100">
                                        <Label className="text-xs text-slate-500 mb-1 block">Weight per Unit (Grams)</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900">1 Unit =</span>
                                            <Input
                                                type="number"
                                                className="w-24 h-8 bg-white text-slate-900 border-slate-300"
                                                value={formData.weightUnitValue}
                                                onChange={(e) => setFormData({ ...formData, weightUnitValue: parseInt(e.target.value) || 0 })}
                                            />
                                            <span className="text-sm font-medium text-slate-900">gm</span>
                                        </div>
                                    </div>
                                )}

                                {formData.measurementUnit === 'VOLUME' && (
                                    <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-100">
                                        <Label className="text-xs text-slate-500 mb-1 block">Volume per Unit (Ml)</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900">1 Unit =</span>
                                            <Input
                                                type="number"
                                                className="w-24 h-8 bg-white text-slate-900 border-slate-300"
                                                value={formData.volumeUnitValue}
                                                onChange={(e) => setFormData({ ...formData, volumeUnitValue: parseInt(e.target.value) || 0 })}
                                            />
                                            <span className="text-sm font-medium text-slate-900">ml</span>
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-400">Controls how stock is displayed and calculated.</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-900">Shop Type</Label>
                                <Select
                                    value={formData.shopType}
                                    onValueChange={(val) => setFormData({ ...formData, shopType: val as ShopType })}
                                >
                                    <SelectTrigger className="bg-white text-slate-900 border-slate-300">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="RESTAURANT">Restaurant (Kitchen Flow)</SelectItem>
                                        <SelectItem value="GROCERY">Grocery (Retail)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-500">
                                    <strong>Restaurant:</strong> Enables Kitchen Order Board.
                                    <br />
                                    <strong>Grocery:</strong> Standard order table view.
                                </p>
                            </div>
                        </div>

                        {/* Admin Credentials */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-slate-500" /> Admin Credentials
                            </h3>
                            <p className="text-xs text-slate-500 ml-6">Reset login details for the tenant admin.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-slate-900">Admin Login Email</Label>
                                    <Input
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                        placeholder="admin@tenant.com"
                                        className="bg-white text-slate-900 border-slate-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-900">New Admin Password</Label>
                                    <Input
                                        type="password"
                                        value={formData.adminPassword}
                                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="bg-white text-slate-900 border-slate-300"
                                    />
                                    <p className="text-[10px] text-slate-400">Leave blank to keep current password.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={isPending || loading}
                        className="bg-blue-600 hover:bg-blue-700 w-32"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
