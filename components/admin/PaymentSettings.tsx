'use client';

import { useState, useEffect, useMemo } from 'react';
import { updatePaymentConfig as updatePaymentServerConfig, getSiteConfig, updateSiteConfig } from '@/app/actions/settings';
import { useAdmin } from '@/components/providers/AdminProvider';
import { Percent, Loader2, Save, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Unused

import { PaymentConfig } from "@/types/common";
import { ImageUpload } from "@/components/admin/ImageUpload";

export function PaymentSettings() {
    const { settings, paymentConfig, updateSettings, updatePaymentConfig: updateContextPayment } = useAdmin();
    const [loading, setLoading] = useState(false); // No loading needed as context provides data
    const [saving, setSaving] = useState(false);

    // Local state for form editing - init from context
    const defaultConfig: PaymentConfig = {
        codEnabled: false,
        bkashEnabled: false,
        nagadEnabled: false,
        selfMfsEnabled: false,
        advancePaymentEnabled: false
    };

    const [config, setConfig] = useState<PaymentConfig>({ ...defaultConfig, ...paymentConfig });
    const [originalConfig, setOriginalConfig] = useState<PaymentConfig>({ ...defaultConfig, ...paymentConfig });
    const [taxPercentage, setTaxPercentage] = useState<number | string>(settings.taxPercentage || 0);

    // Sync from context when it loads (in case hard reload)
    useEffect(() => {
        if (paymentConfig) {

            // eslint-disable-next-line @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect
            setConfig((prev: any) => {
                // simple equality check to avoid re-render loop if object identity changes but content doesn't
                if (JSON.stringify(prev) === JSON.stringify(paymentConfig)) return prev;
                return { ...defaultConfig, ...paymentConfig } as PaymentConfig;
            });
            setOriginalConfig({ ...defaultConfig, ...paymentConfig } as PaymentConfig); // Also update original config when context updates
        }
    }, [paymentConfig]);

    // Sync tax percentage from context
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate prop sync from context
        setTaxPercentage(settings.taxPercentage || 0);
    }, [settings.taxPercentage]);

    // Derived state: check for changes
    const hasChanges = useMemo(() => {
        if (!originalConfig || !config) return false;
        return JSON.stringify(originalConfig) !== JSON.stringify(config);
    }, [config, originalConfig]);

    const handleSave = async () => {
        setSaving(true);

        // 1. Update Payment Config
        const res = await updatePaymentServerConfig(config);

        // 2. Update Tax (if changed)
        // Tax lives in SiteConfig, so we fetch current and update it.
        // Optimization: We could have a specific action for this, but this works.
        const currentSiteConfig = await getSiteConfig();
        if (currentSiteConfig) {
            await updateSiteConfig({ ...currentSiteConfig, taxPercentage: Number(taxPercentage) });
        }

        if (res.success) {
            toast.success("Payment settings saved successfully");

            // Update Context
            updateContextPayment(config);
            updateSettings({ ...settings, taxPercentage: Number(taxPercentage) });

            // Update local state helpers
            setOriginalConfig(config);

        } else {
            toast.error("Failed to save settings");
        }
        setSaving(false);
    };


    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-green-600" /> Payment Gateways
                    </h2>
                    <p className="text-sm text-slate-500 ml-8">Enable and configure your preferred payment methods</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            {/* Tax Configuration */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <Percent className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Tax Configuration</CardTitle>
                            <CardDescription>Set a tax percentage to be added to the order total</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Input
                                type="number"
                                value={taxPercentage}
                                onChange={(e) => setTaxPercentage(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                className="w-32 pr-8"
                                min="0"
                                step="any"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                        </div>
                        <Label className="text-gray-500">Tax added to total</Label>
                    </div>
                </CardContent>
            </Card>

            {/* Cash On Delivery */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-bold">৳</div>
                        <div>
                            <CardTitle className="text-base">Cash On Delivery</CardTitle>
                            <CardDescription>Accept cash payments on delivery</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {config.codEnabled && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>}
                        <Switch checked={config.codEnabled} onCheckedChange={(c) => setConfig({ ...config, codEnabled: c })} />
                    </div>
                </CardHeader>
            </Card>

            {/* bKash Merchant */}
            <Card className={config.bkashEnabled ? "border-pink-200 bg-pink-50/10" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center p-1 overflow-hidden">
                            <img src={config.bkashLogo || "/images/bkash-logo.png"} alt="bKash" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <CardTitle className="text-base">bKash Merchant</CardTitle>
                            <CardDescription>Configure bKash merchant credentials for automated payments</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {config.bkashEnabled && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>}
                        <Switch checked={config.bkashEnabled} onCheckedChange={(c) => setConfig({ ...config, bkashEnabled: c })} />
                    </div>
                </CardHeader>
                {config.bkashEnabled && (
                    <CardContent className="space-y-4 pt-0">
                        <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Merchant App Key</Label>
                                    <Input value={config.bkashAppKey || ''} onChange={(e) => setConfig({ ...config, bkashAppKey: e.target.value })} placeholder="App Key" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Merchant Secret Key</Label>
                                    <Input type="password" value={config.bkashSecretKey || ''} onChange={(e) => setConfig({ ...config, bkashSecretKey: e.target.value })} placeholder="Secret Key" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Merchant Username</Label>
                                    <Input value={config.bkashUsername || ''} onChange={(e) => setConfig({ ...config, bkashUsername: e.target.value })} placeholder="Username" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Merchant Password</Label>
                                    <Input type="password" value={config.bkashPassword || ''} onChange={(e) => setConfig({ ...config, bkashPassword: e.target.value })} placeholder="Password" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Custom bKash Logo</Label>
                                    <ImageUpload
                                        value={config.bkashLogo || ''}
                                        onChange={(url: string | string[]) => setConfig({ ...config, bkashLogo: Array.isArray(url) ? url[0] : url })}
                                        onRemove={() => setConfig({ ...config, bkashLogo: '' })}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Nagad Merchant */}
            <Card className={config.nagadEnabled ? "border-orange-200 bg-orange-50/10" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center p-1 overflow-hidden">
                            <img src={config.nagadLogo || "/images/nagad-logo.png"} alt="Nagad" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Nagad Merchant</CardTitle>
                            <CardDescription>Configure Nagad merchant credentials for automated payments</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {config.nagadEnabled && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>}
                        <Switch checked={config.nagadEnabled} onCheckedChange={(c) => setConfig({ ...config, nagadEnabled: c })} />
                    </div>
                </CardHeader>
                {config.nagadEnabled && (
                    <CardContent className="space-y-4 pt-0">
                        <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Merchant Number</Label>
                                    <Input value={config.nagadMerchantNumber || ''} onChange={(e) => setConfig({ ...config, nagadMerchantNumber: e.target.value })} placeholder="01..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Public Key</Label>
                                    <Input value={config.nagadPublicKey || ''} onChange={(e) => setConfig({ ...config, nagadPublicKey: e.target.value })} placeholder="Public Key" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Private Key</Label>
                                    <Input type="password" value={config.nagadPrivateKey || ''} onChange={(e) => setConfig({ ...config, nagadPrivateKey: e.target.value })} placeholder="Private Key" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Custom Nagad Logo</Label>
                                    <ImageUpload
                                        value={config.nagadLogo || ''}
                                        onChange={(url: string | string[]) => setConfig({ ...config, nagadLogo: Array.isArray(url) ? url[0] : url })}
                                        onRemove={() => setConfig({ ...config, nagadLogo: '' })}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Self MFS (Manual) */}
            <Card className={config.selfMfsEnabled ? "border-purple-200 bg-purple-50/10" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Self MFS (Manual Payment)</CardTitle>
                            <CardDescription>Accept payments directly to your personal bKash/Nagad</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {config.selfMfsEnabled && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>}
                        <Switch checked={config.selfMfsEnabled} onCheckedChange={(c) => setConfig({ ...config, selfMfsEnabled: c })} />
                    </div>
                </CardHeader>
                {config.selfMfsEnabled && (
                    <CardContent className="pt-0">
                        <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Select Payment Method</Label>
                                        <RadioGroup value={config.selfMfsType || 'bkash'} onValueChange={(v) => setConfig({ ...config, selfMfsType: v })} className="flex gap-4">
                                            <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${config.selfMfsType === 'bkash' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                                                <RadioGroupItem value="bkash" id="mfs-bkash" />
                                                <Label htmlFor="mfs-bkash" className="flex items-center cursor-pointer gap-2">
                                                    <img src="/images/bkash-logo.png" className="h-6 object-contain" alt="bKash" /> bKash
                                                </Label>
                                            </div>
                                            <div className={`flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-colors ${config.selfMfsType === 'nagad' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
                                                <RadioGroupItem value="nagad" id="mfs-nagad" />
                                                <Label htmlFor="mfs-nagad" className="flex items-center cursor-pointer gap-2">
                                                    <img src="/images/nagad-logo.png" className="h-6 object-contain" alt="Nagad" /> Nagad
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Add Phone No</Label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                                +88
                                            </span>
                                            <Input
                                                className="rounded-l-none"
                                                placeholder="01XXXXXXXXX"
                                                value={config.selfMfsPhone || ''}
                                                onChange={e => setConfig({ ...config, selfMfsPhone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Payment Instruction</Label>
                                        <Textarea
                                            placeholder="e.g. Send money to this number using Send Money option..."
                                            value={config.selfMfsInstruction || ''}
                                            onChange={e => setConfig({ ...config, selfMfsInstruction: e.target.value })}
                                            className="h-24"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Add QR Code</Label>
                                    <div className="border border-dashed border-gray-200 rounded-lg p-4 bg-gray-50/50">
                                        <ImageUpload
                                            value={config.selfMfsQrCode || ''}
                                            onChange={(url: string | string[]) => setConfig({ ...config, selfMfsQrCode: Array.isArray(url) ? url[0] : url })}
                                            onRemove={() => setConfig({ ...config, selfMfsQrCode: '' })}
                                        />
                                        <p className="text-xs text-slate-400 mt-2 text-center">
                                            Supported: JPG, PNG, WEBP. Max 2MB.
                                            <br />
                                            Recommended size: <strong>300x300px</strong>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Advance Payment */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                        <CardTitle className="text-base">Set your advance payment</CardTitle>
                        <CardDescription>Select how much amount you want to get advance from customer.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {config.advancePaymentEnabled && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>}
                        <Switch checked={config.advancePaymentEnabled} onCheckedChange={(c) => setConfig({ ...config, advancePaymentEnabled: c })} />
                    </div>
                </CardHeader>
                {config.advancePaymentEnabled && (
                    <CardContent className="space-y-4">
                        <RadioGroup
                            value={config.advancePaymentType || 'FULL'}
                            onValueChange={(v) => setConfig({ ...config, advancePaymentType: v })}
                            className="space-y-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="FULL" id="adv-full" />
                                <Label htmlFor="adv-full">Full Payment</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="DELIVERY" id="adv-delivery" />
                                <Label htmlFor="adv-delivery">Delivery Charge Only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="PERCENTAGE" id="adv-percentage" />
                                <Label htmlFor="adv-percentage">Percentage</Label>
                                {config.advancePaymentType === 'PERCENTAGE' && (
                                    <Input
                                        type="number"
                                        className="w-24 h-8 ml-2"
                                        placeholder="%"
                                        value={config.advancePaymentValue ?? ''}
                                        onChange={e => setConfig({ ...config, advancePaymentValue: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    />
                                )}
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="FIXED" id="adv-fixed" />
                                <Label htmlFor="adv-fixed">Fixed Amount</Label>
                                {config.advancePaymentType === 'FIXED' && (
                                    <Input
                                        type="number"
                                        className="w-32 h-8 ml-2"
                                        placeholder="Amount"
                                        value={config.advancePaymentValue ?? ''}
                                        onChange={e => setConfig({ ...config, advancePaymentValue: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    />
                                )}
                            </div>
                        </RadioGroup>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

// Icon helper
function Smartphone(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
            <path d="M12 18h.01" />
        </svg>
    );
}
