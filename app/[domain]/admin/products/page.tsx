"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  X,
  MoreVertical,
  Copy,
  Share2,
  LayoutGrid,
  List,
  Edit,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  getPaginatedAdminProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
  unarchiveProduct,
  deleteArchivedProduct,
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
import { getAdminProductPageConfig } from "@/app/actions/settings";
import { getSections } from "@/app/actions/section";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
// import { smartParse, generateMagicDescription, getBanglaSuggestion } from '@/lib/ai-utils';
// import Link from 'next/link';
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

import { AdminProduct } from "@/types/common";
import type { ProductFormState } from "@/components/admin/products/ProductFormModal";

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
type SectionItem = Awaited<ReturnType<typeof getSections>>[number];
type SiteConfig = Awaited<ReturnType<typeof getAdminProductPageConfig>>;

const ProductBoard = dynamic(
  () =>
    import("@/components/admin/ProductBoard").then((mod) => mod.ProductBoard),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading board...
      </div>
    ),
  },
);

const ProductFormModal = dynamic(
  () => import("@/components/admin/products/ProductFormModal"),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="rounded-xl bg-white px-6 py-5 text-sm text-slate-500 shadow-xl">
          Loading product form...
        </div>
      </div>
    ),
  },
);

export default function ProductsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = session?.user?.permissions || [];
  const params = useParams();
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
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 50;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page to 1 when search changes
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

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

  const [hasLoadedSections, setHasLoadedSections] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  // Fetch ONLY paginated products — runs on every filter/page/search change
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const pData = await getPaginatedAdminProducts({
        domain,
        page,
        limit,
        search: debouncedSearch,
        stage: filterStage,
        stockStatus: filterStock,
      });

      if (!isMounted.current) return;

      setProducts(pData.data as unknown as LocalProduct[]);
      setTotalPages(pData.pages);
      setTotalCount(pData.total);
    } catch (err) {
      if (!isMounted.current) return;
      console.error(err);
      toast.error("Failed to load products");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const ensureSectionsLoaded = useCallback(async () => {
    if (hasLoadedSections) return;
    try {
      const sData = await getSections(domain);
      if (!isMounted.current) return;
      setSectionsList(sData);
      setHasLoadedSections(true);
    } catch (err) {
      console.error("Failed to load sections", err);
      toast.error("Failed to load sections");
    }
  }, [domain, hasLoadedSections]);

  // NOTE: router.refresh() removed — caused CPU spikes on every mount by forcing a full server re-render cycle.

  // Fetch static data ONCE on mount — categories/config only
  useEffect(() => {
    Promise.all([getCategories(domain), getAdminProductPageConfig()])
      .then(([cData, confData]) => {
        if (!isMounted.current) return;
        setCategories(cData);
        setConfig(confData || ({ measurementUnit: "PCS" } as SiteConfig));
      })
      .catch((err) => {
        console.error("Failed to load static data", err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  // Fetch paginated products on filter/page/search change
  useEffect(() => {
    fetchProducts();
  }, [page, debouncedSearch, filterStage, filterStock, domain]);

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
      await ensureSectionsLoaded();
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

  // Products are already filtered by the server for stock, stage, and search.
  // We just apply the RESTAURANT specific "Draft only in table view" here
  // if filterStage is 'all' to prevent showing batch stage items.
  const filteredProducts = products.filter((p) => {
    if (
      config.shopType === "RESTAURANT" &&
      view === "table" &&
      p.stage !== "Draft" &&
      p.stage !== "Archived"
    ) {
      return false;
    }
    return true;
  });

  const boardProducts = useMemo(
    () =>
      filteredProducts.map((p) => ({
        ...p,
        image: p.image || "",
        stock: p.pieces > 0,
      })),
    [filteredProducts],
  );

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
        fetchProducts();
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
        fetchProducts();
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
        fetchProducts();
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
        fetchProducts();
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

  const runInChunks = async (
    ids: string[],
    worker: (id: string) => Promise<unknown>,
    chunkSize = 8,
  ) => {
    let failed = 0;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const results = await Promise.allSettled(chunk.map((id) => worker(id)));
      failed += results.filter((r) => r.status === "rejected").length;
    }
    return { failed };
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
      const { failed } = await runInChunks(selectedProducts, deleteProduct);
      if (failed > 0) {
        toast.error(`Bulk delete completed with ${failed} failures`);
      } else {
        toast.success("Bulk delete successful");
      }
      setSelectedProducts([]);
      fetchProducts();
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
      const { failed } = await runInChunks(selectedProducts, (id) =>
        updateProduct(id, { stage: targetStage }),
      );
      if (failed > 0) {
        toast.error(`Bulk move completed with ${failed} failures`);
      } else {
        toast.success(`Bulk moved to ${targetStage}`);
      }
      setSelectedProducts([]);
      fetchProducts();
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
        fetchProducts();
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
      fetchProducts(); // Refresh to ensure IDs are synced
    } else {
      toast.error("Failed to create batch");
      fetchProducts(); // Revert on failure
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
      fetchProducts();
    }
  };

  const handleEdit = (product: AdminProduct | LocalProduct) => {
    const p = product as unknown as LocalProduct;
    const sections = p.sections || [];
    void ensureSectionsLoaded();
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
        fetchProducts();
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
        fetchProducts();
      } else {
        toast.error(res.error || "Creation failed");
      }
    }
  };

  // Helper to get category name
  const getCatName = (id: string) =>
    categories.find((c) => c.id === id)?.name || "Uncategorized";

  const getComboAvailableSets = useCallback(
    (product: LocalProduct | AdminProduct) => {
      if (!product.comboItems || product.comboItems.length === 0) return 0;

      const limits = product.comboItems.map((item) => {
        const childPieces = item.child?.pieces || 0;
        return Math.floor(childPieces / Math.max(1, item.quantity || 1));
      });

      return limits.length > 0 ? Math.max(0, Math.min(...limits)) : 0;
    },
    [],
  );

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
                void ensureSectionsLoaded();
                setIsAdding(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>
      </div>
      {/* Modal */}
      <ProductFormModal
        isOpen={isAdding}
        editingId={editingId}
        newProduct={newProduct}
        setNewProduct={setNewProduct}
        categories={categories}
        sectionsList={sectionsList}
        products={products}
        config={config}
        onClose={() => setIsAdding(false)}
        onSubmit={handleSave}
      />
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
                                {getComboAvailableSets(product)} Sets
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

              {/* Table Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6 rounded-b-lg mt-4 shadow-sm border">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      variant="outline"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page >= totalPages}
                      variant="outline"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {(page - 1) * limit + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(page * limit, totalCount)}
                        </span>{" "}
                        of <span className="font-medium">{totalCount}</span>{" "}
                        products
                      </p>
                    </div>
                    <div>
                      <nav
                        className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                        aria-label="Pagination"
                      >
                        <Button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          variant="outline"
                          className="rounded-l-md px-2 py-2"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center px-4 font-medium text-sm border-y border-gray-200 bg-white">
                          Page {page} of {totalPages}
                        </div>
                        <Button
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={page >= totalPages}
                          variant="outline"
                          className="rounded-r-md px-2 py-2"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        <ProductBoard
          products={boardProducts}
          onMove={handleStageMove}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClone={handleClone}
        />
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
