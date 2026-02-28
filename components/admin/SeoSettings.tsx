"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateSiteConfig } from "@/app/actions/settings";
import { isAdvancedSeoPlan, normalizePlan } from "@/lib/planUtils";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Search,
  Lock,
  Globe,
  Share2,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/admin/ImageUpload";

import { SiteConfig } from "@/types/common";

interface SeoProps {
  readonly initialConfig: SiteConfig;
}

export function SeoSettings({ initialConfig }: SeoProps) {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);
  const [originalConfig, setOriginalConfig] =
    useState<SiteConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "social" | "advanced">(
    "basic",
  );

  // Plan Gating Logic
  // Plan Gating Logic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plan = normalizePlan((initialConfig as any).plan || "FREE"); // Plan might be on Tenant, not SiteConfig directly, but passed in initialConfig
  const isStandardOrHigher = isAdvancedSeoPlan(plan);

  const canEditBasic = true; // Everyone can now edit Basic SEO
  const canEditAdvanced = isStandardOrHigher; // Only Premium can edit Advanced

  const previewBaseUrl = config.customDomain
    ? `https://${config.customDomain}`
    : `https://${config.tenant?.slug || "myshop"}.crabkhai.com`;

  // Derived state: check for changes
  const hasChanges = useMemo(
    () => JSON.stringify(originalConfig) !== JSON.stringify(config),
    [config, originalConfig],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        toast.error("Request timed out. Please try again.");
        setIsSaving(false);
      }, 15000);
      const result = await updateSiteConfig(config);
      clearTimeout(timeoutId);
      if (timedOut) return;

      if (result.success) {
        toast.success("SEO settings saved successfully!");
        setOriginalConfig(config);
      } else {
        toast.error(result.error || "Failed to save settings.");
      }
    } catch (error) {
      toast.error("Failed to save settings.");
      console.error("SEO save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" /> SEO Manager
          </h2>
          <p className="text-sm text-slate-500 ml-8">
            Configure your store&apos;s search engine and social media
            appearance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className={
              hasChanges
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                : "bg-slate-900 hover:bg-blue-600 text-white shadow-sm"
            }
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs
            defaultValue="basic"
            className="w-full"
            onValueChange={(value) =>
              setActiveTab(value as "basic" | "social" | "advanced")
            }
          >
            <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 mb-6">
              <TabsTrigger value="basic">Basic SEO</TabsTrigger>
              <TabsTrigger value="social" disabled={!canEditAdvanced}>
                <div className="flex items-center gap-2">
                  {" "}
                  Social{" "}
                  {!canEditAdvanced && <Lock className="w-3 h-3 opacity-50" />}
                </div>
              </TabsTrigger>
              <TabsTrigger value="advanced" disabled={!canEditAdvanced}>
                <div className="flex items-center gap-2">
                  {" "}
                  Advanced{" "}
                  {!canEditAdvanced && <Lock className="w-3 h-3 opacity-50" />}
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Basic SEO */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Search Engine Listing</CardTitle>
                  <CardDescription>
                    How your store appears in search results.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="shop-name"
                        className="text-sm font-medium"
                      >
                        Shop Name
                      </label>
                      <Input
                        id="shop-name"
                        value={config.shopName || ""}
                        onChange={(e) =>
                          setConfig({ ...config, shopName: e.target.value })
                        }
                        placeholder="My Awesome Shop"
                        disabled={!canEditBasic}
                      />
                      <p className="text-xs text-slate-400">
                        Used for default meta titles and branding.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="meta-title"
                        className="text-sm font-medium"
                      >
                        Meta Title
                      </label>
                      <Input
                        id="meta-title"
                        value={config.seoTitle || ""}
                        onChange={(e) =>
                          setConfig({ ...config, seoTitle: e.target.value })
                        }
                        placeholder={
                          config.shopName
                            ? `${config.shopName} - Premium Seafood`
                            : "My Shop Title"
                        }
                        disabled={!canEditBasic}
                      />
                      <p className="text-xs text-slate-400 text-right">
                        Recommended: 50-60 chars
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="meta-desc"
                        className="text-sm font-medium"
                      >
                        Meta Description
                      </label>
                      <Textarea
                        id="meta-desc"
                        value={config.seoDescription || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            seoDescription: e.target.value,
                          })
                        }
                        placeholder="Best fresh seafood delivered to your door in Dhaka..."
                        disabled={!canEditBasic}
                        className="h-24 resize-none"
                      />
                      <p className="text-xs text-slate-400 text-right">
                        Recommended: 150-160 chars
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="keywords" className="text-sm font-medium">
                        Keywords
                      </label>
                      <Input
                        id="keywords"
                        value={config.seoKeywords || ""}
                        onChange={(e) =>
                          setConfig({ ...config, seoKeywords: e.target.value })
                        }
                        placeholder="seafood, crab, delivery, shrimp, lobster"
                        disabled={!canEditBasic}
                      />
                      <p className="text-xs text-slate-400">
                        Comma separated keywords.
                      </p>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <label className="text-sm font-medium">
                        Social Share Image
                      </label>
                      <div className="w-full">
                        <ImageUpload
                          value={config.ogImage ? [config.ogImage] : []}
                          onChange={(arr: string | string[]) => {
                            const val = Array.isArray(arr) ? arr[0] : arr;
                            setConfig({ ...config, ogImage: val });
                          }}
                          onRemove={() => setConfig({ ...config, ogImage: "" })}
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        Image shown when sharing on Facebook/WhatsApp.
                        Recommended: 1200x630.
                      </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-sm font-medium">
                            Sitelinks
                          </label>
                          <p className="text-xs text-slate-400">
                            Add up to 4 links to appear under your search
                            result.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const current = Array.isArray(config.sitelinks)
                              ? config.sitelinks
                              : [];
                            if (current.length < 4) {
                              setConfig({
                                ...config,
                                sitelinks: [
                                  ...current,
                                  { title: "", description: "" },
                                ],
                              });
                            }
                          }}
                          disabled={
                            Array.isArray(config.sitelinks) &&
                            config.sitelinks.length >= 4
                          }
                          type="button"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Link
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-3">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(config.sitelinks || []).map(
                            (link: any, i: number) => (
                              <div
                                key={`edit-${i}-${link.title || "new"}`}
                                className="flex gap-2 items-start p-3 bg-slate-50 rounded border"
                              >
                                <div className="grid gap-2 flex-1">
                                  <Input
                                    placeholder="Link Title (e.g. All Products)"
                                    value={link.title || ""}
                                    onChange={(e) => {
                                      const newLinks = [
                                        ...(config.sitelinks || []),
                                      ];
                                      newLinks[i] = {
                                        ...newLinks[i],
                                        title: e.target.value,
                                      };
                                      setConfig({
                                        ...config,
                                        sitelinks: newLinks,
                                      });
                                    }}
                                    className="h-8 text-sm"
                                  />
                                  <Input
                                    placeholder="Description (optional)"
                                    value={link.description || ""}
                                    onChange={(e) => {
                                      const newLinks = [
                                        ...(config.sitelinks || []),
                                      ];
                                      newLinks[i] = {
                                        ...newLinks[i],
                                        description: e.target.value,
                                      };
                                      setConfig({
                                        ...config,
                                        sitelinks: newLinks,
                                      });
                                    }}
                                    className="h-8 text-xs text-slate-500"
                                  />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const newLinks = (
                                      config.sitelinks || []
                                    ).filter(
                                      (_: any, idx: number) => idx !== i,
                                    );
                                    setConfig({
                                      ...config,
                                      sitelinks: newLinks,
                                    });
                                  }}
                                  className="h-8 w-8 text-slate-400 hover:text-red-500"
                                  type="button"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ),
                          )}
                          {(!config.sitelinks ||
                            config.sitelinks.length === 0) && (
                            <div className="text-xs text-center p-4 text-slate-400 italic bg-slate-50 rounded border border-dashed">
                              No sitelinks added. Your result will look
                              standard.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Social Media */}
            <TabsContent value="social" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-indigo-600" /> OpenGraph
                    (Facebook/LinkedIn)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Social Card Preview */}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="og-title" className="text-sm font-medium">
                        OG Title
                      </label>
                      <Input
                        id="og-title"
                        value={config.ogTitle || ""}
                        onChange={(e) =>
                          setConfig({ ...config, ogTitle: e.target.value })
                        }
                        placeholder="Same as Meta Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="og-desc" className="text-sm font-medium">
                        OG Description
                      </label>
                      <Textarea
                        id="og-desc"
                        value={config.ogDescription || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            ogDescription: e.target.value,
                          })
                        }
                        placeholder="Same as Meta Description"
                        className="h-20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-sky-500" /> Twitter Card
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Card Type</label>
                    <Select
                      value={config.twitterCard || "summary_large_image"}
                      onValueChange={(val) =>
                        setConfig({ ...config, twitterCard: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="summary_large_image">
                          Summary with Large Image
                        </SelectItem>
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
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-emerald-600" /> Advanced
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="custom-domain"
                      className="text-sm font-medium"
                    >
                      Custom Domain
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-domain"
                        value={config.customDomain || ""}
                        onChange={(e) =>
                          setConfig({ ...config, customDomain: e.target.value })
                        }
                        placeholder="myshop.com"
                      />
                      {config.customDomain && (
                        <Badge
                          variant="outline"
                          className="h-10 px-3 bg-green-50 text-green-700 border-green-200"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Enter your custom domain (e.g. example.com). Ensure DNS is
                      configured.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="canonical-url"
                      className="text-sm font-medium"
                    >
                      Canonical URL
                    </label>
                    <Input
                      id="canonical-url"
                      value={config.canonicalUrl || ""}
                      onChange={(e) =>
                        setConfig({ ...config, canonicalUrl: e.target.value })
                      }
                      placeholder="https://myshop.com"
                    />
                    <p className="text-xs text-slate-400">
                      Leave empty to use automatic URL.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="robots-meta"
                      className="text-sm font-medium"
                    >
                      Robots Meta
                    </label>
                    <Input
                      id="robots-meta"
                      value={config.robots || "index, follow"}
                      onChange={(e) =>
                        setConfig({ ...config, robots: e.target.value })
                      }
                      placeholder="index, follow"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      JSON-LD Schema Type
                    </label>
                    <Select
                      value={config.jsonLdType || "Restaurant"}
                      onValueChange={(val) =>
                        setConfig({ ...config, jsonLdType: val })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Restaurant">Restaurant</SelectItem>
                        <SelectItem value="Store">Store</SelectItem>
                        <SelectItem value="Organization">
                          Organization
                        </SelectItem>
                        <SelectItem value="LocalBusiness">
                          Local Business
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Profiles</CardTitle>
                  <CardDescription>
                    Link your business profiles for structured data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      value={config.socialFacebook || ""}
                      onChange={(e) =>
                        setConfig({ ...config, socialFacebook: e.target.value })
                      }
                      placeholder="Facebook URL"
                      aria-label="Facebook URL"
                    />
                    <Input
                      value={config.socialInstagram || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          socialInstagram: e.target.value,
                        })
                      }
                      placeholder="Instagram URL"
                      aria-label="Instagram URL"
                    />
                    <Input
                      value={config.socialTwitter || ""}
                      onChange={(e) =>
                        setConfig({ ...config, socialTwitter: e.target.value })
                      }
                      placeholder="Twitter URL"
                      aria-label="Twitter URL"
                    />
                    <Input
                      value={config.socialYoutube || ""}
                      onChange={(e) =>
                        setConfig({ ...config, socialYoutube: e.target.value })
                      }
                      placeholder="YouTube URL"
                      aria-label="YouTube URL"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Meta Pixel (CAPI)</CardTitle>
                  <CardDescription>
                    Server-side tracking configuration for Facebook Ads.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="pixel-id" className="text-sm font-medium">
                      Pixel ID
                    </label>
                    <Input
                      id="pixel-id"
                      value={config.metaPixelId || ""}
                      onChange={(e) =>
                        setConfig({ ...config, metaPixelId: e.target.value })
                      }
                      placeholder="1234567890"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="access-token"
                      className="text-sm font-medium"
                    >
                      Access Token (CAPI)
                    </label>
                    <Input
                      id="access-token"
                      value={config.metaAccessToken || ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          metaAccessToken: e.target.value,
                        })
                      }
                      type="password"
                      placeholder="EAA..."
                    />
                    <p className="text-xs text-slate-400">
                      Required for server-side event tracking (Purchase,
                      ViewContent).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: Previews (Sticky) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-6">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
              Live Preview
            </h3>

            {activeTab === "basic" && (
              <div className="bg-white p-4 rounded-lg border shadow-sm space-y-1 mb-4 select-none font-sans">
                <div className="text-xs text-slate-500 mb-2 font-medium flex justify-between items-center">
                  <span>Google Search Result</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                    Preview with Sitelinks
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-1">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] overflow-hidden shrink-0">
                    {config.logoUrl ? (
                      <img
                        src={config.logoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Globe className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm text-[#202124] font-medium truncate">
                      {config.shopName || "My Shop"}
                    </span>
                    <span className="text-xs text-[#4d5156] truncate">
                      {previewBaseUrl}
                    </span>
                  </div>
                </div>

                <div className="group cursor-pointer">
                  <div className="text-xl text-[#1a0dab] group-hover:underline font-normal leading-tight truncate mb-1">
                    {config.seoTitle || config.shopName || "My Shop Name"}
                  </div>
                </div>

                <div className="text-sm text-[#4d5156] leading-normal line-clamp-2 mb-3">
                  {config.seoDescription ||
                    "Welcome to our shop. We offer the best fresh seafood delivered directly to your doorstep. Order now for fast delivery."}
                </div>

                {Array.isArray(config.sitelinks) &&
                  config.sitelinks.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {config.sitelinks.map((link: any, i: number) => (
                        <div key={`${i}-${link.title}`}>
                          <div className="text-[#1a0dab] text-sm hover:underline cursor-pointer font-medium truncate">
                            {link.title || "Link Title"}
                          </div>
                          {link.description && (
                            <div className="text-xs text-[#4d5156] truncate hidden sm:block">
                              {link.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}

            {activeTab === "social" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div className="p-3 border-b text-xs text-slate-500 font-medium bg-slate-50">
                    Social Share Preview
                  </div>
                  <div className="aspect-[1.91/1] bg-slate-100 relative items-center justify-center flex overflow-hidden">
                    {config.ogImage ? (
                      <img
                        src={config.ogImage}
                        alt="OG"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center">
                        <Share2 className="w-8 h-8 mb-2" />
                        <span className="text-xs">No Image Set</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50">
                    <div className="text-xs text-slate-500 uppercase mb-1">
                      {previewBaseUrl.replace("https://", "").toUpperCase()}
                    </div>
                    <div className="font-bold text-slate-800 leading-tight mb-1 line-clamp-1">
                      {config.ogTitle || config.seoTitle || "Page Title"}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2">
                      {config.ogDescription ||
                        config.seoDescription ||
                        "Page description goes here..."}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div className="p-3 border-b text-xs text-slate-500 font-medium bg-slate-50">
                    Twitter Card Preview (
                    {config.twitterCard || "summary_large_image"})
                  </div>
                  {config.twitterCard === "summary" ? (
                    <div className="p-4 space-y-2">
                      <div className="text-xs text-slate-500 uppercase">
                        {previewBaseUrl.replace("https://", "").toUpperCase()}
                      </div>
                      <div className="font-bold text-slate-800 line-clamp-2">
                        {config.ogTitle || config.seoTitle || "Page Title"}
                      </div>
                      <div className="text-xs text-slate-600 line-clamp-3">
                        {config.ogDescription ||
                          config.seoDescription ||
                          "Page description goes here..."}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="aspect-[2/1] bg-slate-100 relative items-center justify-center flex overflow-hidden">
                        {config.ogImage ? (
                          <img
                            src={config.ogImage}
                            alt="Twitter"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-300 flex flex-col items-center">
                            <Share2 className="w-8 h-8 mb-2" />
                            <span className="text-xs">No Image Set</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50">
                        <div className="text-xs text-slate-500 uppercase mb-1">
                          {previewBaseUrl.replace("https://", "").toUpperCase()}
                        </div>
                        <div className="font-bold text-slate-800 leading-tight mb-1 line-clamp-1">
                          {config.ogTitle || config.seoTitle || "Page Title"}
                        </div>
                        <div className="text-xs text-slate-600 line-clamp-2">
                          {config.ogDescription ||
                            config.seoDescription ||
                            "Page description goes here..."}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg border shadow-sm p-4 space-y-3">
                  <div className="text-xs text-slate-500 font-medium">
                    Advanced SEO Preview
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold">Canonical:</span>{" "}
                    {config.canonicalUrl || previewBaseUrl}
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold">Robots:</span>{" "}
                    {config.robots || "index, follow"}
                  </div>
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold">JSON-LD:</span>{" "}
                    {config.jsonLdType || "Restaurant"}
                  </div>
                </div>

                <div className="bg-white rounded-lg border shadow-sm p-4 space-y-2">
                  <div className="text-xs text-slate-500 font-medium">
                    Social Profiles (Structured Data)
                  </div>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>Facebook: {config.socialFacebook || "Not set"}</li>
                    <li>Instagram: {config.socialInstagram || "Not set"}</li>
                    <li>Twitter: {config.socialTwitter || "Not set"}</li>
                    <li>YouTube: {config.socialYoutube || "Not set"}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
