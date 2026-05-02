"use client";

import dynamic from "next/dynamic";
import {
  Search,
  Filter,
  Plus,
  Edit,
  MessageCircle,
  LayoutGrid,
  List,
  Check,
  X,
  ChevronDown,
  AlertOctagon,
  RotateCcw,
  Ban,
  Calendar as CalendarIcon,
  Printer,
  MoreVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/styles/datepicker.css";
import { cn } from "@/lib/utils";
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
import { type AdminOrder, type AdminOrderDetails } from "@/types/common";
import { format } from "date-fns";
import { getDeliveryConfig, getSiteConfig } from "@/app/actions/settings";
import { validateCoupon } from "@/app/actions/coupon";
import {
  createOrder as createOrderAction,
  printOrderInvoice,
  updateAdminOrder,
  deleteAdminOrder,
  getPaginatedAdminOrders,
  getAdminOrderDetails,
  getOrderStats,
} from "@/app/actions/order";
import { getProducts } from "@/app/actions/product";
import { getBlockedCustomers, updateStorySection } from "@/app/actions/story";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

type ProductOption = Awaited<ReturnType<typeof getProducts>>[number];

const FulfillmentBoard = dynamic(
  () =>
    import("@/components/admin/FulfillmentBoard").then(
      (mod) => mod.FulfillmentBoard,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading fulfillment board...
      </div>
    ),
  },
);

