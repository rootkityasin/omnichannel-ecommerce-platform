"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  X,
  Sparkles,
  MoreVertical,
  Copy,
  Share2,
  LayoutGrid,
  List,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import { smartParseAI } from "@/app/actions/ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
  unarchiveProduct,
  deleteArchivedProduct,
  generateUniqueSku,
} from "@/app/actions/product";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCategories } from "@/app/actions/category";
import { getAdminSiteConfig } from "@/app/actions/settings";
import { getHomeSections } from "@/app/actions/section";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProductBoard } from "@/components/admin/ProductBoard";
import { cn } from "@/lib/utils";
// import { smartParse, generateMagicDescription, getBanglaSuggestion } from '@/lib/ai-utils';
// import Link from 'next/link';
import Image from "next/image";
import { generateDescriptionAI, translateToBanglaAI } from "@/app/actions/ai";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";

import { AdminProduct } from "@/types/common";

type LocalProduct = {
  id: string;
  name: string;
  price: number;
  sku: string;
  image: string | null;
  images?: string[];
  categoryId: string;
  description?: string | null;
  nutrition?: string | null;
  cookingInstructions?: string | null;
  pointsReward?: number;
  weight: number;
  servingSize?: number;
  pieces: number;
  stage: string;
  type: "SINGLE" | "COMBO";
  descriptionSwap?: boolean;
  comboItems: Array<{
    child?: { pieces: number };
    quantity: number;
    childId?: string;
  }>;
  sections?: Array<{ id: string }>;
};
type CategoryItem = Awaited<ReturnType<typeof getCategories>>[number];
type SectionItem = Awaited<ReturnType<typeof getHomeSections>>[number];
type SiteConfig = Awaited<ReturnType<typeof getAdminSiteConfig>>;

