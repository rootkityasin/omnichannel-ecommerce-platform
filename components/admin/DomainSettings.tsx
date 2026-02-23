"use client";

import { useState, useEffect } from "react";
import { getSiteConfig } from "@/app/actions/settings"; // Still use this for fetching initial config
import { updateDomainSettings } from "@/app/actions/domain";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Globe,
  Link as LinkIcon,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DomainSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Config state
  const [config, setConfig] = useState<{ slug: string; customDomain: string }>({
    slug: "",
    customDomain: "",
  });

  // State to track original values
  const [originalConfig, setOriginalConfig] = useState<{
    slug: string;
    customDomain: string;
  } | null>(null);

  const loadConfig = async () => {
    const data = await getSiteConfig();
    if (data) {
      const safeConfig = {
        slug: data.slug || "",
        customDomain: data.customDomain || "",
      };
      setConfig(safeConfig);
      setOriginalConfig(safeConfig);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate data fetching on mount
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);

    // Basic slug validation
    if (!config.slug || config.slug.length < 3) {
      toast.error("Shop name must be at least 3 characters");
      setSaving(false);
      return;
    }

    const result = await updateDomainSettings({
      slug: config.slug,
      customDomain: config.customDomain,
    });

    if (result.success) {
      toast.success("Domain settings saved successfully");
      setOriginalConfig({ ...config });

      // If slug changed, we might need to redirect or reload, but for now just update state
      if (config.slug !== originalConfig?.slug) {
        toast.message("Shop URL updated", {
          description: "Your shop is now accessible at the new address.",
        });
      }
    } else {
      toast.error(result.error || "Failed to save domain settings");
    }
    setSaving(false);
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-orange-500" />
      </div>
    );

  const rootDomain = "90slabs.com";
  const fullFreeUrl = `${config.slug}.${rootDomain}`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      {/* Free Domain Header */}
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Globe className="w-6 h-6 text-purple-600" />
          Your Free Domain
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
          >
            ACTIVE
          </Badge>
        </h2>
        <p className="text-sm text-slate-500 ml-8">
          Your shop is live at:{" "}
          <a
            href={`http://${fullFreeUrl}`}
            target="_blank"
            className="font-semibold text-purple-700 hover:underline"
          >
            {fullFreeUrl}
          </a>
        </p>
      </div>

      {/* Free Domain Section */}
      <Card className="border-purple-100 bg-purple-50/30 overflow-hidden mb-8">
        <CardHeader className="bg-purple-50/50 border-b border-purple-100 pb-4 sr-only">
          <CardTitle>Free Domain Settings</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="slug-input"
                className="text-slate-700 font-medium"
              >
                Shop Name (Subdomain)
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="slug-input"
                    value={config.slug}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    placeholder="myshop"
                    className="pr-32 font-medium"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none pointer-events-none">
                    .{rootDomain}
                  </div>
                </div>
                <Button
                  onClick={handleSave}
                  disabled={saving || config.slug === originalConfig?.slug}
                  className="bg-purple-600 hover:bg-purple-700 text-white min-w-[100px]"
                >
                  {saving && config.slug !== originalConfig?.slug ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Update"
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                <AlertTriangle className="w-3 h-3 inline mr-1 text-orange-500" />
                Changing this will break existing links to your store.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domain Section */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                <LinkIcon className="w-5 h-5 text-slate-600" /> Custom Domain
                <Badge
                  variant="outline"
                  className="border-slate-300 text-slate-600 bg-slate-100"
                >
                  PRO
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Connect your own domain (e.g. www.myshop.com)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Input Area */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Domain Name</Label>
              <div className="flex gap-2">
                <Input
                  value={config.customDomain}
                  onChange={(e) =>
                    setConfig({ ...config, customDomain: e.target.value })
                  }
                  placeholder="www.your-brand.com"
                  className="font-medium bg-white"
                />
                {config.customDomain &&
                  config.customDomain !== originalConfig?.customDomain && (
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-slate-900 text-white hover:bg-slate-800"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Connect"
                      )}
                    </Button>
                  )}
                {config.customDomain &&
                  config.customDomain === originalConfig?.customDomain && (
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(`http://${config.customDomain}`, "_blank")
                      }
                      title="Open Domain"
                    >
                      <Globe className="w-4 h-4" />
                    </Button>
                  )}
              </div>
            </div>
          </div>

          {/* Verification / Instructions */}
          {config.customDomain &&
          config.customDomain === originalConfig?.customDomain ? (
            <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-full">
                    <Globe className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">
                      {config.customDomain}
                    </div>
                    <span className="text-xs text-green-600 font-medium">
                      Connected
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={async () => {
                    if (
                      !confirm("Are you sure you want to remove this domain?")
                    )
                      return;
                    setSaving(true);
                    const res = await updateDomainSettings({
                      customDomain: null,
                    });
                    if (res.success) {
                      toast.success("Domain removed");
                      setConfig({ ...config, customDomain: "" });
                      setOriginalConfig({
                        ...originalConfig!,
                        customDomain: "",
                      });
                    } else {
                      toast.error(res.error || "Failed to remove domain");
                    }
                    setSaving(false);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
                  <span>
                    Point your domain&apos;s DNS A record to your server IP. DNS
                    propagation may take up to 24 hours.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                <Globe className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-slate-900">
                No custom domain connected
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Enter your domain above to get started with a professional web
                address.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
