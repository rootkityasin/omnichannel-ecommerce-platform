'use client';

import { Search, Filter, Plus, Edit, ExternalLink, MessageCircle, LayoutGrid, List, Check, X, Clock, Truck, ChefHat, ChevronDown, Package, CheckCircle, AlertOctagon, RotateCcw, CreditCard, Ban, Calendar as CalendarIcon, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "@/app/styles/datepicker.css";
import { cn } from '@/lib/utils';
import { FulfillmentBoard } from '@/components/admin/FulfillmentBoard';
import { useAdmin } from '@/components/providers/AdminProvider';
import { format } from "date-fns"
import { getSiteConfig } from '@/app/actions/settings';
import { getAdminOrders, createOrder as createOrderAction, printOrderInvoice } from '@/app/actions/order';
import { getProducts } from '@/app/actions/product';
import { getStorySections, updateStorySection } from '@/app/actions/story';
import { toast } from 'sonner';

import { useSession } from 'next-auth/react';

export default function OrdersPage() {
    // Global State
    const { orders, addOrder, updateOrder, deleteOrder, setOrders } = useAdmin();
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;
    const userPermissions = (session?.user as any)?.permissions || [];

    const canManageOrders = userRole === 'SUPER_ADMIN' || userRole === 'TENANT_ADMIN' || userPermissions.includes('MANAGE_ORDERS');

    const [shopType, setShopType] = useState('RESTAURANT');
    const [blockedPhones, setBlockedPhones] = useState<string[]>([]);
    const [blockedEmails, setBlockedEmails] = useState<string[]>([]);

    // Product Selection State
    const [availableProducts, setAvailableProducts] = useState<any[]>([]);
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    useEffect(() => {
        getSiteConfig().then(config => {
            if (config?.shopType) setShopType(config.shopType);
        });

        // Load Products
        getProducts().then(prods => setAvailableProducts(prods));

        // Load Blacklist
        getStorySections().then(sections => {
            const blockedSection = sections.find((s: any) => s.type === 'BLOCKED_CUSTOMERS');
            if (blockedSection?.content) {
                const content = blockedSection.content as any;
                if (Array.isArray(content.phones)) setBlockedPhones(content.phones);
                if (Array.isArray(content.emails)) setBlockedEmails(content.emails);
            }
        });
    }, []);
    // Helper for BD Time
    const getBDDate = () => {
        const now = new Date();
        const bdTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
        return bdTime;
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const [view, setView] = useState<'table' | 'kanban'>('table');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterSource, setFilterSource] = useState('all');
    const [date, setDate] = useState<Date | undefined>(undefined); // Date Filter State (Date Object)

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Edit Order State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ customer: '', phone: '', price: 0, items: 1 });
    const [originalEditForm, setOriginalEditForm] = useState<any>(null); // Track original for changes

    const hasChanges = editingId && originalEditForm && JSON.stringify(editForm) !== JSON.stringify(originalEditForm);

    // Add Order Form
    const [newOrder, setNewOrder] = useState({ customer: '', phone: '', price: 0, items: 1 });

    // ...

    const filteredOrders = orders.filter(o => {
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'repeated' ? o.isRepeat : o.status.toLowerCase() === filterStatus.toLowerCase());
        const matchesSource = filterSource === 'all' || o.source === filterSource;

        // Date Logic (Compare Date Objects)
        let matchesDate = true;
        if (date) {
            const orderDateObj = new Date(o.date);
            // Normalize both dates to YYYY-MM-DD for comparison (ignoring time)
            const orderStr = orderDateObj.toDateString();
            const filterStr = date.toDateString();
            matchesDate = orderStr === filterStr;
        }

        return matchesStatus && matchesSource && matchesDate;
    });

    // ...



    const handleStatusChange = (id: string, newStatus: string) => {
        updateOrder(id, { status: newStatus });
    };

    const handleProductSelect = (productId: string, checked: boolean) => {
        let newSelected = [...selectedProductIds];
        if (checked) {
            newSelected.push(productId);
        } else {
            newSelected = newSelected.filter(id => id !== productId);
        }
        setSelectedProductIds(newSelected);

        // Auto Price Calculation
        const total = newSelected.reduce((sum, id) => {
            const p = availableProducts.find(prod => prod.id === id);
            return sum + (p ? p.price : 0);
        }, 0);

        setNewOrder(prev => ({ ...prev, price: total, items: newSelected.length || 1 }));
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(newOrder.phone)) {
            toast.error("Invalid phone number. Format: 01XXXXXXXXX");
            return;
        }

        if (selectedProductIds.length === 0) {
            toast.error("Please select at least one product");
            return;
        }

        if (newOrder.price <= 0 || newOrder.items <= 0) {
            toast.error("Price and quantity must be greater than 0");
            return;
        }

        // Construct items from selection
        const orderItems = selectedProductIds.map(id => {
            const p = availableProducts.find(prod => prod.id === id);
            return {
                productId: id,
                quantity: 1, // Default to 1 per selected item
                price: p?.price || 0
            }
        });

        const res = await createOrderAction({
            customerName: newOrder.customer,
            customerPhone: newOrder.phone,
            customerAddress: "Manual Order (No Address)",
            totalAmount: newOrder.price,
            items: orderItems,
            source: 'MANUAL'
        });

        if (res.success) {
            toast.success("Order created successfully");
            // Refresh orders from DB
            const dbOrders = await getAdminOrders();
            setOrders(dbOrders);
            setIsAdding(false);
            setNewOrder({ customer: '', phone: '', price: 0, items: 1 });
            setSelectedProductIds([]); // Reset selection
        } else {
            toast.error(res.error || "Failed to create order");
        }
    };

    const handleEditClick = (order: any) => {
        setEditingId(order.id);
        const form = {
            customer: order.customer,
            phone: order.phone,
            price: order.price,
            items: order.items
        };
        setEditForm(form);
        setOriginalEditForm(form);
    };

    const handleUpdateOrder = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(editForm.phone)) {
            toast.error("Invalid phone number. Format: 01XXXXXXXXX");
            return;
        }

        if (editForm.price <= 0 || editForm.items <= 0) {
            toast.error("Price and quantity must be greater than 0");
            return;
        }

        updateOrder(editingId!, editForm);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete Order?')) {
            deleteOrder(id);
        }
    }

    const handlePrint = async (order: any) => {
        // Optimistic UI or wait? Let's wait to ensure stock is deducted.
        const res = await printOrderInvoice(order.id); // Uses orderId (e.g. ORD-123)
        if (res.success) {
            toast.success("Invoice Printed & Stock Deducted");
            // Refresh local state to show "Invoice Printed" status
            const dbOrders = await getAdminOrders();
            setOrders(dbOrders);
            // Open Print Window
            window.open(`/admin/orders/print/${order.id}`, '_blank');
        } else {
            toast.error(res.error || "Failed to print invoice");
        }
    };

    const handleMarkAsFake = async (order: any) => {
        if (!confirm(`Mark order #${order.id} as Fake? This will flag future orders from ${order.phone} and ${order.email || 'this email'}.`)) return;

        const newBlockedPhones = order.phone && !blockedPhones.includes(order.phone)
            ? [...blockedPhones, order.phone]
            : blockedPhones;

        const newBlockedEmails = order.email && !blockedEmails.includes(order.email)
            ? [...blockedEmails, order.email]
            : blockedEmails;

        setBlockedPhones(newBlockedPhones);
        setBlockedEmails(newBlockedEmails);

        // Update DB
        await updateStorySection('BLOCKED_CUSTOMERS', {
            phones: newBlockedPhones,
            emails: newBlockedEmails
        });
        toast.success(`Marked ${order.customer} as a suspect/fake source.`);
    };

    const isSuspect = (order: any) => {
        const phoneMatch = order.phone && blockedPhones.includes(order.phone);
        const emailMatch = order.email && blockedEmails.includes(order.email);
        return phoneMatch || emailMatch;
    };

    const getAllStatuses = () => [
        "Placed", "Confirmed", "Ready to Process", "Ready To Fry", "Processing", "Ready", "Shipped", "Delivered", "Completed", "Cancelled", "Returned", "Payment OnProcess", "Payment Failed"
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Placed': return "bg-blue-100 text-blue-700";
            case 'Confirmed': return "bg-green-100 text-green-700";
            case 'Invoice Printed': return "bg-teal-100 text-teal-700 font-bold border border-teal-200"; // Highlighted
            case 'Ready to Process': return "bg-indigo-100 text-indigo-700";
            case 'Ready To Fry': return "bg-orange-100 text-orange-700";
            case 'Processing': return "bg-orange-100 text-orange-700";
            case 'Ready': return "bg-purple-100 text-purple-700";
            case 'Shipped': return "bg-slate-800 text-white"; // Highlight dispatched
            case 'Delivered': return "bg-emerald-100 text-emerald-700";
            case 'Completed': return "bg-slate-100 text-slate-700";
            case 'Cancelled': return "bg-red-100 text-red-700";
            case 'Returned': return "bg-rose-100 text-rose-700";
            case 'Payment OnProcess': return "bg-yellow-100 text-yellow-700";
            case 'Payment Failed': return "bg-red-50 text-red-600 border border-red-200";
            default: return "bg-gray-100 text-gray-700";
        }
    }

    return (
        <div className="space-y-6 relative" onClick={() => isFilterOpen && setIsFilterOpen(false)}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">🛍️ Orders</h1>
                    <p className="text-sm text-slate-500">Manage your kitchen flow here.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {shopType === 'RESTAURANT' && (
                        <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
                            <button
                                onClick={() => setView('table')}
                                className={cn("p-1.5 rounded-md transition-all", view === 'table' ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setView('kanban')}
                                className={cn("p-1.5 rounded-md transition-all", view === 'kanban' ? "bg-white shadow-sm text-slate-900" : "text-slate-400")}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input type="search" placeholder="Search orders..." className="pl-9 w-[180px] sm:w-[250px] bg-white text-xs sm:text-sm" />
                    </div>

                    {/* Date Filter (Modern Shadcn) */}
                    {/* Date Filter (React Datepicker) */}
                    <div className="relative z-50">
                        <DatePicker
                            selected={date}
                            onChange={(date: Date | null) => setDate(date || undefined)}
                            dateFormat="MMM d, yyyy"
                            maxDate={getBDDate()} // Disable future dates based on BD Time
                            placeholderText="Filter by Date"
                            className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm w-[240px]"
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

                                // Generate years from 2024 up to current year
                                const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

                                // Filter months: if current year selected, show only up to current month (inclusive)
                                const availableMonths = selectedYear === currentYear
                                    ? months.slice(0, currentMonth + 1)
                                    : months;

                                return (
                                    <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100 bg-white rounded-t-lg">
                                        <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button" className="p-1 hover:bg-gray-100 rounded-full text-slate-500 disabled:opacity-30">
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
                                                <SelectContent position="popper" className="min-w-[80px] z-[60]">
                                                    {years.map((year) => (
                                                        <SelectItem key={year} value={year.toString()} className="text-xs">
                                                            {year}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Select
                                                value={months[date.getMonth()]}
                                                onValueChange={(value) => changeMonth(months.indexOf(value))}
                                            >
                                                <SelectTrigger className="h-7 w-[100px] text-xs font-medium border-gray-200 bg-gray-50 hover:bg-gray-100 focus:ring-0">
                                                    <SelectValue placeholder="Month" />
                                                </SelectTrigger>
                                                <SelectContent position="popper" className="min-w-[100px] z-[60] h-[200px]">
                                                    {availableMonths.map((option) => (
                                                        <SelectItem key={option} value={option} className="text-xs">
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <button
                                            onClick={increaseMonth}
                                            // Disable next button if we are in current month of current year (future prevention)
                                            disabled={nextMonthButtonDisabled || (selectedYear === currentYear && date.getMonth() === currentMonth)}
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
                                        "w-[240px] justify-start text-left font-normal bg-white",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "MMM d, yyyy") : <span>Filter by Date</span>}
                                    {date && (
                                        <X
                                            className="ml-auto h-4 w-4 text-gray-400 hover:text-gray-600 z-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDate(undefined);
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
                                    onClick={() => setDate(getBDDate())}
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
                                        setDate(yesterday);
                                    }}
                                >
                                    Yesterday
                                </Button>
                            </div>
                        </DatePicker>
                    </div>

                    {/* Source Filter Dropdown */}
                    <div className="relative">
                        <Button variant="outline" onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}>
                            <Filter className="w-4 h-4 mr-2" />
                            {filterSource === 'all' ? 'Source' : filterSource}
                            <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                        </Button>

                        {isFilterOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95">
                                <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-gray-50 border-b border-gray-100">Filter by Source</div>
                                <button onClick={() => setFilterSource('all')} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center justify-between", filterSource === 'all' && "text-orange-600 font-medium")}>
                                    All Sources {filterSource === 'all' && <Check className="w-3 h-3" />}
                                </button>
                                <button onClick={() => setFilterSource('WEB')} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center justify-between", filterSource === 'WEB' && "text-orange-600 font-medium")}>
                                    Web Orders {filterSource === 'WEB' && <Check className="w-3 h-3" />}
                                </button>
                                <button onClick={() => setFilterSource('WHATSAPP')} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center justify-between", filterSource === 'WHATSAPP' && "text-orange-600 font-medium")}>
                                    WhatsApp {filterSource === 'WHATSAPP' && <Check className="w-3 h-3" />}
                                </button>
                                <button onClick={() => setFilterSource('MANUAL')} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-orange-50 flex items-center justify-between", filterSource === 'MANUAL' && "text-orange-600 font-medium")}>
                                    Manual (Phone) {filterSource === 'MANUAL' && <Check className="w-3 h-3" />}
                                </button>
                            </div>
                        )}
                    </div>

                    {canManageOrders && (
                        <Button onClick={() => setIsAdding(true)} className="bg-orange-600 hover:bg-orange-700 text-white"><Plus className="w-4 h-4 mr-2" /> Create</Button>
                    )}
                </div>
            </div>

            {/* Add Order Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800">Create Manual Order</h2>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreateOrder} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Customer Name</label>
                                    <Input value={newOrder.customer} onChange={e => setNewOrder({ ...newOrder, customer: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Phone</label>
                                    <Input value={newOrder.phone} onChange={e => setNewOrder({ ...newOrder, phone: e.target.value })} required />
                                </div>

                                {/* Product Selection */}
                                <div className="border rounded-md p-3 bg-slate-50">
                                    <label className="text-sm font-medium block mb-2">Select Products</label>
                                    <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {availableProducts.map(product => (
                                            <div key={product.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`prod-${product.id}`}
                                                    checked={selectedProductIds.includes(product.id)}
                                                    onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                                                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                                />
                                                <label htmlFor={`prod-${product.id}`} className="text-sm flex-1 cursor-pointer flex justify-between">
                                                    <span className="truncate">{product.name}</span>
                                                    <span className="text-slate-500">৳{product.price}</span>
                                                </label>
                                            </div>
                                        ))}
                                        {availableProducts.length === 0 && <p className="text-xs text-slate-400">Loading products...</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Price (৳)</label>
                                        <Input type="number" min="0" value={newOrder.price} onChange={e => setNewOrder({ ...newOrder, price: Math.max(0, parseInt(e.target.value) || 0) })} required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Items Qty</label>
                                        <Input type="number" min="1" value={newOrder.items} onChange={e => setNewOrder({ ...newOrder, items: Math.max(1, parseInt(e.target.value) || 0) })} required />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white">Place Order</Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Order Modal */}
            {editingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800">Edit Order {editingId}</h2>
                                <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleUpdateOrder} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Customer Name</label>
                                    <Input value={editForm.customer} onChange={e => setEditForm({ ...editForm, customer: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Phone</label>
                                    <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Price (৳)</label>
                                        <Input type="number" min="0" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Math.max(0, parseInt(e.target.value) || 0) })} required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Items Qty</label>
                                        <Input type="number" min="1" value={editForm.items} onChange={e => setEditForm({ ...editForm, items: Math.max(1, parseInt(e.target.value) || 0) })} required />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button type="button" variant="destructive" onClick={() => { handleDelete(editingId!); setEditingId(null); }}>Delete Order</Button>
                                    <Button
                                        type="submit"
                                        className={hasChanges
                                            ? "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                                            : "bg-slate-900 hover:bg-orange-600 text-white shadow-sm hover:shadow-xl transition-all duration-500 tracking-wide"
                                        }
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <SummaryCard label="Today's Orders" value={orders.length.toString()} subtext={`${orders.filter((o: any) => o.status === 'Cancelled').length} canceled`} />
                <SummaryCard label="Total Amount" value={`৳ ${orders.reduce((acc: number, o: any) => acc + o.price, 0).toLocaleString()}`} subtext="Total Sales" />
                <SummaryCard label="Pending Processing" value={orders.filter((o: any) => o.status === 'Processing' || o.status === 'Placed').length.toString()} subtext="Need attention" active />
                <SummaryCard label="Dispatched" value={orders.filter((o: any) => o.status === 'Shipped').length.toString()} subtext="On the way" />
            </div>

            {/* Main Content with Tabs */}
            {view === 'table' ? (
                <Card className="border-none shadow-none bg-transparent">
                    <Tabs defaultValue="all" className="w-full" onValueChange={setFilterStatus}>
                        <div className="overflow-x-auto pb-2">
                            <TabsList className="bg-white p-1 border border-gray-100 h-auto justify-start w-full sm:w-auto inline-flex">
                                <TabTrigger value="all" label="All Orders" count={orders.length} />
                                <TabTrigger value="placed" label="Placed" count={orders.filter(o => o.status === 'Placed').length} />
                                <TabTrigger value="confirmed" label="Confirmed" count={orders.filter(o => o.status === 'Confirmed').length} />
                                <TabTrigger value="processing" label="Processing" count={orders.filter(o => o.status === 'Processing').length} />
                                <TabTrigger value="ready" label="Ready" count={orders.filter(o => o.status === 'Ready').length} />
                                <TabTrigger value="shipped" label="Shipped" count={orders.filter(o => o.status === 'Shipped').length} />
                                <TabTrigger value="delivered" label="Delivered" count={orders.filter(o => o.status === 'Delivered').length} />
                                <TabTrigger value="completed" label="Completed" count={orders.filter(o => o.status === 'Completed').length} />
                                <TabTrigger value="cancelled" label="Cancelled" count={orders.filter(o => o.status === 'Cancelled').length} />
                                <TabTrigger value="returned" label="Returned" count={orders.filter(o => o.status === 'Returned').length} />
                                <TabTrigger value="payment onprocess" label="Payment OnProcess" count={orders.filter(o => o.status === 'Payment OnProcess').length} />
                                <TabTrigger value="payment failed" label="Payment Failed" count={orders.filter(o => o.status === 'Payment Failed').length} />
                                <TabTrigger value="repeated" label="Repeated Customers" count={orders.filter(o => o.isRepeat).length} />
                            </TabsList>
                        </div>

                        <TabsContent value={filterStatus} className="mt-4">
                            <div className="overflow-x-auto pb-4 rounded-lg border border-gray-100 bg-white shadow-sm custom-table-scrollbar">
                                <table className="w-full text-sm text-left min-w-[800px]">
                                    <thead className="bg-gray-50 text-slate-500 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="p-4 w-4"><input type="checkbox" /></th>
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
                                        {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                            <tr key={order.id} className={cn("hover:bg-gray-50/50", isSuspect(order) && "bg-red-50/30")}>
                                                <td className="p-4"><input type="checkbox" /></td>
                                                <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                                                    {order.id}
                                                    {isSuspect(order) && (
                                                        <div className="group relative">
                                                            <AlertOctagon className="w-4 h-4 text-red-500 animate-pulse cursor-help" />
                                                            <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-red-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                                Suspect: Blocked Customer
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-slate-500">{order.date}</td>
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-900 flex items-center gap-2">
                                                        {order.customer}
                                                        {order.isRepeat && (
                                                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 gap-1 h-5 px-1.5">
                                                                <RotateCcw className="w-3 h-3" />
                                                                <span className="text-[10px]">{order.orderCount}x</span>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500">{order.phone}</div>
                                                </td>
                                                <td className="p-4 text-center font-medium bg-slate-50 rounded mx-auto w-fit">{order.items}</td>
                                                <td className="p-4">
                                                    <Badge variant="secondary" className="bg-slate-800 text-white hover:bg-slate-700">
                                                        {order.source === 'WHATSAPP' && <MessageCircle className="w-3 h-3 mr-1" />}
                                                        {order.source}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 font-bold text-slate-800">৳{order.price}</td>
                                                <td className="p-4">
                                                    <Badge className={cn("font-normal", getStatusColor(order.status))}>
                                                        {order.status}
                                                    </Badge>
                                                </td>

                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className={cn(
                                                                "h-8 w-8",
                                                                order.stockDeducted ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-100 hover:bg-gray-200",
                                                                (order.status !== 'Ready' && order.status !== 'Invoice Printed') && "opacity-30 cursor-not-allowed"
                                                            )}
                                                            onClick={() => (order.status === 'Ready' || order.status === 'Invoice Printed') && handlePrint(order)}
                                                            title={order.status === 'Ready' || order.status === 'Invoice Printed' ? "Print Invoice & Deduct Stock" : "Only available in Ready status"}
                                                            disabled={order.status !== 'Ready' && order.status !== 'Invoice Printed'}
                                                        >
                                                            <Printer className="w-4 h-4" />
                                                        </Button>

                                                        {canManageOrders && (
                                                            <>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="outline" size="sm" className="h-8">Status <ChevronDown className="w-3 h-3 ml-1" /></Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-[200px]">
                                                                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                                        <DropdownMenuSeparator />
                                                                        {getAllStatuses().map(status => (
                                                                            <DropdownMenuItem key={status} onClick={() => handleStatusChange(order.id, status)}>
                                                                                {status} {order.status === status && <Check className="w-3 h-3 ml-auto" />}
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem onClick={() => handleMarkAsFake(order)} className="text-red-600 focus:text-red-700 bg-red-50 focus:bg-red-100 mt-2">
                                                                            <Ban className="w-3 h-3 mr-2" /> Mark as Fake
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>

                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 bg-blue-50" onClick={() => handleEditClick(order)}>
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={9} className="p-8 text-center text-slate-500">
                                                    No orders found matching your filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card >
            ) : (
                <FulfillmentBoard orders={filteredOrders} onStatusChange={handleStatusChange} readOnly={!canManageOrders} />
            )
            }
        </div >
    );
}

function SummaryCard({ label, value, subtext, active }: { label: string, value: string, subtext?: string, active?: boolean }) {
    return (
        <Card className={cn("border-none shadow-sm", active ? "bg-orange-600 text-white" : "bg-white")}>
            <CardContent className="p-6">
                <div className={cn("text-xs font-medium uppercase tracking-wider mb-1", active ? "text-orange-100" : "text-slate-500")}>{label}</div>
                <div className="text-2xl font-bold mb-1">{value}</div>
                {subtext && <div className={cn("text-xs", active ? "text-orange-200" : "text-green-600")}>{subtext}</div>}
            </CardContent>
        </Card>
    )
}

function TabTrigger({ value, label, count }: { value: string, label: string, count?: number }) {
    return (
        <TabsTrigger value={value} className="data-[state=active]:bg-orange-600 data-[state=active]:text-white rounded-md px-4 py-2 h-9 mx-1 text-slate-600 whitespace-nowrap">
            {label}
            {count !== undefined && <span className="ml-2 text-[10px] bg-black/10 px-1.5 rounded-full">{count}</span>}
        </TabsTrigger>
    )
}
