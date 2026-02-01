'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateSiteConfig } from '@/app/actions/settings';
import { toast } from 'sonner';
import { Loader2, Save, Search, Lock, Globe, Twitter, Share2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/admin/ImageUpload';

interface SeoProps {
    initialConfig: any;
}

export function SeoSettings({ initialConfig }: SeoProps) {
    const [config, setConfig] = useState(initialConfig);
    const [originalConfig, setOriginalConfig] = useState(initialConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Plan Gating Logic
    const plan = initialConfig.plan || 'FREE';
    const isFree = plan === 'FREE';
    const isBasic = plan === 'BASIC';
    const isStandardOrHigher = ['STANDARD', 'PLATINUM', 'ENTERPRISE'].includes(plan);

    const canEditBasic = !isFree; // Basic+ can edit Title/Desc
    const canEditAdvanced = isStandardOrHigher; // Standard+ can edit everything

    useEffect(() => {
        const isDifferent = JSON.stringify(originalConfig) !== JSON.stringify(config);
        setHasChanges(isDifferent);
    }, [config, originalConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        const result = await updateSiteConfig(config);
        setIsSaving(false);

        if (result.success) {
            toast.success("SEO settings saved successfully!");
            setOriginalConfig(config);
            setHasChanges(false);
        } else {
            toast.error(result.error || "Failed to save settings.");
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Search className="w-6 h-6 text-blue-600" /> SEO & Social Sharing
                    </h2>
                    <p className="text-sm text-slate-500 ml-8">Optimize how your store appears on Google, Facebook, and Twitter.</p>
                </div>
                <div className="flex items-center gap-3">
                    {isFree && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                            <Lock className="w-3 h-3" /> Upgrade to Edit
                        </div>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges || isFree}
                        className={hasChanges
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                            : "bg-slate-900 hover:bg-blue-600 text-white shadow-sm"
                        }
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Plan Alert */}
            {isFree && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-amber-800">SEO is disabled on Free Plan</h4>
                        <p className="text-sm text-amber-700 mt-1">Upgrade to Basic to customize Meta Tags, or Standard for full social sharing control.</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto border-amber-300 text-amber-800 hover:bg-amber-100">Upgrade</Button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Settings */}
                <div className="lg:col-span-2 space-y-6">

                    <Tabs defaultValue="basic" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1">
                            <TabsTrigger value="basic">Basic SEO</TabsTrigger>
                            <TabsTrigger value="social" disabled={!canEditAdvanced}>
                                <div className="flex items-center gap-2"> Social {(!canEditAdvanced) && <Lock className="w-3 h-3 opacity-50" />}</div>
                            </TabsTrigger>
                            <TabsTrigger value="advanced" disabled={!canEditAdvanced}>
                                <div className="flex items-center gap-2"> Advanced {(!canEditAdvanced) && <Lock className="w-3 h-3 opacity-50" />}</div>
                            </TabsTrigger>
                        </TabsList>

                        {/* Basic SEO */}
                        <TabsContent value="basic" className="space-y-4 pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Search Engine Listing</CardTitle>
                                    <CardDescription>How your store appears in search results.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Meta Title</label>
                                        <Input
                                            value={config.seoTitle || ''}
                                            onChange={e => setConfig({ ...config, seoTitle: e.target.value })}
                                            placeholder={config.shopName ? `${config.shopName} - Premium Seafood` : "My Shop Title"}
                                            disabled={!canEditBasic}
                                        />
                                        <p className="text-xs text-slate-400 text-right">Recommended: 50-60 chars</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Meta Description</label>
                                        <Textarea
                                            value={config.seoDescription || ''}
                                            onChange={e => setConfig({ ...config, seoDescription: e.target.value })}
                                            placeholder="Best fresh seafood delivered to your door in Dhaka..."
                                            disabled={!canEditBasic}
                                            className="h-24 resize-none"
                                        />
                                        <p className="text-xs text-slate-400 text-right">Recommended: 150-160 chars</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Keywords</label>
                                        <Input
                                            value={config.seoKeywords || ''}
                                            onChange={e => setConfig({ ...config, seoKeywords: e.target.value })}
                                            placeholder="seafood, crab, delivery, shrimp, lobster"
                                            disabled={!canEditBasic}
                                        />
                                        <p className="text-xs text-slate-400">Comma separated keywords.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Social Media */}
                        <TabsContent value="social" className="space-y-4 pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Share2 className="w-5 h-5 text-indigo-600" /> OpenGraph (Facebook/LinkedIn)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">OG Title</label>
                                        <Input
                                            value={config.ogTitle || ''}
                                            onChange={e => setConfig({ ...config, ogTitle: e.target.value })}
                                            placeholder="Same as Meta Title"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">OG Description</label>
                                        <Textarea
                                            value={config.ogDescription || ''}
                                            onChange={e => setConfig({ ...config, ogDescription: e.target.value })}
                                            placeholder="Same as Meta Description"
                                            className="h-20"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Social Image</label>
                                        <div className="w-full">
                                            <ImageUpload
                                                value={config.ogImage ? [config.ogImage] : []}
                                                onChange={(arr) => {
                                                    const val = Array.isArray(arr) ? arr[0] : arr;
                                                    setConfig({ ...config, ogImage: val });
                                                }}
                                                onRemove={() => setConfig({ ...config, ogImage: '' })}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">Recommended size: 1200x630 pixels.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Twitter className="w-5 h-5 text-sky-500" /> Twitter Card</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Card Type</label>
                                        <Select
                                            value={config.twitterCard || 'summary_large_image'}
                                            onValueChange={val => setConfig({ ...config, twitterCard: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="summary">Summary</SelectItem>
                                                <SelectItem value="summary_large_image">Summary with Large Image</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Advanced */}
                        <TabsContent value="advanced" className="space-y-4 pt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-600" /> Advanced Configuration</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Canonical URL</label>
                                        <Input
                                            value={config.canonicalUrl || ''}
                                            onChange={e => setConfig({ ...config, canonicalUrl: e.target.value })}
                                            placeholder="https://myshop.com"
                                        />
                                        <p className="text-xs text-slate-400">Leave empty to use automatic URL.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Robots Meta</label>
                                        <Input
                                            value={config.robots || 'index, follow'}
                                            onChange={e => setConfig({ ...config, robots: e.target.value })}
                                            placeholder="index, follow"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">JSON-LD Schema Type</label>
                                        <Select
                                            value={config.jsonLdType || 'Restaurant'}
                                            onValueChange={val => setConfig({ ...config, jsonLdType: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Restaurant">Restaurant</SelectItem>
                                                <SelectItem value="Store">Store</SelectItem>
                                                <SelectItem value="Organization">Organization</SelectItem>
                                                <SelectItem value="LocalBusiness">Local Business</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Social Profiles</CardTitle>
                                    <CardDescription>Link your business profiles for structured data.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-3">
                                        <Input value={config.socialFacebook || ''} onChange={e => setConfig({ ...config, socialFacebook: e.target.value })} placeholder="Facebook URL" />
                                        <Input value={config.socialInstagram || ''} onChange={e => setConfig({ ...config, socialInstagram: e.target.value })} placeholder="Instagram URL" />
                                        <Input value={config.socialTwitter || ''} onChange={e => setConfig({ ...config, socialTwitter: e.target.value })} placeholder="Twitter URL" />
                                        <Input value={config.socialYoutube || ''} onChange={e => setConfig({ ...config, socialYoutube: e.target.value })} placeholder="YouTube URL" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column: Preview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="sticky top-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Live Preview</h3>

                        {/* Google Result Preview */}
                        <div className="bg-white p-4 rounded-lg border shadow-sm space-y-1 mb-4">
                            <div className="text-xs text-slate-500 mb-1">Google Search Result</div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] overflow-hidden">
                                    {config.logoUrl ? <img src={config.logoUrl} alt="" className="w-full h-full object-cover" /> : <Globe className="w-3 h-3 text-slate-400" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-800">{config.shopName || "My Shop"}</span>
                                    <span className="text-[10px] text-slate-400">{config.customDomain ? `https://${config.customDomain}` : `https://${config.tenant?.slug || 'myshop'}.crabkhai.com`}</span>
                                </div>
                            </div>
                            <div className="text-lg text-[#1a0dab] hover:underline cursor-pointer font-medium leading-tight truncate">
                                {config.seoTitle || config.shopName || "My Shop Name"}
                            </div>
                            <div className="text-sm text-[#4d5156] line-clamp-2">
                                {config.seoDescription || "Welcome to our shop..."}
                            </div>
                        </div>

                        {/* Social Card Preview */}
                        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                            <div className="p-3 border-b text-xs text-slate-500 font-medium bg-slate-50">Social Share Preview</div>
                            <div className="aspect-[1.91/1] bg-slate-100 relative items-center justify-center flex overflow-hidden">
                                {config.ogImage ? (
                                    <img src={config.ogImage} alt="OG" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-slate-300 flex flex-col items-center">
                                        <Share2 className="w-8 h-8 mb-2" />
                                        <span className="text-xs">No Image Set</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-3 bg-slate-50">
                                <div className="text-xs text-slate-500 uppercase mb-1">{config.shopName ? config.shopName.toUpperCase() : "DOMAIN.COM"}</div>
                                <div className="font-bold text-slate-800 leading-tight mb-1 line-clamp-1">
                                    {config.ogTitle || config.seoTitle || "Page Title"}
                                </div>
                                <div className="text-xs text-slate-600 line-clamp-2">
                                    {config.ogDescription || config.seoDescription || "Page description goes here..."}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
