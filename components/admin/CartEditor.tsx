"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, ArrowRight, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { getStorySections, updateStorySection } from "@/app/actions/story";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Field {
  id: string;
  label: string;
  placeholder?: string;
  required: boolean;
  enabled: boolean;
  isSystem: boolean;
  type: string;
}

interface CartConfig {
  emptyTitle: string;
  emptyMessage: string;
  browseMenu: string;
  title: string;
  subtotal: string;
  deliveryFee: string;
  total: string;
  deliveryDetails: string;
  confirmOrder: string;
  successTitle: string;
  successMessage: string;
  backHome: string;
  emptyImage: string;
  successImage: string;
  fields: Field[];
  [key: string]: unknown; // Allow extensibility
}

export function CartEditor() {
  const params = useParams();
  const domainParam = params?.domain;
  const domain = Array.isArray(domainParam) ? domainParam[0] : domainParam;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Default Config (fallback)
  const [config, setConfig] = useState<CartConfig>({
    emptyTitle: "Your Cart is Empty!",
    emptyMessage: "Looks like you haven't added any delicious crabs yet.",
    browseMenu: "Browse Menu",
    title: "Your Cart",
    subtotal: "Subtotal",
    deliveryFee: "Delivery Fee",
    total: "Total",
    deliveryDetails: "Delivery Details & Checkout",
    confirmOrder: "Confirm Order",
    successTitle: "Order Placed Successfully! 🎉",
    successMessage: "We'll call you shortly to confirm.",
    backHome: "Back to Home",
    emptyImage: "",
    successImage: "",
    // Form Fields Config
    fields: [
      {
        id: "name",
        label: "Name",
        placeholder: "Enter your full name",
        required: true,
        enabled: true,
        isSystem: true,
        type: "text",
      },
      {
        id: "phone",
        label: "Phone",
        placeholder: "017...",
        required: true,
        enabled: true,
        isSystem: true,
        type: "tel",
      },
      {
        id: "area",
        label: "Area",
        placeholder: "Select your area",
        required: true,
        enabled: true,
        isSystem: true,
        type: "select",
      },
      {
        id: "address",
        label: "Address",
        placeholder: "House, Road, Block, Sector...",
        required: true,
        enabled: true,
        isSystem: true,
        type: "textarea",
      },
    ],
  });

  const [previewMode, setPreviewMode] = useState<
    "empty" | "filled" | "success"
  >("filled");

  // Change detection
  const [_originalConfig, setOriginalConfig] = useState<CartConfig | null>(
    null,
  );
  const [hasChanges, setHasChanges] = useState(false);

  const previewSrc = useMemo(() => {
    const mode = previewMode || "filled";
    const base = domain ? `/${domain}` : "";
    return `${base}/cart?preview=${mode}`;
  }, [domain, previewMode]);

  const loadData = async () => {
    setLoading(true);
    const [sections] = await Promise.all([getStorySections()]);

    const cartSection = sections.find(
      (s: { type: string; content: unknown }) => s.type === "CART_TEXTS",
    );
    if (cartSection?.content) {
      const loadedConfig = cartSection.content as CartConfig;
      // Merging fields to ensure new fields in code are present
      const mergedFields = config.fields.map((f) => {
        const loaded = loadedConfig.fields?.find((lf: Field) => lf.id === f.id);
        return loaded ? { ...f, ...loaded } : f;
      });
      // Also include any custom fields that might have been saved
      if (loadedConfig.fields) {
        loadedConfig.fields.forEach((lf: Field) => {
          if (!mergedFields.find((f) => f.id === lf.id)) {
            mergedFields.push(lf);
          }
        });
      }

      const finalConfig = { ...config, ...loadedConfig, fields: mergedFields };
      setConfig(finalConfig);
      setOriginalConfig(finalConfig);
    } else {
      setOriginalConfig(config);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to detect changes
  useEffect(() => {
    if (_originalConfig) {
      const isDifferent =
        JSON.stringify(config) !== JSON.stringify(_originalConfig);
      setHasChanges(isDifferent);
    }
  }, [config, _originalConfig]);

  const handleSave = async () => {
    setSaving(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await updateStorySection(
      "CART_TEXTS",
      config as unknown as any,
    );
    if (res.success) {
      toast.success("Cart texts updated");
      setOriginalConfig(config);
      setHasChanges(false);
    } else {
      toast.error("Failed to update cart texts");
    }
    setSaving(false);
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-[1600px] mx-auto">
      {/* Editor Column */}
      <div className="space-y-6">
        <Card className="p-6 bg-white shadow-sm border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              Cart Configuration
            </h3>
            <Button
              disabled={saving}
              onClick={handleSave}
              className={
                hasChanges
                  ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                  : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
              }
            >
              {saving ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="form">Checkout Form</TabsTrigger>
              <TabsTrigger value="empty">Empty State</TabsTrigger>
              <TabsTrigger value="success">Success State</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  value={config.title}
                  onChange={(e) =>
                    setConfig({ ...config, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subtotal Label</Label>
                  <Input
                    value={config.subtotal}
                    onChange={(e) =>
                      setConfig({ ...config, subtotal: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Fee Label</Label>
                  <Input
                    value={config.deliveryFee}
                    onChange={(e) =>
                      setConfig({ ...config, deliveryFee: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Label</Label>
                  <Input
                    value={config.total}
                    onChange={(e) =>
                      setConfig({ ...config, total: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Delivery Details Title</Label>
                  <Input
                    value={config.deliveryDetails}
                    onChange={(e) =>
                      setConfig({ ...config, deliveryDetails: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Confirm Button Text</Label>
                <Input
                  value={config.confirmOrder}
                  onChange={(e) =>
                    setConfig({ ...config, confirmOrder: e.target.value })
                  }
                />
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setPreviewMode("filled")}
              >
                Preview Checkouts
              </Button>
            </TabsContent>

            <TabsContent value="form" className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-slate-900">
                    Delivery Details Fields
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newField: Field = {
                        id: `custom_${Date.now()}`,
                        label: "New Field",
                        placeholder: "Enter detail...",
                        required: false,
                        enabled: true,
                        isSystem: false,
                        type: "text",
                      };
                      setConfig({
                        ...config,
                        fields: [...(config.fields || []), newField],
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Field
                  </Button>
                </div>

                <div className="space-y-3">
                  {(config.fields || []).map((field: Field, index: number) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 group"
                    >
                      {/* <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" /> */}
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => {
                              const newFields = [...config.fields];
                              newFields[index].label = e.target.value;
                              setConfig({ ...config, fields: newFields });
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-500">
                            Placeholder
                          </Label>
                          <Input
                            value={field.placeholder || ""}
                            onChange={(e) => {
                              const newFields = [...config.fields];
                              newFields[index].placeholder = e.target.value;
                              setConfig({ ...config, fields: newFields });
                            }}
                            className="h-8 text-sm"
                            placeholder="Custom placeholder..."
                          />
                        </div>
                        {!field.isSystem && (
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">
                              Type
                            </Label>
                            <Select
                              value={field.type}
                              onValueChange={(val) => {
                                const newFields = [...config.fields];
                                newFields[index].type = val;
                                setConfig({ ...config, fields: newFields });
                              }}
                            >
                              <SelectTrigger className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text Input</SelectItem>
                                <SelectItem value="textarea">
                                  Text Area
                                </SelectItem>
                                <SelectItem value="tel">Phone</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 border-l pl-4 border-gray-200">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(c) => {
                              const newFields = [...config.fields];
                              newFields[index].required = c;
                              setConfig({ ...config, fields: newFields });
                            }}
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.enabled}
                            onCheckedChange={(c) => {
                              const newFields = [...config.fields];
                              newFields[index].enabled = c;
                              setConfig({ ...config, fields: newFields });
                            }}
                          />
                          <Label className="text-xs">Show</Label>
                        </div>

                        {!field.isSystem && (
                          <button
                            onClick={() => {
                              const newFields = config.fields.filter(
                                (_: Field, i: number) => i !== index,
                              );
                              setConfig({ ...config, fields: newFields });
                            }}
                            className="p-1 hover:bg-red-100 text-red-500 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="empty" className="space-y-4">
              <div className="space-y-2">
                <Label>Empty Title</Label>
                <Input
                  value={config.emptyTitle}
                  onChange={(e) =>
                    setConfig({ ...config, emptyTitle: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Empty Message</Label>
                <Textarea
                  value={config.emptyMessage}
                  onChange={(e) =>
                    setConfig({ ...config, emptyMessage: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Browse Button Text</Label>
                <Input
                  value={config.browseMenu}
                  onChange={(e) =>
                    setConfig({ ...config, browseMenu: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Empty State Image (GIF/PNG)</Label>
                <ImageUpload
                  value={config.emptyImage}
                  onChange={(url) =>
                    setConfig({ ...config, emptyImage: url as string })
                  }
                  onRemove={() => setConfig({ ...config, emptyImage: "" })}
                />
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setPreviewMode("empty")}
              >
                Preview Empty State
              </Button>
            </TabsContent>

            <TabsContent value="success" className="space-y-4">
              <div className="space-y-2">
                <Label>Success Title</Label>
                <Input
                  value={config.successTitle}
                  onChange={(e) =>
                    setConfig({ ...config, successTitle: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Success Message (Under Title)</Label>
                <Textarea
                  value={config.successMessage}
                  onChange={(e) =>
                    setConfig({ ...config, successMessage: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Home Button Text</Label>
                <Input
                  value={config.backHome}
                  onChange={(e) =>
                    setConfig({ ...config, backHome: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Success State Image (GIF/PNG)</Label>
                <ImageUpload
                  value={config.successImage}
                  onChange={(url) =>
                    setConfig({ ...config, successImage: url as string })
                  }
                  onRemove={() => setConfig({ ...config, successImage: "" })}
                />
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setPreviewMode("success")}
              >
                Preview Success State
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Preview Column */}
      <div className="hidden lg:block sticky top-6">
        <div className="bg-slate-900 rounded-t-xl p-3 flex items-center justify-between border-b border-slate-800">
          <div className="text-white text-sm font-medium flex items-center gap-2">
            <ShoppingBagIcon className="w-4 h-4 text-orange-500" /> Cart Preview
          </div>
          <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => setPreviewMode("empty")}
              className={`text-xs px-2 py-1 rounded ${previewMode === "empty" ? "bg-slate-700 text-white" : "text-slate-400"}`}
            >
              Empty
            </button>
            <button
              onClick={() => setPreviewMode("filled")}
              className={`text-xs px-2 py-1 rounded ${previewMode === "filled" ? "bg-slate-700 text-white" : "text-slate-400"}`}
            >
              Items
            </button>
            <button
              onClick={() => setPreviewMode("success")}
              className={`text-xs px-2 py-1 rounded ${previewMode === "success" ? "bg-slate-700 text-white" : "text-slate-400"}`}
            >
              Success
            </button>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 h-[calc(100vh-200px)] overflow-y-auto rounded-b-xl relative font-body text-left">
          {/* Mock Browser UI */}
          <div className="absolute inset-0 pointer-events-none border-[6px] border-slate-900/5 rounded-b-xl z-50"></div>

          <div className="p-0 min-h-full">
            {previewMode === "empty" && (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] w-full p-4 text-center animate-in fade-in zoom-in duration-700 relative bg-white overflow-hidden">
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2 md:mb-3 tracking-tight font-heading">
                  {config.emptyTitle}
                </h2>
                <p className="text-base md:text-lg text-gray-500 mb-2 md:mb-10 max-w-sm mx-auto leading-relaxed font-medium">
                  {config.emptyMessage}
                </p>

                <div className="w-full max-w-[450px] h-auto max-h-[40vh] aspect-square mb-2 flex items-center justify-center relative">
                  <img
                    src={config.emptyImage || "/empty_cart_animation.gif"}
                    alt="Empty Cart"
                    className="w-full h-full object-contain"
                  />
                </div>

                <button className="relative group px-10 md:px-12 py-4 md:py-5 mt-4 md:mt-8 bg-gradient-to-r from-crab-red to-orange-600 text-white text-lg md:text-xl font-bold uppercase tracking-wider rounded-2xl shadow-lg shadow-crab-red/30 hover:shadow-crab-red/40 active:scale-95 transition-all overflow-hidden flex items-center justify-center gap-2">
                  <span className="relative z-10 flex items-center gap-2">
                    {config.browseMenu}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              </div>
            )}

            {previewMode === "filled" && (
              <div className="p-4 pb-32 max-w-lg mx-auto">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h1 className="text-xl font-bold font-heading text-slate-900">
                      {config.title}
                    </h1>
                    <span className="text-xs font-medium text-slate-400">
                      Preview
                    </span>
                  </div>
                  <iframe
                    title="Cart preview"
                    src={previewSrc}
                    className="w-full h-[780px] pointer-events-none"
                  />
                </div>
              </div>
            )}

            {previewMode === "success" && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center text-slate-800">
                <div className="w-64 h-64 mb-6 flex items-center justify-center overflow-hidden">
                  <img
                    src={config.successImage || "/congrates_animation.gif"}
                    alt="Order Confirmed"
                    className="w-full h-full object-contain scale-105"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading">
                  {config.successTitle}
                </h2>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                  {config.successMessage}
                </p>
                <button className="px-8 py-3 bg-crab-red text-white font-bold rounded-xl shadow-lg hover:bg-crab-red/90 transition-all">
                  {config.backHome}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShoppingBagIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