type ProductFormState = {
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

export default function ProductsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = session?.user?.permissions || [];
  const params = useParams();
  const router = useRouter();
  const domain = params.domain as string;

  const canManageProducts =
    userRole === "SUPER_ADMIN" ||
    userRole === "TENANT_ADMIN" ||
    userPermissions.includes("MANAGE_PRODUCTS");

  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [sectionsList, setSectionsList] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SiteConfig>({
    measurementUnit: "PCS",
    shopType: "RESTAURANT",
  } as SiteConfig);

  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");

  const [filterStock, setFilterStock] = useState("all");
  const [filterStage, setFilterStage] = useState("all");

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState<ProductFormState>({
    name: "",
    price: "" as number | string,
    sku: "",
    image: "",
    images: [] as string[],
    categoryId: "",
    description: "",
    nutrition: "",
    cookingInstructions: "",
    pointsReward: "" as number | string,
    weight: "" as number | string,
    servingSize: "" as number | string,
    pieces: "" as number | string,
    stage: "Draft",
    type: "SINGLE",
    descriptionSwap: false,
    comboItems: [] as { childId: string; quantity: number }[],
    sections: [] as string[],
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [archiveRequired, setArchiveRequired] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [smartPasteInput, setSmartPasteInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  const fetchData = async () => {
    try {
      setLoading(true);
      const [pData, cData, sData, confData] = await Promise.all([
        getAdminProducts(domain),
        getCategories(domain),
        getHomeSections(domain),
        getAdminSiteConfig(),
      ]);

      if (!isMounted.current) return;

      setProducts(pData as unknown as LocalProduct[]);
      setCategories(cData);
      setSectionsList(sData);
      setConfig(confData || { measurementUnit: "PCS" });
    } catch (err) {
      if (!isMounted.current) return;
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    router.refresh(); // Hard reset router cache so getHomeSections fetches fresh data
    fetchData();
  }, []);

  // Force table view for GROCERY shops — no kanban allowed
  useEffect(() => {
    if (config.shopType === "GROCERY") {
      setView("table");
    }
  }, [config.shopType]);

  // Helper for Edit Click
  const handleEditClick = async (product: { id: string }) => {
    // Reset state first to avoid stale data
    setEditingId(product.id);

    try {
      // Optimistic or placeholder for immediate feedback could go here
      const fullProduct = await getProductById(product.id);

      if (fullProduct) {
        setNewProduct({
          name: fullProduct.name || "",
          price: fullProduct.price,
          sku: fullProduct.sku,
          categoryId: fullProduct.categoryId,
          image: fullProduct.image || "",
          images: fullProduct.images || [],
          description: fullProduct.description || "",
          nutrition: "",
          cookingInstructions: "",
          pointsReward: 0,
          weight: fullProduct.weight || "",
          servingSize: fullProduct.servingSize || "",
          pieces: fullProduct.pieces || "",
          stage: fullProduct.stage || "Draft",
          type: fullProduct.type || "SINGLE",
          descriptionSwap: Boolean(fullProduct.descriptionSwap),
          comboItems: fullProduct.comboItems || [],
          sections: fullProduct.sections?.map((s) => s.id) || [],
        });
        setIsAdding(true);
      } else {
        toast.error("Failed to load product details");
        setEditingId(null);
      }
    } catch {
      toast.error("Error loading product");
      setEditingId(null);
    }
  };

  // Filter Logic - for RESTAURANT, table view only shows Draft (Ready Stock) items
  const stages = Array.from(new Set(products.map((p) => p.stage))).filter(
    (s) => s !== "Archived",
  );
  const filteredProducts = products.filter((p) => {
    // For RESTAURANT: Only show Draft items in table (batch items are for Kanban only)
    if (
      config.shopType === "RESTAURANT" &&
      view === "table" &&
      p.stage !== "Draft" &&
      p.stage !== "Archived"
    ) {
      return false;
    }
    const matchesStock =
      filterStock === "all"
        ? true
        : filterStock === "instock"
          ? p.pieces > 0
          : p.pieces <= 0;
    const matchesStage =
      filterStage === "all" ? p.stage !== "Archived" : p.stage === filterStage;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    return matchesStock && matchesStage && matchesSearch;
  });

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setArchiveRequired(false);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await deleteProduct(deleteId);
      if (res.success) {
        toast.success("Product deleted");
        setDeleteId(null);
        fetchData();
      } else if (res.error === "failed to deleted ordered item") {
        setArchiveRequired(true);
      } else {
        toast.error(res.error || "Failed to delete");
        setDeleteId(null);
      }
    } catch {
      toast.error("An error occurred");
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleArchive = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await archiveProduct(deleteId);
      if (res.success) {
        toast.success("Product archived successfully");
        setDeleteId(null);
        setArchiveRequired(false);
        fetchData();
      } else {
        toast.error(res.error || "Failed to archive");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnarchive = async (id: string) => {
    try {
      const res = await unarchiveProduct(id);
      if (res.success) {
        toast.success("Product restored successfully");
        fetchData();
      } else {
        toast.error(res.error || "Failed to restore product");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (
      !confirm(
        "Permanently delete this archived product? This cannot be undone. This will remove order history.",
      )
    ) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await deleteArchivedProduct(id);
      if (res.success) {
        toast.success("Product deleted permanently");
        fetchData();
      } else {
        toast.error(res.error || "Failed to delete");
      }
    } catch (err: any) {
      console.error("Permanent Delete Client Error:", err);
      toast.error(err?.message || String(err) || "An unknown error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (filteredProducts: LocalProduct[]) => {
    setSelectedProducts((prev) =>
      prev.length === filteredProducts.length
        ? []
        : filteredProducts.map((p) => p.id),
    );
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete ${selectedProducts.length} products?`,
      )
    )
      return;
    setIsDeleting(true);
    try {
      for (const id of selectedProducts) {
        await deleteProduct(id);
      }
      toast.success("Bulk delete successful");
      setSelectedProducts([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Bulk delete partially failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkMove = async (targetStage: string) => {
    setIsDeleting(true);
    try {
      for (const id of selectedProducts) {
        await updateProduct(id, { stage: targetStage });
      }
      toast.success(`Bulk moved to ${targetStage}`);
      setSelectedProducts([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Bulk move partially failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStageMove = async (
    id: string,
    newStage: string,
    quantity?: number,
  ) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    // SPECIAL CASE: Returning to Ready Stock (Draft) - Merge back into original
    if (newStage === "Draft" && product.stage !== "Draft") {
      // Find the original product in Ready Stock by matching the base name
      // Remove any "(Batch)" suffix or stage suffix from name to find original
      const baseName = product.name.replace(/\s*\(Batch\)/g, "").trim();
      const originalProduct = products.find(
        (p) =>
          p.stage === "Draft" &&
          p.id !== id &&
          (p.name === baseName || p.name === product.name),
      );

      if (originalProduct) {
        // Merge: Add returning quantity to original
        const newTotal = originalProduct.pieces + product.pieces;
        setProducts((prev) =>
          prev.map((p) =>
            p.id === originalProduct.id ? { ...p, pieces: newTotal } : p,
          ),
        );
        // Remove the returning batch from UI
        setProducts((prev) => prev.filter((p) => p.id !== id));

        await updateProduct(originalProduct.id, { pieces: newTotal });
        await deleteProduct(id);

        toast.success(`Returned ${product.pieces} items to Ready Stock`);
        fetchData();
        return;
      } else {
        // No original found, just move it back as is
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, stage: newStage } : p)),
        );
        await updateProduct(id, { stage: newStage });
        toast.success(`Moved to Ready Stock`);
        return;
      }
    }

    // If NO quantity provided (e.g. non-restaurant move), do standard move
    if (!quantity) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stage: newStage } : p)),
      );
      await updateProduct(id, { stage: newStage });
      return;
    }

    // Restaurant Flow: ALWAYS Split/Deduct if quantity is provided
    // This ensures 'Ready Stock' items stay as templates, and Batches move independently.

    // 1. Deduct from Source
    const remaining = Math.max(0, product.pieces - quantity);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, pieces: remaining } : p)),
    );

    await updateProduct(id, { pieces: remaining });

    // 2. Create Clone/Batch at new Stage
    const res = await createProduct({
      name: product.name,
      sku: `${Date.now()}`,
      price: product.price,
      description: product.description || undefined,
      image: product.image || undefined,
      images: product.images || [],
      categoryId: product.categoryId,
      pieces: quantity,
      weight: product.weight,
      stage: newStage,
      type: product.type,
      sections: product.sections?.map((s) => s.id) || [],
    });

    if (res.success) {
      toast.success(`Moved ${quantity} items to ${newStage}`);
      fetchData(); // Refresh to ensure IDs are synced
    } else {
      toast.error("Failed to create batch");
      fetchData(); // Revert on failure
    }
  };

  const handleClone = async (product: AdminProduct | LocalProduct) => {
    const p = product as unknown as LocalProduct;
    const sections = p.sections || [];
    const res = await createProduct({
      name: `${p.name} (Copy)`,
      sku: `${p.sku}-COPY-${Date.now()}`,
      price: p.price,
      description: p.description || undefined,
      image: p.image || undefined,
      images: p.images || [],
      categoryId: p.categoryId,
      pieces: p.pieces,
      weight: p.weight,
      stage: p.stage,
      type: p.type,
      comboItems: (p.comboItems || [])
        .filter((item) => Boolean(item.childId))
        .map((item) => ({
          childId: item.childId as string,
          quantity: item.quantity,
        })),
      sections: sections.map((s) => s.id),
    });
    if (res.success) {
      toast.success("Product cloned");
      fetchData();
    }
  };

  const handleEdit = (product: AdminProduct | LocalProduct) => {
    const p = product as unknown as LocalProduct;
    const sections = p.sections || [];
    setNewProduct({
      name: p.name,
      price: p.price,
      sku: p.sku || "",
      image: p.image || "",
      images: p.images || [],
      categoryId: p.categoryId || "",
      description: p.description || "",
      nutrition: p.nutrition || "",
      cookingInstructions: p.cookingInstructions || "",
      pointsReward: p.pointsReward || 0,
      weight: p.weight || 0,
      servingSize: p.servingSize || 1,
      pieces: p.pieces || 0,
      stage: p.stage || "Draft",
      type: p.type || "SINGLE",
      descriptionSwap: p.descriptionSwap || false,
      comboItems: p.comboItems || [],
      sections: sections.map((s) => s.id),
    });
    setEditingId(p.id);
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProduct.categoryId) {
      toast.error("Category is required");
      return;
    }

    if (editingId) {
      const res = await updateProduct(editingId, {
        ...newProduct,
        comboItems: newProduct.comboItems
          .filter((item) => Boolean(item.childId))
          .map((item) => ({
            childId: item.childId as string,
            quantity: item.quantity,
          })),
      });
      if (res.success) {
        toast.success("Product updated");
        setIsAdding(false);
        setEditingId(null);
        fetchData();
      } else {
        toast.error(res.error || "Update failed");
      }
    } else {
      const res = await createProduct({
        ...newProduct,
        comboItems: newProduct.comboItems
          .filter((item) => Boolean(item.childId))
          .map((item) => ({
            childId: item.childId as string,
            quantity: item.quantity,
          })),
      });
      if (res.success) {
        toast.success("Product created");
        setIsAdding(false);
        fetchData();
      } else {
        toast.error(res.error || "Creation failed");
      }
    }
  };

  // Helper to get category name
  const getCatName = (id: string) =>
    categories.find((c) => c.id === id)?.name || "Uncategorized";

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            📦 All Products
          </h1>
          <p className="text-sm text-slate-500">
            Manage your menu items and production pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          {config.shopType === "RESTAURANT" && (
            <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
              <button
                onClick={() => setView("table")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  view === "table"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-400",
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  view === "kanban"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-400",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-9 w-[150px] lg:w-[200px] bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  suppressHydrationWarning
                  className={
                    filterStock !== "all" || filterStage !== "all"
                      ? "bg-orange-50 border-orange-200 text-orange-700"
                      : ""
                  }
                >
                  <Filter className="w-4 h-4 mr-2" /> Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">
                      Filter Products
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Refine by stock or stage.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label>Stock Status</Label>
                      <Select
                        value={filterStock}
                        onValueChange={setFilterStock}
                      >
                        <SelectTrigger className="col-span-2 h-8">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="instock">In Stock</SelectItem>
                          <SelectItem value="outstock">Out of Stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-4">
                      <Label>Stage</Label>
                      <Select
                        value={filterStage}
                        onValueChange={setFilterStage}
                      >
                        <SelectTrigger className="col-span-2 h-8">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          {stages.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                          <SelectItem
                            value="Archived"
                            className="text-orange-600 font-bold"
                          >
                            📂 Archived
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => {
                setEditingId(null);
                setNewProduct({
                  name: "",
                  price: "",
                  sku: "",
                  image: "",
                  images: [],
                  categoryId: "",
                  description: "",
                  nutrition: "",
                  cookingInstructions: "",
                  pointsReward: "",
                  weight: "",
                  pieces: "",
                  servingSize: "",
                  stage: "Draft",
                  type: "SINGLE",
                  descriptionSwap: false,
                  comboItems: [],
                  sections: [],
                });
                setIsAdding(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Edit Product" : "New Product"}
                </h2>
                <div className="flex gap-2">
                  {!editingId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100"
                      onClick={() => setShowSmartPaste(true)}
                    >
                      <Sparkles className="w-3 h-3 mr-1" /> Smart Paste
                    </Button>
                  )}
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      value={newProduct.name}
                      onChange={async (e) => {
                        const val = e.target.value;
                        setNewProduct((prev) => ({ ...prev, name: val }));

                        // Debounce Bangla Check (simple implementation)
                        if (val.length > 3 && !val.includes(" ")) {
                          try {
                            const bn = await translateToBanglaAI(val);
                            if (bn && bn.length > 0 && bn !== val) {
                              toast("🇧🇩 AI Tip: " + bn, {
                                position: "bottom-center",
                                className:
                                  "bg-indigo-50 text-indigo-800 text-xs py-1 px-2 border-indigo-200",
                              });
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }
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

                {/* Sections Selection */}
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

                {/* Combo Builder */}
                {newProduct.type === "COMBO" && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                    <label className="text-sm font-bold text-slate-700 block">
                      Combo Contents
                    </label>
                    {newProduct.comboItems?.map((item, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Select
                          value={item.childId}
                          onValueChange={(val) => {
                            const updated = [...(newProduct.comboItems || [])];
                            updated[idx].childId = val;
                            setNewProduct({
                              ...newProduct,
                              comboItems: updated,
                            });
                          }}
                        >
                          <SelectTrigger className="flex-1 text-xs h-8">
                            <SelectValue placeholder="Select Product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products
                              .filter((p) => p.type !== "COMBO")
                              .map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          className="w-20 h-8 text-xs"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...(newProduct.comboItems || [])];
                            updated[idx].quantity = Math.max(
                              0,
                              parseInt(e.target.value) || 0,
                            );
                            setNewProduct({
                              ...newProduct,
                              comboItems: updated,
                            });
                          }}
                          min={0}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500"
                          onClick={() => {
                            const updated = newProduct.comboItems?.filter(
                              (_, i) => i !== idx,
                            );
                            setNewProduct({
                              ...newProduct,
                              comboItems: updated,
                            });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full text-xs border-dashed"
                      onClick={() =>
                        setNewProduct({
                          ...newProduct,
                          comboItems: [
                            ...(newProduct.comboItems || []),
                            { childId: "", quantity: 1 },
                          ],
                        })
                      }
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Ingredient
                    </Button>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Description</label>
                    <button
                      type="button"
                      onClick={async () => {
                        const catName = getCatName(newProduct.categoryId);
                        const btn = document.getElementById("ai-desc-btn");
                        if (btn) btn.innerText = "Writing...";

                        try {
                          const desc = await generateDescriptionAI(
                            newProduct.name,
                            catName,
                            Number(newProduct.weight || 0),
                            config.measurementUnit,
                            newProduct.image, // Pass Visual Context
                          );
                          setNewProduct((prev) => ({
                            ...prev,
                            description: desc,
                          }));
                        } catch (e) {
                          toast.error("AI Error");
                        }

                        if (btn)
                          btn.innerHTML =
                            '<span class="flex items-center"><svg class="w-3 h-3 mr-1" .../> Auto-Write (AI)</span>';
                      }}
                      id="ai-desc-btn"
                      className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center"
                    >
                      <Sparkles className="w-3 h-3 mr-1" /> Auto-Write (AI)
                    </button>
                  </div>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        description: e.target.value,
                      })
                    }
                    placeholder="Product description... or click Auto-Write"
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
                        1 Unit = {newProduct.weight || 0}{" "}
                        {config.measurementUnit === "WEIGHT" ? "g" : "ml"}
                      </p>
                    </div>
                  )}
                  {newProduct.type !== "COMBO" && (
                    <div>
                      <label className="text-sm font-medium">
                        Pieces Inside
                      </label>
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
                            : `(Units of ${newProduct.weight || 0}${(config.measurementUnit || "PCS") === "WEIGHT" ? "g" : "ml"})`}
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
                              // Calculate units from total pieces (weight). If weight is 0, treat as 1 to avoid /0 or *0 lock
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
                                // Use weight or fallback to 1 so we can at least save the number of "units" effectively
                                const unitWeight =
                                  Number(newProduct.weight) || 1;
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
                    <label className="text-sm font-medium">
                      Loyalty Points
                    </label>
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
                    recommendedText="1600x2000 (4:5) • Center subject"
                    helperText="Used for cards (4:5), hero (16:9), and thumbnails (1:1)"
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
                    recommendedText="1600x2000 (4:5) • Center subject"
                    helperText="Used for cards (4:5), hero (16:9), and thumbnails (1:1)"
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
      )}

      {/* Table view for GROCERY or when view is 'table' */}
      {view === "table" || config.shopType !== "RESTAURANT" ? (
        <Card className="border-none shadow-none bg-transparent">
          <Tabs defaultValue="all" className="w-full">
            <TabsContent value="all" className="mt-4">
              <div className="rounded-lg border border-gray-100 bg-white shadow-sm overflow-x-auto custom-table-scrollbar">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-gray-50 text-slate-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="p-4 w-4">
                        <input type="checkbox" />
                      </th>
                      <th className="p-4">Product</th>
                      <th className="p-4">SKU</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      {config.shopType !== "GROCERY" && (
                        <th className="p-4">Stage</th>
                      )}
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center">
                          Loading...
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50/50">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleSelection(product.id)}
                            />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                {product.image && (
                                  <Image
                                    src={product.image}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800">
                                  {product.name}
                                </div>
                                <div className="text-xs text-orange-600">
                                  {getCatName(product.categoryId)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500">
                            {product.sku || "-"}
                          </td>
                          <td className="p-4 font-bold text-slate-800">
                            ৳{product.price}
                          </td>
                          <td className="p-4 text-center">
                            {product.type === "COMBO" ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {(() => {
                                  if (
                                    !product.comboItems ||
                                    product.comboItems.length === 0
                                  )
                                    return "0 Sets";
                                  const limits = product.comboItems.map(
                                    (item) =>
                                      item.child
                                        ? Math.floor(
                                          item.child.pieces / item.quantity,
                                        )
                                        : 0,
                                  );
                                  return `${Math.min(...limits)} Sets`;
                                })()}
                              </span>
                            ) : (
                              (() => {
                                const unit = config.measurementUnit || "PCS";

                                if (unit === "PCS") {
                                  return (
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.pieces < 10 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                                    >
                                      {product.pieces} Pcs
                                    </span>
                                  );
                                }

                                // Use global unit values from settings
                                const unitValue =
                                  unit === "WEIGHT"
                                    ? config.weightUnitValue || 200
                                    : config.volumeUnitValue || 1000;

                                if (unit === "VOLUME") {
                                  // pieces is Total ml
                                  const totalVolume = product.pieces;
                                  const units = Math.floor(
                                    totalVolume / unitValue,
                                  );
                                  const display =
                                    totalVolume >= 1000
                                      ? `${(totalVolume / 1000).toFixed(1)} Ltr`
                                      : `${totalVolume} ml`;

                                  const isLowStock = units < 10;
                                  return (
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isLowStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                                    >
                                      {display}
                                      <span className="ml-1 opacity-75">
                                        ({units} units)
                                      </span>
                                    </span>
                                  );
                                }

                                // Default to WEIGHT
                                // pieces is Total Grams
                                const weightInGrams = product.pieces;
                                const units = Math.floor(
                                  weightInGrams / unitValue,
                                );
                                const isLowStock = units < 10;
                                return (
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isLowStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}
                                  >
                                    {weightInGrams >= 1000
                                      ? `${(weightInGrams / 1000).toFixed(1)} kg`
                                      : `${weightInGrams} g`}
                                    <span className="ml-1 opacity-75">
                                      ({units} units)
                                    </span>
                                  </span>
                                );
                              })()
                            )}
                          </td>
                          {config.shopType !== "GROCERY" && (
                            <td className="p-4">
                              <Badge variant="outline">{product.stage}</Badge>
                            </td>
                          )}
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/buy/${product.id}`,
                                    );
                                    toast.success("Link Copied!", {
                                      className:
                                        "bg-green-600 text-white border-green-700",
                                      description:
                                        "Product link copied to clipboard",
                                    });
                                  }}
                                >
                                  <Share2 className="w-4 h-4 mr-2" /> Share Link
                                </DropdownMenuItem>
                                {product.stage === "Archived" ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleUnarchive(product.id)
                                      }
                                    >
                                      <Plus className="w-4 h-4 mr-2" /> Restore
                                      / Unarchive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() =>
                                        handlePermanentDelete(product.id)
                                      }
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Permanently
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => handleEditClick(product)}
                                    >
                                      <Edit className="w-4 h-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleClone(product)}
                                    >
                                      <Copy className="w-4 h-4 mr-2" /> Clone
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        <ProductBoard
          products={filteredProducts.map((p) => ({
            ...p,
            image: p.image || "",
            stock: p.pieces > 0,
          }))}
          onMove={handleStageMove}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClone={handleClone}
        />
      )}
      {/* Smart Paste AI Modal */}
      {showSmartPaste && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm group">
            {/* Spin-On-Hover Glow (Seamless Continuous Loop) */}
            {/* 1. Blurry Glow (Hidden -> Visible & Spinning) */}
            <div className="absolute -inset-[3px] rounded-[28px] opacity-0 blur-lg overflow-hidden transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] bg-[conic-gradient(from_0deg,#f97316_0deg,#9333ea_90deg,#06b6d4_180deg,#9333ea_270deg,#f97316_360deg)] animate-[spin_4s_linear_infinite]" />
            </div>
            {/* 2. Sharp Border (Hidden -> Visible & Spinning) */}
            <div className="absolute -inset-[1.5px] rounded-[26px] overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] bg-[conic-gradient(from_0deg,#f97316_0deg,#9333ea_90deg,#06b6d4_180deg,#9333ea_270deg,#f97316_360deg)] animate-[spin_4s_linear_infinite]" />
            </div>

            <Card className="relative w-full bg-[#080808] rounded-3xl overflow-hidden p-8 flex flex-col items-center text-center h-full border-none">
              {/* Inner Shine (Top Left) to match reference lighting */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowSmartPaste(false)}
                className="absolute top-4 right-4 p-2 text-slate-600 hover:text-slate-300 transition-colors rounded-full hover:bg-white/5 z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Glowing Orb Icon (Refined) */}
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                {/* Icon Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-40" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-[#1e2230] to-[#13151f] rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                  <Sparkles className="w-6 h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
              </div>

              {/* Typography */}
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                Paste{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                  Supplier Text
                </span>
              </h3>
              <p className="text-slate-500 text-xs mb-6 leading-relaxed max-w-[240px]">
                Copy the messy list from your supplier and paste it below. AI
                will automatically extract the <strong>Name</strong>,{" "}
                <strong>Weight</strong>, and <strong>Pieces</strong>.
              </p>

              {/* Glassy Input */}
              <div className="w-full relative mb-6 group/input">
                <Textarea
                  value={smartPasteInput}
                  onChange={(e) => setSmartPasteInput(e.target.value)}
                  placeholder="Paste raw text here..."
                  className="relative w-full min-h-[100px] bg-[#12141c] border-white/5 focus:border-purple-500/50 text-white placeholder:text-slate-700 rounded-xl resize-none p-4 text-sm shadow-inner focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                  autoFocus
                />
              </div>

              {/* Main Action Button */}
              <Button
                onClick={async () => {
                  if (!smartPasteInput.trim()) return;
                  setIsParsing(true);
                  try {
                    const data = await smartParseAI(smartPasteInput);
                    setNewProduct((prev) => ({
                      ...prev,
                      name: data.name || prev.name,
                      weight: data.weight || prev.weight,
                      pieces: data.pieces || prev.pieces,
                    }));
                    toast.success("Insights Applied!");
                    setShowSmartPaste(false);
                    setSmartPasteInput("");
                  } catch (e) {
                    toast.error("Failed to parse");
                  } finally {
                    setIsParsing(false);
                  }
                }}
                disabled={!smartPasteInput.trim() || isParsing}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transition-all rounded-lg font-medium text-sm shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-50"
              >
                {isParsing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  "Analyze Now"
                )}
              </Button>
            </Card>
          </div>
        </div>
      )}
      {/* Delete/Archive AlertDialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && !isDeleting && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveRequired
                ? "Failed to delete: ordered item"
                : "Delete Product?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiveRequired
                ? "This product has been ordered and cannot be deleted. Would you like to archive it instead? It will be hidden from customers but preserved for order history."
                : "Are you sure you want to delete this product? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            {archiveRequired ? (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleArchive();
                }}
                disabled={isDeleting}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isDeleting ? "Archiving..." : "Archive Product"}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  confirmDelete();
                }}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Bar */}
      {selectedProducts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="bg-slate-900 border-slate-800 shadow-2xl px-6 py-4 flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
              <div className="bg-orange-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {selectedProducts.length}
              </div>
              <div className="text-sm font-medium text-white">Selected</div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => setSelectedProducts([])}
              >
                <X className="w-4 h-4 mr-2" /> Deselect
              </Button>

              <div className="h-6 w-px bg-slate-700 mx-2" />

              <Select onValueChange={handleBulkMove}>
                <SelectTrigger className="h-9 w-[160px] bg-slate-800 border-slate-700 text-white text-xs">
                  <LayoutGrid className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Move to Stage" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  <SelectItem value="Archived">Move to Archived</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                size="sm"
                className="h-9 bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600 hover:text-white"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Bulk Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
