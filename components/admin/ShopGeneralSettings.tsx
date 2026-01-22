'use client';

import { useState, useEffect } from 'react';
import { getSiteConfig, updateSiteConfig, getPaymentConfig, updatePaymentConfig } from '@/app/actions/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, MapPin, Phone, Mail, FileWarning, SlidersHorizontal, Image as ImageIcon, Settings } from 'lucide-react';
import { MediaUpload } from '@/components/admin/MediaUpload';

export function ShopGeneralSettings({ initialConfig }: { initialConfig?: any }) {
    const [loading, setLoading] = useState(!initialConfig);
    const [saving, setSaving] = useState(false);

    // Maintain a reference to the 'original' state for comparison
    const [originalConfig, setOriginalConfig] = useState<any>(initialConfig);
    const [hasChanges, setHasChanges] = useState(false);

    const [config, setConfig] = useState<any>(initialConfig || {
        contactPhone: '',
        contactEmail: '',
        contactAddress: '',
        shopName: '',
        logoUrl: '',
        measurementUnit: 'PCS',
        allergensText: '',
        shopType: 'RESTAURANT',
        certificates: [] // Future use
    });
    const [paymentConfig, setPaymentConfig] = useState<any>({});

    useEffect(() => {
        if (!originalConfig || !config) return;

        // Simple deep comparison
        const isDifferent = JSON.stringify(originalConfig) !== JSON.stringify(config);
        setHasChanges(isDifferent);
    }, [config, originalConfig]);

    useEffect(() => {
        if (!initialConfig) {
            async function load() {
                const [data, payConfig] = await Promise.all([
                    getSiteConfig(),
                    getPaymentConfig()
                ]);

                if (data) {
                    setConfig(data);
                }
                if (payConfig) {
                    setPaymentConfig(payConfig);
                }
                setLoading(false);
            }
            load();
        }
    }, [initialConfig]);

    const handleSave = async () => {
        setSaving(true);
        const [res, payRes] = await Promise.all([
            updateSiteConfig(config),
            updatePaymentConfig(paymentConfig)
        ]);

        if (res.success && payRes.success) {
            toast.success("Shop settings saved successfully");
            setHasChanges(false);
            setOriginalConfig(config);
        } else {
            const errorMsg = res.error || payRes.error || "Failed to save settings";
            toast.error(errorMsg);
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-orange-600" /> General Information
                    </h2>
                    <p className="text-sm text-slate-500 ml-8">Manage your contact details and store information.</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className={hasChanges
                        ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                        : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                    }
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-500" /> Contact Info
                        </CardTitle>
                        <CardDescription>Displayed in footer and contact page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                value={config.contactPhone}
                                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                                placeholder="+880 1..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                type="email"
                                value={config.contactEmail}
                                onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })}
                                placeholder="hello@example.com"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-500" /> Location & Branding
                        </CardTitle>
                        <CardDescription>Your store identity and physical address.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Shop Name</Label>
                            <Input
                                value={config.shopName}
                                onChange={(e) => setConfig({ ...config, shopName: e.target.value })}
                                placeholder="e.g. Crab & Khai"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Shop Logo</Label>
                            <MediaUpload
                                value={config.logoUrl || ''}
                                onChange={(url) => setConfig({ ...config, logoUrl: url })}
                                onRemove={() => setConfig({ ...config, logoUrl: '' })}
                            />
                            <p className="text-xs text-slate-500">
                                Recommended size: <strong>500x500px</strong>.
                                <br />
                                Supported formats: JPG, PNG, WEBP.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Textarea
                                value={config.contactAddress}
                                onChange={(e) => setConfig({ ...config, contactAddress: e.target.value })}
                                placeholder="Street Address, City, Country"
                                className="h-20 resize-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Settings & Units */}
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-slate-500" /> Settings
                        </CardTitle>
                        <CardDescription>Configure measurement units and system preferences.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Measurement Unit</Label>
                            <Select
                                value={config.measurementUnit || 'PCS'}
                                onValueChange={(val) => setConfig({ ...config, measurementUnit: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PCS">Pieces (Default)</SelectItem>
                                    <SelectItem value="WEIGHT">Weight (Kg/Gm)</SelectItem>
                                    <SelectItem value="VOLUME">Volume (Litre/Ml)</SelectItem>
                                </SelectContent>
                            </Select>

                            {config.measurementUnit === 'WEIGHT' && (
                                <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-100">
                                    <Label className="text-xs text-slate-500 mb-1 block">Weight per Unit (Grams)</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">1 Unit =</span>
                                        <Input
                                            type="number"
                                            className="w-24 h-8"
                                            value={config.weightUnitValue || 200}
                                            onChange={(e) => setConfig({ ...config, weightUnitValue: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="text-sm font-medium">gm</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Define how many grams correspond to a single unit of stock.</p>
                                </div>
                            )}

                            {config.measurementUnit === 'VOLUME' && (
                                <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-100">
                                    <Label className="text-xs text-slate-500 mb-1 block">Volume per Unit (Ml)</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">1 Unit =</span>
                                        <Input
                                            type="number"
                                            className="w-24 h-8"
                                            value={config.volumeUnitValue || 1000}
                                            onChange={(e) => setConfig({ ...config, volumeUnitValue: parseInt(e.target.value) || 0 })}
                                        />
                                        <span className="text-sm font-medium">ml</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Define how many milliliters correspond to a single unit.</p>
                                </div>
                            )}

                            <p className="text-xs text-slate-500 mt-1">
                                Controls how stock is displayed and calculated.
                            </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-gray-100">
                            <Label>Shop Type</Label>
                            <Select
                                value={config.shopType || 'RESTAURANT'}
                                onValueChange={(val) => setConfig({ ...config, shopType: val })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RESTAURANT">Restaurant (Kitchen Flow)</SelectItem>
                                    <SelectItem value="GROCERY">Grocery / Retail</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500">
                                <strong>Restaurant:</strong> Enables Kitchen Order Board.
                                <br />
                                <strong>Grocery:</strong> Standard order table view.
                            </p>
                        </div>
                    </CardContent>
                </Card>


            </div>
        </div>
    );
}