const OrderDetailsModal = dynamic(
  () => import("@/components/admin/orders/OrderDetailsModal"),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function OrdersPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const userPermissions = session?.user?.permissions || [];
  const params = useParams();
  const domain = params.domain as string;

  const canManageOrders =
    userRole === "SUPER_ADMIN" ||
    userRole === "TENANT_ADMIN" ||
    userPermissions.includes("MANAGE_ORDERS");

  const [shopType, setShopType] = useState("RESTAURANT");
  const [blockedPhones, setBlockedPhones] = useState<string[]>([]);
  const [blockedEmails, setBlockedEmails] = useState<string[]>([]);

  // Add Order Form
  const [newOrder, setNewOrder] = useState({
    customer: "",
    email: "",
    phone: "",
    address: "",
    deliveryCharge: 0,
    couponCode: "",
    discountAmount: 0,
  });

  // Product Selection State
  const [availableProducts, setAvailableProducts] = useState<ProductOption[]>(
    [],
  );
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, number>
  >({});
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  // Pagination & Server State
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [stats, setStats] = useState<any>({
    statusCounts: {},
    todayCount: 0,
    todayCancelled: 0,
    totalSales: 0,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filterSearch, setFilterSearch] = useState("");
  const [searchInput, setSearchInput] = useState(""); // local input before submit
  const [filterSource, setFilterSource] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateDate, setDateDate] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedConfigRef = useRef(false);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateStart = dateDate ? dateDate.toISOString() : undefined;

      const [ordersRes, statsRes] = await Promise.all([
        getPaginatedAdminOrders({
          page,
          limit,
          search: filterSearch,
          status: filterStatus,
          source: filterSource,
          dateStart,
          dateEnd: undefined,
        }),
        getOrderStats(),
      ]);

      setOrders(ordersRes.data as any);
      setTotalOrders(ordersRes.total);
      if (statsRes) setStats(statsRes);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filterSearch, filterStatus, filterSource, dateDate]);

  const loadOrderPageConfig = useCallback(async () => {
    if (hasLoadedConfigRef.current) return;
    try {
      const [siteConf, blockedCustomers] = await Promise.all([
        getSiteConfig(domain),
        getBlockedCustomers(),
      ]);

      if (siteConf?.shopType) setShopType(siteConf.shopType);
      setBlockedPhones(blockedCustomers.phones);
      setBlockedEmails(blockedCustomers.emails);
      hasLoadedConfigRef.current = true;
    } catch (err) {
      console.error("Failed to load order page config", err);
    }
  }, [domain]);

  const ensureCreateOrderDefaults = useCallback(async () => {
    try {
      const [deliveryConf] = await Promise.all([
        getDeliveryConfig(),
        loadOrderPageConfig(),
      ]);

      if (
        deliveryConf?.defaultCharge !== undefined &&
        deliveryConf?.defaultCharge !== null
      ) {
        setNewOrder((prev) => ({
          ...prev,
          deliveryCharge: Number(deliveryConf.defaultCharge) || 0,
        }));
      }
    } catch (err) {
      console.error("Failed to load create order defaults", err);
    }
  }, [loadOrderPageConfig]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Load page config once to avoid delayed rerender churn.
  useEffect(() => {
    void loadOrderPageConfig();
  }, [loadOrderPageConfig]);

  const getBDDate = () => {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const [view, setView] = useState<"table" | "kanban">("table");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<AdminOrderDetails | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    customer: "",
    phone: "",
    price: 0,
    items: 1,
  });
  const [originalEditForm, setOriginalEditForm] = useState<
    typeof editForm | null
  >(null);

  const hasChanges =
    editingId &&
    originalEditForm &&
    JSON.stringify(editForm) !== JSON.stringify(originalEditForm);

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await updateAdminOrder(id, { status: newStatus });
    if (res.success) {
      toast.success("Status Updated");
      fetchOrders();
    } else {
      toast.error(res.error || "Failed to update status");
    }
  };

  const openOrderDetails = async (order: AdminOrder) => {
    setSelectedOrderId(order.dbId);
    setIsDetailsLoading(true);
    try {
      const details = await getAdminOrderDetails(order.dbId);
      setSelectedOrderDetails(details as AdminOrderDetails | null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load order details");
      setSelectedOrderId(null);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrderId(null);
    setSelectedOrderDetails(null);
    setIsDetailsLoading(false);
  };

  const handleEditFromDetails = (order: AdminOrderDetails) => {
    closeOrderDetails();
    handleEditClick({
      ...order,
      items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    } as unknown as AdminOrder);
  };

  const handleProductSelect = (productId: string, checked: boolean) => {
    setSelectedProducts((prev) => {
      const updated = { ...prev };
      if (checked) {
        updated[productId] = updated[productId] || 1;
      } else {
        delete updated[productId];
      }
      return updated;
    });
  };

  const handleQuantityChange = (productId: string, value: number) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: Math.max(1, value || 1),
    }));
  };

  const getSubtotal = () => {
    return Object.entries(selectedProducts).reduce((sum, [id, qty]) => {
      const p = availableProducts.find((prod) => prod.id === id);
      return sum + (p ? p.price * qty : 0);
    }, 0);
  };

  const getItemsCount = () => {
    return Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);
  };

  const applyManualCoupon = async () => {
    const code = newOrder.couponCode.trim();
    if (!code) {
      toast.error("Enter a promo code first");
      return;
    }

    const subtotal = getSubtotal();
    if (subtotal <= 0) {
      toast.error("Select products before applying a promo code");
      return;
    }

    const couponItems = Object.entries(selectedProducts).map(([id, qty]) => {
      const product = availableProducts.find((prod) => prod.id === id);
      return {
        productId: id,
        quantity: qty,
        price: product?.price || 0,
      };
    });

    const result = await validateCoupon(code, subtotal, undefined, couponItems);
    if (!result.success) {
      setNewOrder((prev) => ({ ...prev, discountAmount: 0 }));
      toast.error(result.error || "Invalid promo code");
      return;
    }

    setNewOrder((prev) => ({
      ...prev,
      couponCode: result.code || code,
      discountAmount: result.discount || 0,
    }));
    toast.success(`Promo applied: -৳${result.discount || 0}`);
  };

  const loadProductsForModal = async () => {
    if (availableProducts.length === 0) {
      setIsProductsLoading(true);
      try {
        const prods = await getProducts();
        setAvailableProducts(prods);
      } catch (error) {
        toast.error("Failed to load products for manual order.");
      } finally {
        setIsProductsLoading(false);
      }
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!newOrder.customer.trim())
      return toast.error("Customer name is required");
    if (
      newOrder.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newOrder.email)
    )
      return toast.error("Invalid email");
    if (!phoneRegex.test(newOrder.phone))
      return toast.error("Invalid phone number. Format: 01XXXXXXXXX");
    if (!newOrder.address.trim())
      return toast.error("Delivery address is required");

    const selectedProductIds = Object.keys(selectedProducts);
    if (selectedProductIds.length === 0)
      return toast.error("Please select at least one product");

    const subtotal = getSubtotal();
    const itemsCount = getItemsCount();
    if (subtotal <= 0 || itemsCount <= 0)
      return toast.error("Price and quantity must be greater than 0");

    const orderItems = selectedProductIds.map((id) => {
      const p = availableProducts.find((prod) => prod.id === id);
      return {
        productId: id,
        quantity: selectedProducts[id] || 1,
        price: p?.price || 0,
      };
    });

    const discountAmount = Math.min(
      subtotal,
      Math.max(0, newOrder.discountAmount || 0),
    );
    const totalAmount =
      subtotal - discountAmount + Math.max(0, newOrder.deliveryCharge || 0);

    const res = await createOrderAction({
      customerName: newOrder.customer,
      customerEmail: newOrder.email,
      customerPhone: newOrder.phone,
      customerAddress: newOrder.address,
      totalAmount,
      items: orderItems,
      source: "MANUAL",
      couponCode: newOrder.couponCode.trim() || undefined,
      discountAmount,
    });

    if (res.success) {
      toast.success("Order created successfully");
      fetchOrders();
      setIsAdding(false);
      setNewOrder({
        customer: "",
        email: "",
        phone: "",
        address: "",
        deliveryCharge: newOrder.deliveryCharge || 0,
        couponCode: "",
        discountAmount: 0,
      });
      setSelectedProducts({});
    } else {
      toast.error(res.error || "Failed to create order");
    }
  };

  const handleEditClick = (order: AdminOrder) => {
    setEditingId(order.id);
    const form = {
      customer: order.customer,
      phone: order.phone,
      price: order.price,
      items: order.items,
    };
    setEditForm(form);
    setOriginalEditForm(form);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(editForm.phone))
      return toast.error("Invalid phone number");
    if (editForm.price <= 0 || editForm.items <= 0)
      return toast.error("Price and quantity > 0");

    if (editingId) {
      const res = await updateAdminOrder(editingId, editForm);
      if (res.success) {
        toast.success("Order Updated");
        fetchOrders();
        setEditingId(null);
      } else {
        toast.error("Failed to update");
      }
    }
  };

  const executeDelete = async () => {
    if (!deleteId) return;
    const res = await deleteAdminOrder(deleteId);
    if (res.success) {
      toast.success("Order Deleted");
      fetchOrders();
    } else {
      toast.error("Failed to delete");
    }
    setDeleteId(null);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const handlePrint = async (order: string | AdminOrder) => {
    const id = typeof order === "string" ? order : order.id;
    const res = await printOrderInvoice(id);
    if (res.success) {
      toast.success("Invoice Printed & Stock Deducted");
      fetchOrders();
      window.open(`/admin/orders/print/${id}`, "_blank");
    } else {
      toast.error(res.error || "Failed to print invoice");
    }
  };

  const handleMarkAsFake = async (order: AdminOrder & { email?: string }) => {
    if (!confirm(`Mark order #${order.id} as Fake?`)) return;

    const newBlockedPhones =
      order.phone && !blockedPhones.includes(order.phone)
        ? [...blockedPhones, order.phone]
        : blockedPhones;
    const newBlockedEmails =
      order.email && !blockedEmails.includes(order.email)
        ? [...blockedEmails, order.email]
        : blockedEmails;

    setBlockedPhones(newBlockedPhones);
    setBlockedEmails(newBlockedEmails);

    await updateStorySection("BLOCKED_CUSTOMERS", {
      phones: newBlockedPhones,
      emails: newBlockedEmails,
    });
    toast.success(`Marked ${order.customer} as a suspect/fake source.`);
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedOrders((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAllOrders = (filtered: AdminOrder[]) => {
    setSelectedOrders((prev) =>
      prev.length === filtered.length ? [] : filtered.map((o) => o.id),
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

  const handleBulkOrderStatus = async (newStatus: string) => {
    try {
      const { failed } = await runInChunks(selectedOrders, (id) =>
        updateAdminOrder(id, { status: newStatus }),
      );
      if (failed > 0) {
        toast.error(`Bulk status update completed with ${failed} failures`);
      } else {
        toast.success(
          `Bulk updated ${selectedOrders.length} orders to ${newStatus}`,
        );
      }
      setSelectedOrders([]);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Bulk status update partially failed");
    }
  };

  const handleBulkOrderDelete = async () => {
    if (!confirm(`Permanently delete ${selectedOrders.length} orders?`)) return;
    try {
      const { failed } = await runInChunks(selectedOrders, deleteAdminOrder);
      if (failed > 0) {
        toast.error(`Bulk delete completed with ${failed} failures`);
      } else {
        toast.success(`Bulk deleted ${selectedOrders.length} orders`);
      }
      setSelectedOrders([]);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error("Bulk delete partially failed");
    }
  };

  const blockedPhonesSet = useMemo(() => new Set(blockedPhones), [blockedPhones]);
  const blockedEmailsSet = useMemo(() => new Set(blockedEmails), [blockedEmails]);

  const isSuspect = (order: AdminOrder & { email?: string }) => {
    const phoneMatch = order.phone && blockedPhonesSet.has(order.phone);
    const emailMatch = order.email && blockedEmailsSet.has(order.email);
    return phoneMatch || emailMatch;
  };

  const getAllStatuses = () => [
    "Placed",
    "Confirmed",
    "Ready",
    "Invoice Printed",
    "Delivered",
    "Payment Received",
    "Payment OnProcess",
    "Payment Failed",
    "Returned",
    "Cancelled",
    "Incomplete",
  ];

  const getUpdateStatuses = () => [
    "Placed",
    "Confirmed",
    "Ready",
    "Delivered",
    "Payment Received",
    "Cancelled",
    "Returned",
    "Payment OnProcess",
    "Payment Failed",
    "Incomplete",
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Placed":
        return "bg-blue-100 text-blue-700";
      case "Confirmed":
        return "bg-green-100 text-green-700";
      case "Invoice Printed":
        return "bg-teal-100 text-teal-700 font-bold border border-teal-200";
      case "Ready":
        return "bg-purple-100 text-purple-700";
      case "Delivered":
        return "bg-emerald-100 text-emerald-700";
      case "Payment Received":
        return "bg-green-600 text-white";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      case "Returned":
        return "bg-rose-100 text-rose-700";
      case "Payment OnProcess":
        return "bg-yellow-100 text-yellow-700";
      case "Payment Failed":
        return "bg-red-50 text-red-600 border border-red-200";
      case "Incomplete":
      case "INCOMPLETE":
        return "bg-slate-200 text-slate-500 border border-slate-300 border-dashed animate-pulse text-xs";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const enrichedOrders = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        isSuspect: isSuspect(order),
        formattedDate: format(new Date(order.date), "MMM d, yyyy h:mm a"),
        statusClass: getStatusColor(order.status),
      })),
    [orders, blockedPhonesSet, blockedEmailsSet],
  );

  const getStatusCountString = (
    statusKey: string,
    aggregateKeys: string[] = [],
  ) => {
    if (aggregateKeys && aggregateKeys.length > 0) {
      let sum = 0;
      aggregateKeys.forEach((k) => (sum += stats?.statusCounts?.[k] || 0));
      return sum;
    }
    return stats?.statusCounts?.[statusKey] || 0;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={() => {}}
      className="space-y-6 relative"
      onClick={() => isFilterOpen && setIsFilterOpen(false)}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            🛍️ Orders
          </h1>
          <p className="text-sm text-slate-500">
            Manage your kitchen flow here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {shopType === "RESTAURANT" && (
            <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setView("table")}
                className={cn(
                  "flex-1 sm:flex-none p-1.5 rounded-md transition-all",
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
                  "flex-1 sm:flex-none p-1.5 rounded-md transition-all",
                  view === "kanban"
                    ? "bg-white shadow-sm text-slate-900"
                    : "text-slate-400",
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search */}
          <form
            className="relative w-full sm:w-auto sm:flex-1 sm:max-w-[260px]"
            onSubmit={(e) => {
              e.preventDefault();
              setFilterSearch(searchInput);
              setPage(1);
            }}
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-9 w-full bg-white text-xs sm:text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>

          {/* Date Filter (React Datepicker) */}
          <div className="relative z-30 w-full sm:w-auto">
            <DatePicker
              selected={dateDate}
              onChange={(date: Date | null) => {
                setDateDate(date || undefined);
                setPage(1);
              }}
              dateFormat="MMM d, yyyy"
              maxDate={getBDDate()}
              placeholderText="Filter by Date"
              className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm w-[240px]"
              popperClassName="admin-datepicker-popper"
              renderCustomHeader={({
                date,
                changeYear,
                changeMonth,
                decreaseMonth,
                increaseMonth,
                prevMonthButtonDisabled,
                nextMonthButtonDisabled,
              }) => {
                const bdNow = getBDDate();
                const currentYear = bdNow.getFullYear();
                const currentMonth = bdNow.getMonth();
                const selectedYear = date.getFullYear();

                const years = Array.from(
                  { length: currentYear - 2024 + 1 },
                  (_, i) => 2024 + i,
                );
                const availableMonths =
                  selectedYear === currentYear
                    ? months.slice(0, currentMonth + 1)
                    : months;

                return (
                  <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100 bg-white rounded-t-lg">
                    <button
                      onClick={decreaseMonth}
                      disabled={prevMonthButtonDisabled}
                      type="button"
                      className="p-1 hover:bg-gray-100 rounded-full text-slate-500 disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4 rotate-90" />
                    </button>
                    <div className="flex gap-2">
                      <Select
                        value={date.getFullYear().toString()}
                        onValueChange={(value) => changeYear(Number(value))}
                      >
                        <SelectTrigger className="h-7 w-[80px] text-xs font-medium border-gray-200 bg-gray-50 hover:bg-gray-100 focus:ring-0">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          className="min-w-[80px] z-[60]"
                        >
                          {years.map((year) => (
                            <SelectItem
                              key={year}
                              value={year.toString()}
                              className="text-xs"
                            >
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={months[date.getMonth()]}
                        onValueChange={(value) =>
                          changeMonth(months.indexOf(value))
                        }
                      >
                        <SelectTrigger className="h-7 w-[100px] text-xs font-medium border-gray-200 bg-gray-50 hover:bg-gray-100 focus:ring-0">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          className="min-w-[100px] z-[60] h-[200px]"
                        >
                          {availableMonths.map((option) => (
                            <SelectItem
                              key={option}
                              value={option}
                              className="text-xs"
                            >
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      onClick={increaseMonth}
                      disabled={
                        nextMonthButtonDisabled ||
                        (selectedYear === currentYear &&
                          date.getMonth() === currentMonth)
                      }
                      type="button"
                      className="p-1 hover:bg-gray-100 rounded-full text-slate-500 disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </button>
                  </div>
                );
              }}
              customInput={
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[240px] justify-start text-left font-normal bg-white",
                    !dateDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateDate ? (
                    format(dateDate, "MMM d, yyyy")
                  ) : (
                    <span>Filter by Date</span>
                  )}
                  {dateDate && (
                    <X
                      className="ml-auto h-4 w-4 text-gray-400 hover:text-gray-600 z-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDateDate(undefined);
                        setPage(1);
                      }}
                    />
                  )}
                </Button>
              }
            >
              <div className="p-2 border-b border-gray-100 flex gap-2 justify-center bg-gray-50/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-white text-slate-600 hover:text-orange-600 hover:border-orange-200"
                  onClick={() => {
                    setDateDate(getBDDate());
                    setPage(1);
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs bg-white text-slate-600 hover:text-orange-600 hover:border-orange-200"
                  onClick={() => {
                    const yesterday = getBDDate();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setDateDate(yesterday);
                    setPage(1);
                  }}
                >
                  Yesterday
                </Button>
              </div>
            </DatePicker>
          </div>

          {/* Source Filter Dropdown */}
          <div className="relative w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                setIsFilterOpen(!isFilterOpen);
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              {filterSource === "all" ? "Source" : filterSource}
              <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
            </Button>

            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-2 w-full sm:w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-gray-50 border-b border-gray-100">
                  Filter by Source
                </div>
                {["all", "WEB", "WHATSAPP", "MANUAL"].map((src) => (
                  <button
                    key={src}
                    onClick={() => {
                      setFilterSource(src);
                      setPage(1);
                      setIsFilterOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center justify-between",
                      filterSource === src && "text-orange-600 font-medium",
                    )}
                  >
                    {src === "all"
                      ? "All Sources"
                      : src === "MANUAL"
                        ? "Manual (Phone)"
                        : src}
                    {filterSource === src && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={() => {
              setIsAdding(true);
              void Promise.all([
                loadProductsForModal(),
                ensureCreateOrderDefaults(),
              ]);
            }}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Create
          </Button>
        </div>
      </div>

      {/* Modals omitted from code rendering text limit overhead but functional */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-md">
          <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
            <Card className="my-auto w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
              <div className="p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800">
                    Create Manual Order
                  </h2>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateOrder} className="space-y-4">
                  <div>
                    <label
                      htmlFor="new-customer"
                      className="text-sm font-medium"
                    >
                      Customer Name
                    </label>
                    <Input
                      id="new-customer"
                      value={newOrder.customer}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, customer: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="new-email" className="text-sm font-medium">
                      Email (Optional)
                    </label>
                    <Input
                      id="new-email"
                      type="email"
                      value={newOrder.email}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="new-phone" className="text-sm font-medium">
                      Phone
                    </label>
                    <Input
                      id="new-phone"
                      value={newOrder.phone}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-address"
                      className="text-sm font-medium"
                    >
                      Delivery Address
                    </label>
                    <Textarea
                      id="new-address"
                      value={newOrder.address}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, address: e.target.value })
                      }
                      required
                      className="mt-1"
                    />
                  </div>

                  <div className="border rounded-md p-3 bg-slate-50">
                    <div className="text-sm font-medium block mb-2">
                      Select Products
                    </div>
                    <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {availableProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            id={`prod-${product.id}`}
                            checked={Boolean(selectedProducts[product.id])}
                            onChange={(e) =>
                              handleProductSelect(product.id, e.target.checked)
                            }
                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                          />
                          <label
                            htmlFor={`prod-${product.id}`}
                            className="text-sm flex-1 cursor-pointer flex justify-between"
                          >
                            <span className="truncate">{product.name}</span>
                            <span className="text-slate-500">
                              ৳{product.price}
                            </span>
                          </label>
                          {selectedProducts[product.id] && (
                            <Input
                              type="number"
                              min="1"
                              value={selectedProducts[product.id]}
                              onChange={(e) =>
                                handleQuantityChange(
                                  product.id,
                                  Number.parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-16"
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          )}
                        </div>
                      ))}
                      {isProductsLoading && (
                        <p className="text-xs text-slate-400">
                          Loading product catalog...
                        </p>
                      )}
                      {!isProductsLoading && availableProducts.length === 0 && (
                        <p className="text-xs text-slate-400">
                          No products available.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="new-coupon"
                        className="text-sm font-medium"
                      >
                        Promo Code
                      </label>
                      <div className="mt-1 flex gap-2">
                        <Input
                          id="new-coupon"
                          value={newOrder.couponCode}
                          onChange={(e) =>
                            setNewOrder({
                              ...newOrder,
                              couponCode: e.target.value.toUpperCase(),
                              discountAmount: 0,
                            })
                          }
                          placeholder="Enter code"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={applyManualCoupon}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="new-delivery"
                        className="text-sm font-medium"
                      >
                        Delivery Charge (৳)
                      </label>
                      <Input
                        id="new-delivery"
                        type="number"
                        min="0"
                        value={newOrder.deliveryCharge}
                        onChange={(e) =>
                          setNewOrder({
                            ...newOrder,
                            deliveryCharge: Math.max(
                              0,
                              Number.parseInt(e.target.value) || 0,
                            ),
                          })
                        }
                        required
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Defaults from Delivery Settings. You can change it
                        manually for this order.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="text-sm font-medium">
                        Subtotal (৳)
                      </label>
                      <Input
                        value={getSubtotal()}
                        readOnly
                        className="bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Discount (৳)
                      </label>
                      <Input
                        value={Math.max(0, newOrder.discountAmount || 0)}
                        readOnly
                        className="bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Total (৳)</label>
                      <Input
                        value={
                          getSubtotal() +
                          Math.max(0, newOrder.deliveryCharge || 0) -
                          Math.max(0, newOrder.discountAmount || 0)
                        }
                        readOnly
                        className="bg-slate-50"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Place Order
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingId && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-md">
          <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
            <Card className="my-auto w-full max-w-md animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
              <div className="p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800">
                    Edit Order {editingId}
                  </h2>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdateOrder} className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-customer"
                      className="text-sm font-medium"
                    >
                      Customer Name
                    </label>
                    <Input
                      id="edit-customer"
                      value={editForm.customer}
                      onChange={(e) =>
                        setEditForm({ ...editForm, customer: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-phone" className="text-sm font-medium">
                      Phone
                    </label>
                    <Input
                      id="edit-phone"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="edit-price"
                        className="text-sm font-medium"
                      >
                        Price (৳)
                      </label>
                      <Input
                        id="edit-price"
                        type="number"
                        min="0"
                        value={editForm.price}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            price: Math.max(
                              0,
                              Number.parseInt(e.target.value) || 0,
                            ),
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-items"
                        className="text-sm font-medium"
                      >
                        Items Qty
                      </label>
                      <Input
                        id="edit-items"
                        type="number"
                        min="1"
                        value={editForm.items}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            items: Math.max(
                              1,
                              Number.parseInt(e.target.value) || 0,
                            ),
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        handleDelete(editingId);
                        setEditingId(null);
                      }}
                    >
                      Delete Order
                    </Button>
                    <Button
                      type="submit"
                      className={
                        hasChanges
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-slate-900 text-white"
                      }
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Today's Orders"
          value={stats?.todayCount?.toString() || "0"}
          subtext={`${stats?.todayCancelled || "0"} canceled today`}
        />
        <SummaryCard
          label="Revenue"
          value={`৳ ${parseFloat(stats?.totalSales || 0).toLocaleString()}`}
          subtext={`Counted sales only (${stats?.salesWindow || "all-time"})`}
        />
        <SummaryCard
          label="Pending Orders"
          value={(
            getStatusCountString("Placed") +
            getStatusCountString("Confirmed") +
            getStatusCountString("Ready") +
            getStatusCountString("Invoice Printed") +
            getStatusCountString("Delivered") +
            getStatusCountString("Payment OnProcess")
          ).toString()}
          subtext="Need attention"
          active
        />
        <SummaryCard
          label="Received Orders"
          value={getStatusCountString("Payment Received").toString()}
          subtext="Real sales"
        />
      </div>

      {/* Main Content with Tabs */}
      {view === "table" || shopType !== "RESTAURANT" ? (
        <Card className="border-none shadow-none bg-transparent">
          <Tabs
            defaultValue="all"
            value={filterStatus}
            className="w-full"
            onValueChange={(v) => {
              setFilterStatus(v);
              setPage(1);
            }}
          >
            <div className="overflow-x-auto pb-2">
              <TabsList className="bg-white p-1 border border-gray-100 h-auto justify-start w-full sm:w-auto inline-flex">
                <TabTrigger
                  value="all"
                  label="All Orders"
                  count={Object.keys(stats?.statusCounts || {}).reduce(
                    (sum, key) =>
                      key !== "INCOMPLETE" &&
                      key !== "Incomplete" &&
                      getAllStatuses().includes(key)
                        ? sum + stats.statusCounts[key]
                        : sum,
                    0,
                  )}
                />
                <TabTrigger
                  value="Placed"
                  label="Placed"
                  count={getStatusCountString("Placed")}
                />
                <TabTrigger
                  value="Confirmed"
                  label="Confirmed"
                  count={getStatusCountString("Confirmed")}
                />
                <TabTrigger
                  value="Ready"
                  label="Ready"
                  count={getStatusCountString("Ready")}
                />
                <TabTrigger
                  value="Invoice Printed"
                  label="Invoice Printed"
                  count={getStatusCountString("Invoice Printed")}
                />
                <TabTrigger
                  value="Delivered"
                  label="Delivered"
                  count={getStatusCountString("Delivered")}
                />
                <TabTrigger
                  value="Payment Received"
                  label="Payment Received"
                  count={getStatusCountString("Payment Received")}
                />
                <TabTrigger
                  value="Cancelled"
                  label="Cancelled"
                  count={getStatusCountString("Cancelled")}
                />
                <TabTrigger
                  value="Returned"
                  label="Returned"
                  count={getStatusCountString("Returned")}
                />
                <TabTrigger
                  value="Payment OnProcess"
                  label="Payment OnProcess"
                  count={getStatusCountString("Payment OnProcess")}
                />
                <TabTrigger
                  value="Payment Failed"
                  label="Payment Failed"
                  count={getStatusCountString("Payment Failed")}
                />
                <TabTrigger
                  value="Incomplete"
                  label="Incomplete"
                  count={
                    getStatusCountString("Incomplete") +
                    getStatusCountString("INCOMPLETE")
                  }
                />
                {/* Repeated cannot be efficiently calculated on the server without heavy groupings continuously. Hidden for now. */}
              </TabsList>
            </div>

            <TabsContent value={filterStatus} className="mt-4">
              <div className="space-y-3 md:hidden">
                {isLoading ? (
                  <div className="rounded-xl border border-slate-100 bg-white p-6 text-center text-slate-500 shadow-sm">
                    Loading orders...
                  </div>
                ) : enrichedOrders.length > 0 ? (
                  enrichedOrders.map((order) => (
                    <Card key={order.id} className="border-gray-100 shadow-sm">
                      <CardContent
                        className="p-4 space-y-4 cursor-pointer"
                        onClick={() => openOrderDetails(order)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 break-all">
                                {order.id}
                              </span>
                              {order.isSuspect && (
                                <Badge className="bg-red-100 text-red-700 border-red-200">
                                  Suspect
                                </Badge>
                              )}
                              {order.isRepeat && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-600 border-blue-200 gap-1 h-5 px-1.5"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span className="text-[10px]">
                                    {order.orderCount}x
                                  </span>
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {order.formattedDate}
                            </p>
                          </div>
                          <Badge
                            className={cn("font-normal", order.statusClass)}
                          >
                            {order.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">
                              Customer
                            </div>
                            <div className="font-medium text-slate-900 break-words">
                              {order.customer}
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.phone}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">
                              Source
                            </div>
                            <Badge
                              variant="secondary"
                              className="mt-1 bg-slate-800 text-white hover:bg-slate-700"
                            >
                              {order.source === "WHATSAPP" && (
                                <MessageCircle className="w-3 h-3 mr-1" />
                              )}
                              {order.source}
                            </Badge>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">
                              Items
                            </div>
                            <div className="font-medium text-slate-900">
                              {order.items}
                            </div>
                          </div>
                          <div>
                            <div className="text-[11px] uppercase tracking-wide text-slate-400">
                              Price
                            </div>
                            <div className="font-bold text-slate-900">
                              ৳{order.price}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(order);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            disabled={
                              order.status !== "Ready" &&
                              order.status !== "Invoice Printed"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrint(order);
                            }}
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            {order.stockDeducted ? "Printed" : "Invoice"}
                          </Button>

                          <Select
                            value={order.status}
                            onValueChange={(status) =>
                              handleStatusChange(order.id, status)
                            }
                          >
                            <SelectTrigger
                              className="w-full text-xs sm:text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue placeholder="Update Status" />
                            </SelectTrigger>
                            <SelectContent onClick={(e) => e.stopPropagation()}>
                              {getUpdateStatuses().map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsFake(order);
                            }}
                          >
                            <Ban className="w-4 h-4 mr-2" /> Fake
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(order.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-slate-500 shadow-sm">
                    No orders found matching your filters.
                  </div>
                )}
              </div>
              <div className="overflow-x-auto pb-4 rounded-lg border border-gray-100 bg-white shadow-sm custom-table-scrollbar">
                <table className="hidden md:table w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-gray-50 text-slate-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="p-4 w-10">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          checked={
                            orders.length > 0 &&
                            selectedOrders.length === orders.length
                          }
                          onChange={() => toggleSelectAllOrders(orders)}
                        />
                      </th>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Items</th>
                      <th className="p-4">Source</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-8 text-center text-slate-500 animate-pulse"
                        >
                          Loading orders...
                        </td>
                      </tr>
                    ) : enrichedOrders.length > 0 ? (
                      enrichedOrders.map((order) => (
                        <tr
                          key={order.id}
                          className={cn(
                            "hover:bg-gray-50/50 cursor-pointer",
                            order.isSuspect && "bg-red-50/30",
                            selectedOrders.includes(order.id) &&
                              "bg-orange-50/50",
                          )}
                          onClick={() => openOrderDetails(order)}
                        >
                          <td className="p-4 w-10">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                              checked={selectedOrders.includes(order.id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleOrderSelection(order.id)}
                            />
                          </td>
                          <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                            {order.id}
                            {order.isSuspect && (
                              <div className="group relative">
                                <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse cursor-help" />
                                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-red-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                  Suspect: Blocked Customer
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-slate-500">
                            {order.formattedDate}
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              {order.customer}
                              {order.isRepeat && (
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-600 border-blue-200 gap-1 h-5 px-1.5"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span className="text-[10px]">
                                    {order.orderCount}x
                                  </span>
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {order.phone}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="inline-flex min-w-[54px] items-center justify-center rounded bg-slate-50 px-2 py-1 font-medium">
                              {order.items}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="secondary"
                              className="bg-slate-800 text-white hover:bg-slate-700"
                            >
                              {order.source === "WHATSAPP" && (
                                <MessageCircle className="w-3 h-3 mr-1" />
                              )}
                              {order.source}
                            </Badge>
                          </td>
                          <td className="p-4 font-bold text-slate-800">
                            ৳{order.price}
                          </td>
                          <td className="p-4">
                            <Badge className={cn("font-normal", order.statusClass)}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[200px]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    disabled={
                                      order.status !== "Ready" &&
                                      order.status !== "Invoice Printed"
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrint(order);
                                    }}
                                    className={cn(
                                      order.stockDeducted && "text-green-600",
                                    )}
                                  >
                                    <Printer className="w-4 h-4 mr-2" />
                                    {order.stockDeducted
                                      ? "Invoice Printed"
                                      : "Print Invoice"}
                                  </DropdownMenuItem>

                                  <DropdownMenuSub>
                                    <DropdownMenuSubTrigger
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Check className="w-4 h-4 mr-2" /> Update
                                      Status
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent
                                      className="w-[200px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {getUpdateStatuses().map((status) => (
                                        <DropdownMenuItem
                                          key={status}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(
                                              order.id,
                                              status,
                                            );
                                          }}
                                        >
                                          {status}
                                          {order.status === status && (
                                            <Check className="w-3 h-3 ml-auto text-orange-600" />
                                          )}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuSubContent>
                                  </DropdownMenuSub>

                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(order);
                                    }}
                                  >
                                    <Edit className="w-4 h-4 mr-2" /> Edit Order
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsFake(order);
                                    }}
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <Ban className="w-4 h-4 mr-2" /> Mark as
                                    Fake
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteId(order.id);
                                    }}
                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    Order
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="p-8 text-center text-slate-500"
                        >
                          No orders found matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-center md:justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg shadow-sm">
                <div className="md:hidden text-xs text-slate-500">
                  Page {page} of {Math.max(1, Math.ceil(totalOrders / limit))}
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {orders.length > 0 ? (page - 1) * limit + 1 : 0}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(page * limit, totalOrders)}
                      </span>{" "}
                      of <span className="font-medium">{totalOrders}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                      aria-label="Pagination"
                    >
                      <Button
                        variant="outline"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 border border-gray-300">
                        Page {page} of{" "}
                        {Math.max(1, Math.ceil(totalOrders / limit))}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setPage(
                            Math.min(Math.ceil(totalOrders / limit), page + 1),
                          )
                        }
                        disabled={
                          page >= Math.ceil(totalOrders / limit) ||
                          totalOrders === 0
                        }
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 hover:bg-gray-50 focus:z-20"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      ) : (
        <FulfillmentBoard
          orders={orders} // Passes the 50 elements from the paginated query
          onStatusChange={handleStatusChange}
          onPrint={handlePrint}
          onEdit={handleEditClick}
          onMarkAsFake={handleMarkAsFake}
          onDelete={setDeleteId}
          readOnly={!canManageOrders}
        />
      )}

      <OrderDetailsModal
        selectedOrderId={selectedOrderId}
        selectedOrderDetails={selectedOrderDetails}
        isDetailsLoading={isDetailsLoading}
        closeOrderDetails={closeOrderDetails}
        getStatusColor={getStatusColor}
        handleEditFromDetails={handleEditFromDetails}
      />

      {/* Modals Footer */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              order from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Bar */}
      {selectedOrders.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="bg-slate-900 border-slate-800 shadow-2xl px-6 py-4 flex items-center gap-6">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
              <div className="bg-orange-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {selectedOrders.length}
              </div>
              <div className="text-sm font-medium text-white">Selected</div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => setSelectedOrders([])}
              >
                <X className="w-4 h-4 mr-2" /> Deselect
              </Button>

              <div className="h-6 w-px bg-slate-700 mx-2" />

              <Select onValueChange={handleBulkOrderStatus}>
                <SelectTrigger className="h-9 w-[160px] bg-slate-800 border-slate-700 text-white text-xs">
                  <Check className="w-4 h-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                  {getAllStatuses().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="destructive"
                size="sm"
                className="h-9 bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600 hover:text-white"
                onClick={handleBulkOrderDelete}
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

function SummaryCard({
  label,
  value,
  subtext,
  active,
}: {
  label: string;
  value: string;
  subtext?: string;
  active?: boolean;
}) {
  return (
    <Card
      className={cn(
        "border-none shadow-sm",
        active ? "bg-orange-600 text-white" : "bg-white",
      )}
    >
      <CardContent className="p-6">
        <div
          className={cn(
            "text-xs font-medium uppercase tracking-wider mb-1",
            active ? "text-orange-100" : "text-slate-500",
          )}
        >
          {label}
        </div>
        <div className="text-3xl font-bold mb-1 tracking-tight">{value}</div>
        {subtext && (
          <div
            className={cn(
              "text-xs font-medium",
              active ? "text-orange-200" : "text-slate-400",
            )}
          >
            {subtext}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TabTrigger({
  value,
  label,
  count,
}: {
  value: string;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:border-orange-200",
        "border border-transparent hover:bg-gray-50 flex items-center justify-between text-xs sm:text-sm px-3 py-1.5 h-auto rounded-md min-w-[120px]",
      )}
    >
      <span className="mr-2 whitespace-nowrap">{label}</span>
      <Badge
        variant="secondary"
        className="bg-white group-data-[state=active]:bg-orange-100 group-data-[state=active]:text-orange-700 ml-1 text-[10px] px-1.5 py-0 h-4 border-gray-100 font-mono"
      >
        {count}
      </Badge>
    </TabsTrigger>
  );
}
