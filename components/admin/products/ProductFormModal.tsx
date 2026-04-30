"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";
import { generateUniqueSku } from "@/app/actions/product";
import ComboBuilder from "./ComboBuilder";
import { toast } from "sonner";
import ModalPortal from "@/components/ui/ModalPortal";

export type ProductFormState = {
  name: string;
  price: number | string;
  sku: string;
  image: string;
  images: string[];
  categoryId: string;
  description: string;
  nutrition: string;
  cookingInstructions: string;
  pointsReward: number | string;
  weight: number | string;
  servingSize: number | string;
  pieces: number | string;
  stage: string;
  type: "SINGLE" | "COMBO";
  descriptionSwap: boolean;
  comboItems: { childId?: string; quantity: number }[];
  sections: string[];
};

type CategoryItem = { id: string; name: string };
type SectionItem = { id: string; title: string };
type ProductOption = { id: string; name: string; type?: string };
type ProductPageConfig = {
  measurementUnit?: string;
  shopType?: string;
  weightUnitValue?: number;
  volumeUnitValue?: number;
};

export default function ProductFormModal({
  isOpen,
  editingId,
  newProduct,
  setNewProduct,
  categories,
  sectionsList,
  products,
  config,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  editingId: string | null;
  newProduct: ProductFormState;
  setNewProduct: React.Dispatch<React.SetStateAction<ProductFormState>>;
  categories: CategoryItem[];
  sectionsList: SectionItem[];
  products: ProductOption[];
  config: ProductPageConfig;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const unitLabel = useMemo(() => {
    return config.measurementUnit === "WEIGHT"
      ? "g"
      : config.measurementUnit === "VOLUME"
        ? "ml"
        : "PCS";
  }, [config.measurementUnit]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed -inset-px z-[60000] flex items-start justify-center overflow-hidden bg-black/80 backdrop-blur-lg backdrop-brightness-50 p-4 sm:items-center">
        <Card className="my-auto w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
          <div className="p-6 overflow-y-auto popup-scrollbar">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Product" : "New Product"}
              </h2>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25 transition-all duration-200 hover:bg-red-600 hover:scale-110 hover:shadow-red-500/40 active:scale-95"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                Product Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  value={newProduct.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewProduct((prev) => ({ ...prev, name: val }));
                  }}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newProduct.type || "SINGLE"}
                  onValueChange={(val) =>
                    setNewProduct({
                      ...newProduct,
                      type: val as "SINGLE" | "COMBO",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Single Product</SelectItem>
                    <SelectItem value="COMBO">Combo Package</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Category <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newProduct.categoryId}
                  onValueChange={(val) =>
                    setNewProduct({ ...newProduct, categoryId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-slate-700">
                Display Sections
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                {sectionsList.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No sections created yet.
                  </p>
                ) : (
                  sectionsList.map((sec) => (
                    <div
                      key={sec.id}
                      onClick={() => {
                        const current = newProduct.sections || [];
                        const updated = current.includes(sec.id)
                          ? current.filter((id) => id !== sec.id)
                          : [...current, sec.id];
                        setNewProduct({ ...newProduct, sections: updated });
                      }}
                      className={cn(
                        "cursor-pointer px-3 py-1.5 rounded-full text-xs font-bold border transition-all select-none flex items-center gap-1",
                        (newProduct.sections || []).includes(sec.id)
                          ? "bg-orange-600 border-orange-600 text-white shadow-sm scale-105"
                          : "bg-white border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600",
                      )}
                    >
                      {sec.title}
                    </div>
                  ))
                )}
              </div>
            </div>

            {newProduct.type === "COMBO" && (
              <ComboBuilder
                comboItems={newProduct.comboItems || []}
                setComboItems={(comboItems) =>
                  setNewProduct({ ...newProduct, comboItems })
                }
                products={products}
              />
            )}

            <div>
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Description</label>
              </div>
              <Textarea
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    description: e.target.value,
                  })
                }
                placeholder="Product description..."
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">
                  Price (৳) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price:
                        e.target.value === ""
                          ? ""
                          : Math.max(0, parseFloat(e.target.value)),
                    })
                  }
                  required
                  min={0}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
              {config.measurementUnit !== "PCS" && (
                <div>
                  <label className="text-sm font-medium">
                    {config.measurementUnit === "WEIGHT"
                      ? "Unit Weight (g)"
                      : "Unit Volume (ml)"}
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 200"
                    value={newProduct.weight}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        weight:
                          e.target.value === ""
                            ? ""
                            : Math.max(0, parseFloat(e.target.value)),
                      })
                    }
                    min={0}
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                  <p className="text-[10px] text-slate-500">
                    1 Unit = {newProduct.weight || 0} {unitLabel}
                  </p>
                </div>
              )}
              {newProduct.type !== "COMBO" && (
                <div>
                  <label className="text-sm font-medium">Pieces Inside</label>
                  <Input
                    type="number"
                    placeholder="e.g. 2"
                    value={newProduct.servingSize}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        servingSize:
                          e.target.value === ""
                            ? ""
                            : Math.max(0, parseInt(e.target.value)),
                      })
                    }
                    min={0}
                    className="mt-1"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
              )}
              {newProduct.type !== "COMBO" && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <label className="text-sm font-medium flex justify-between">
                    <span>Stock Quantity</span>
                    <span className="text-xs text-slate-500 font-normal">
                      {(config.measurementUnit || "PCS") === "PCS"
                        ? "(Pieces)"
                        : `(Units of ${newProduct.weight || 0}${unitLabel})`}
                    </span>
                  </label>

                  {(config.measurementUnit || "PCS") === "PCS" ? (
                    <Input
                      type="number"
                      placeholder="0"
                      value={newProduct.pieces}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          pieces:
                            e.target.value === ""
                              ? ""
                              : Math.max(0, parseFloat(e.target.value)),
                        })
                      }
                      className="mt-1 bg-white"
                      min={0}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  ) : (
                    <>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          placeholder="0"
                          value={
                            newProduct.pieces
                              ? Math.floor(
                                  Number(newProduct.pieces) /
                                    (Number(newProduct.weight) || 1),
                                )
                              : ""
                          }
                          onChange={(e) => {
                            const val =
                              e.target.value === ""
                                ? ""
                                : Math.max(0, parseFloat(e.target.value));
                            const units = Number(val) || 0;
                            const unitWeight = Number(newProduct.weight) || 1;
                            setNewProduct({
                              ...newProduct,
                              pieces: val === "" ? "" : units * unitWeight,
                            });
                          }}
                          className="bg-white"
                          min={0}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                        <div className="flex items-center text-xs text-slate-500 whitespace-nowrap px-2 bg-white border rounded">
                          {(() => {
                            const val = Number(newProduct.pieces || 0);
                            const unit = config.measurementUnit || "PCS";
                            if (unit === "WEIGHT" && val >= 1000) {
                              return `= ${(val / 1000).toFixed(1).replace(/\.0$/, "")} kg`;
                            }
                            if (unit === "VOLUME" && val >= 1000) {
                              return `= ${(val / 1000).toFixed(1).replace(/\.0$/, "")} L`;
                            }
                            return `= ${val} ${unit === "WEIGHT" ? "g" : "ml"}`;
                          })()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Loyalty Points</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newProduct.pointsReward}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      pointsReward:
                        e.target.value === ""
                          ? ""
                          : Math.max(0, parseFloat(e.target.value)),
                    })
                  }
                  min={0}
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  SKU <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    value={newProduct.sku}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, sku: e.target.value })
                    }
                    placeholder="Unique SKU"
                    required
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await generateUniqueSku();
                      if (res.success && res.sku) {
                        setNewProduct({ ...newProduct, sku: res.sku });
                        toast.success("Generated Unique SKU");
                      } else {
                        toast.error("Generation failed, try again");
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-orange-600"
                    title="Generate Unique SKU"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Main Image</label>
              <ImageUpload
                value={newProduct.image}
                onChange={(url) =>
                  setNewProduct({ ...newProduct, image: url as string })
                }
                onRemove={() => setNewProduct({ ...newProduct, image: "" })}
                recommendedText="1600 x 2000 px (4:5 ratio) for full mobile storefront card"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gallery Images</label>
              <ImageUpload
                value={newProduct.images || []}
                onChange={(urls) =>
                  setNewProduct({ ...newProduct, images: urls as string[] })
                }
                onRemove={(url?: string) =>
                  setNewProduct({
                    ...newProduct,
                    images: newProduct.images.filter((i) => i !== url),
                  })
                }
                multiple={true}
                recommendedText="1600 x 2000 px (4:5 ratio) for full mobile storefront card"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {editingId ? "Update Product" : "Save Product"}
            </Button>
            </form>
          </div>
        </Card>
      </div>
    </ModalPortal>
  );
}
