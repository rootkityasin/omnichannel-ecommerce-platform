"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Plus,
  X,
  Phone,
  Mail,
  Edit,
  Trash2,
  Download,
  Upload,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  bulkImportCustomers,
  createCustomer,
  updateCustomer,
  deleteUser,
  getCurrentUserRole,
} from "@/app/actions/user";
import { fetchCustomerDatasets } from "./actions";
import { toast } from "sonner";
import readXlsxFile from "read-excel-file";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";

type CustomerRow = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  orders: number;
  spent: number;
  points: number;
  createdAt: string | Date;
  isGuest?: boolean;
};

type CustomerImportRow = { name: string; phone: string; email?: string };

const NAME_HEADERS = new Set([
  "name",
  "full name",
  "customer name",
  "full_name",
  "customer_name",
  "customer",
  "names",
]);
const PHONE_HEADERS = new Set([
  "phone",
  "mobile",
  "contact",
  "phone number",
  "phone_number",
  "mobile number",
  "mobile_number",
  "contact_number",
  "phone_no",
  "mobile_no",
  "contact no",
  "contact_no",
]);
const EMAIL_HEADERS = new Set([
  "email",
  "email address",
  "mail",
  "email_address",
]);

const toSafeString = (value: unknown) => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return "";
};

const mapCustomerRow = (u: {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  orders?: number | null;
  spent?: number | null;
  points?: number | null;
  createdAt: string | Date;
}): CustomerRow => ({
  id: u.id,
  name: u.name,
  email: u.email ?? undefined,
  phone: u.phone || "N/A",
  orders: u.orders || 0,
  spent: u.spent || 0,
  points: u.points || 0,
  createdAt: u.createdAt,
  isGuest: (u as any).isGuest || false,
});

const normalizeBdPhone = (phone: string) => {
  let cleanPhone = phone.replaceAll(/\D/g, "");

  if (cleanPhone.startsWith("880")) cleanPhone = cleanPhone.substring(3);
  if (cleanPhone.startsWith("0")) cleanPhone = cleanPhone.substring(1);

  return cleanPhone.length === 10 ? `+880${cleanPhone}` : null;
};

const getHeaderIndices = (data: unknown[][]) => {
  for (let rowIndex = 0; rowIndex < Math.min(data.length, 15); rowIndex++) {
    const row = data[rowIndex];
    if (!Array.isArray(row)) continue;

    const headers = row.map((cell) => toSafeString(cell).toLowerCase());
    const nameIdx = headers.findIndex((header) => NAME_HEADERS.has(header));
    const phoneIdx = headers.findIndex((header) => PHONE_HEADERS.has(header));
    const emailIdx = headers.findIndex((header) => EMAIL_HEADERS.has(header));

    if (nameIdx > -1 && phoneIdx > -1) {
      return { headerIdx: rowIndex, nameIdx, phoneIdx, emailIdx };
    }
  }

  return null;
};

const parseSheetRows = (
  data: unknown[][],
  indices: {
    headerIdx: number;
    nameIdx: number;
    phoneIdx: number;
    emailIdx: number;
  },
) => {
  const parsed: CustomerImportRow[] = [];

  for (let i = indices.headerIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;

    const name = toSafeString(row[indices.nameIdx]);
    if (!name) continue;

    const rawPhone = toSafeString(row[indices.phoneIdx]);
    const normalizedPhone = normalizeBdPhone(rawPhone);
    if (!normalizedPhone) continue;

    const email =
      indices.emailIdx > -1 ? toSafeString(row[indices.emailIdx]) : "";

    parsed.push({
      name,
      phone: normalizedPhone,
      ...(email ? { email } : {}),
    });
  }

  return parsed;
};

const hydrateCustomerDatasets = (data: {
  customers: Array<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    orders?: number | null;
    spent?: number | null;
    points?: number | null;
    createdAt: string | Date;
    isGuest?: boolean;
  }>;
  accountCreatedUsers: Array<{
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    orders?: number | null;
    spent?: number | null;
    points?: number | null;
    createdAt: string | Date;
    isGuest?: boolean;
  }>;
}) => ({
  customers: data.customers.map(mapCustomerRow),
  accountCreatedUsers: data.accountCreatedUsers.map(mapCustomerRow),
});

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [accountCreatedUsers, setAccountCreatedUsers] = useState<CustomerRow[]>(
    [],
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadGuide, setShowUploadGuide] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasFetched = useRef(false);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        const [data, role] = await Promise.all([
          fetchCustomerDatasets(),
          getCurrentUserRole(),
        ]);

        if (!isMounted.current) return;

        setUserRole(role);
        const hydrated = hydrateCustomerDatasets(data);
        setCustomers(hydrated.customers);
        setAccountCreatedUsers(hydrated.accountCreatedUsers);
      } catch (error) {
        if (!isMounted.current) return;
        console.error("Failed to fetch initial data:", error);
        toast.error("Failed to load data");
      }
    };
    fetchInitialData();
  }, []);

  const [minSpent, setMinSpent] = useState(0);
  const [minOrders, setMinOrders] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [activeTab, setActiveTab] = useState<"customers" | "accounts">(
    "customers",
  );

  const visibleRows = useMemo(
    () => (activeTab === "customers" ? customers : accountCreatedUsers),
    [activeTab, customers, accountCreatedUsers],
  );

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.toLowerCase();

    return visibleRows
      .filter(
        (c) =>
          (c.name.toLowerCase().includes(normalizedSearch) ||
            c.phone?.includes(search)) &&
          c.spent >= minSpent &&
          c.orders >= minOrders,
      )
      .sort((a, b) => {
        if (sortBy === "spent_high") return b.spent - a.spent;
        if (sortBy === "spent_low") return a.spent - b.spent;
        if (sortBy === "orders_high") return b.orders - a.orders;
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return 0;
      });
  }, [visibleRows, search, minSpent, minOrders, sortBy]);

  const handleEdit = (customer: CustomerRow) => {
    setNewCustomer({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
    });
    setEditingId(customer.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

  const refreshCustomerData = async () => {
    const data = await fetchCustomerDatasets();
    const hydrated = hydrateCustomerDatasets(data);
    setCustomers(hydrated.customers);
    setAccountCreatedUsers(hydrated.accountCreatedUsers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;

    // Validate BD Phone Number
    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(newCustomer.phone)) {
      toast.error(
        "Invalid phone number. Must be a valid 11-digit BD mobile number (e.g., 017XXXXXXXX).",
      );
      return;
    }

    if (editingId) {
      // Update existing
      const res = await updateCustomer(editingId, newCustomer);
      if (res.success) {
        await refreshCustomerData();
        toast.success("Customer updated successfully");
        setIsAdding(false);
        setNewCustomer({ name: "", phone: "", email: "" });
        setEditingId(null);
      } else {
        toast.error(res.error || "Failed to update customer");
      }
    } else {
      // Add new
      const res = await createCustomer(newCustomer);
      if (res.success && res.user) {
        await refreshCustomerData();
        toast.success("Customer added successfully");
        setIsAdding(false);
        setNewCustomer({ name: "", phone: "", email: "" });
        setEditingId(null);
      } else {
        toast.error(res.error || "Failed to add customer");
      }
    }
  };

  const handleDownload = () => {
    const headers = [
      "ID",
      "Name",
      "Phone",
      "Email",
      "Orders",
      "Spent",
      "Points",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredCustomers.map((c) =>
        [
          c.id,
          `"${c.name}"`,
          c.phone,
          c.email || "",
          c.orders,
          c.spent,
          Math.floor(c.spent / 10), // Mock points calculation
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${activeTab === "customers" ? "customers" : "account_created_users"}_SortedBy_${sortBy}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Check file type
      if (!file.name.endsWith(".xlsx")) {
        toast.error(
          "Currently only .xlsx files are supported for secure import.",
        );
        setIsUploading(false);
        return;
      }

      const rows = await readXlsxFile(file);

      if (rows.length === 0) {
        toast.error("File appears to be empty");
        return;
      }

      // read-excel-file returns rows as array of cells, similar to sheet_to_json with header: 1
      const data = rows as unknown[][];

      const headerIndices = getHeaderIndices(data);
      if (!headerIndices) {
        const foundHeaders = Array.isArray(data[0])
          ? data[0]
              .map((cell) => toSafeString(cell))
              .filter((cell) => cell.length > 0)
              .join(", ")
          : "none";
        toast.error(
          `Could not find "Name" and "Phone" columns. Found: ${foundHeaders || "none"}`,
        );
        return;
      }

      const parsed = parseSheetRows(data, headerIndices);
      if (parsed.length === 0) {
        toast.error(
          "No valid customers found. Please ensure phone numbers are valid BD mobile numbers.",
        );
        return;
      }

      toast.info(`Found ${parsed.length} valid customers. Importing...`);
      const result = await bulkImportCustomers(parsed);

      if (result.success) {
        toast.success(
          `Imported ${result.imported} customers, ${result.skipped} skipped (duplicates)`,
        );
        const data = await fetchCustomerDatasets();
        const hydrated = hydrateCustomerDatasets(data);
        setCustomers(hydrated.customers);
        setAccountCreatedUsers(hydrated.accountCreatedUsers);
      } else {
        toast.error(result.error || "Import failed");
      }
    } catch (error) {
      console.error("Excel Parsing Error:", error);
      toast.error("Error parsing file content");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 relative">
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this customer? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (deleteId) {
                  const res = await deleteUser(deleteId);
                  if (res.success) {
                    await refreshCustomerData();
                    toast.success("Customer removed successfully");
                  } else {
                    toast.error(res.error || "Failed to remove customer");
                  }
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            👥 Customers
          </h1>
          <p className="text-sm text-slate-500">
            View and manage your customer base.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-auto",
                  minSpent > 0 || minOrders > 0 || sortBy !== "newest"
                    ? "bg-orange-50 border-orange-200 text-orange-700"
                    : "",
                )}
              >
                <Filter className="w-4 h-4 mr-2" /> Filter{" "}
                {(minSpent > 0 || minOrders > 0 || sortBy !== "newest") &&
                  "(Active)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] max-w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Filter & Sort</h4>
                  <p className="text-sm text-muted-foreground">
                    Refine list for export.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="sort">Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="col-span-2 h-8">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="spent_high">
                          Top Spenders (High)
                        </SelectItem>
                        <SelectItem value="spent_low">Low Spenders</SelectItem>
                        <SelectItem value="orders_high">Most Orders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="minSpent">Min. Spent</Label>
                    <Input
                      id="minSpent"
                      type="number"
                      value={minSpent}
                      onChange={(e) =>
                        setMinSpent(Math.max(0, Number(e.target.value)))
                      }
                      className="col-span-2 h-8"
                      placeholder="0"
                      min={0}
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="minOrders">Min. Orders</Label>
                    <Input
                      id="minOrders"
                      type="number"
                      value={minOrders}
                      onChange={(e) =>
                        setMinOrders(Math.max(0, Number(e.target.value)))
                      }
                      className="col-span-2 h-8"
                      placeholder="0"
                      min={0}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" /> Download CSV
          </Button>
          {(userRole === "TENANT_ADMIN" || userRole === "SUPER_ADMIN") && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowUploadGuide(true)}
                disabled={isUploading}
                className="w-full sm:w-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" /> Upload Excel
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleUpload}
                className="hidden"
              />
            </>
          )}

          {/* Upload Guide Dialog */}
          <Dialog open={showUploadGuide} onOpenChange={setShowUploadGuide}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                  Excel Format Guide
                </DialogTitle>
                <DialogDescription>
                  Your file should look like this:
                </DialogDescription>
              </DialogHeader>

              {/* Demo Table */}
              <div className="border rounded-lg overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50 border-b">
                    <tr>
                      <th className="p-2 text-left font-bold text-orange-800">
                        Name *
                      </th>
                      <th className="p-2 text-left font-bold text-orange-800">
                        Phone *
                      </th>
                      <th className="p-2 text-left font-medium text-slate-500">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="bg-slate-50">
                      <td className="p-2">Rahim Uddin</td>
                      <td className="p-2">01712345678</td>
                      <td className="p-2 text-slate-400">rahim@email.com</td>
                    </tr>
                    <tr>
                      <td className="p-2">Karim Hossain</td>
                      <td className="p-2">01898765432</td>
                      <td className="p-2 text-slate-400">-</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2">Fatima Begum</td>
                      <td className="p-2">01555123456</td>
                      <td className="p-2 text-slate-400">fatima@mail.com</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p>
                  <span className="text-red-500">*</span> <strong>Name</strong>{" "}
                  and <strong>Phone</strong> are required
                </p>
                <p>• Column names can be: Name, Full Name, Customer Name</p>
                <p>• Phone format: 01XXXXXXXXX (11 digits)</p>
                <p>• Duplicates (same phone) will be automatically skipped</p>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadGuide(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700"
                  onClick={() => {
                    setShowUploadGuide(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" /> Select File
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setNewCustomer({ name: "", phone: "", email: "" });
            }}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-white p-1 shadow-sm w-full sm:w-fit">
        <Button
          type="button"
          variant={activeTab === "customers" ? "default" : "ghost"}
          className={cn(
            "flex-1 sm:flex-none",
            activeTab === "customers"
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "text-slate-600 hover:text-slate-900",
          )}
          onClick={() => setActiveTab("customers")}
        >
          Customers ({customers.length})
        </Button>
        <Button
          type="button"
          variant={activeTab === "accounts" ? "default" : "ghost"}
          className={cn(
            "flex-1 sm:flex-none",
            activeTab === "accounts"
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "text-slate-600 hover:text-slate-900",
          )}
          onClick={() => setActiveTab("accounts")}
        >
          Account Created Users ({accountCreatedUsers.length})
        </Button>
      </div>

      {/* Modal */}
      {isAdding && (
        <div className="fixed -inset-px z-[60000] flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-lg backdrop-brightness-50 sm:items-center">
          <Card className="my-auto w-full max-w-md animate-in fade-in zoom-in-95 duration-200 max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col">
            <div className="p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Edit Customer" : "Add Customer"}
                </h2>
                <button
                  onClick={() => setIsAdding(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label
                    htmlFor="customer-name"
                    className="text-sm font-medium text-slate-700"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="customer-name"
                    placeholder="Customer Name"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="customer-phone"
                    className="text-sm font-medium text-slate-700"
                  >
                    Phone Number
                  </Label>
                  <Input
                    id="customer-phone"
                    placeholder="017..."
                    value={newCustomer.phone}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, phone: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="customer-email"
                    className="text-sm font-medium text-slate-700"
                  >
                    Email (Optional)
                  </Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="email@example.com"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, email: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {editingId ? "Save Changes" : "Save Customer"}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}

      <Card className="border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search by name or phone..."
              className="pl-9 bg-gray-50 border-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-3 p-4 md:hidden">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 flex-shrink-0">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{customer.name}</span>
                      {customer.isGuest && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1 py-0 border-slate-300 text-slate-500 font-normal"
                        >
                          Guest
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      ID:{" "}
                      {customer.id.startsWith("guest_")
                        ? "Unregistered"
                        : `#${customer.id}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!customer.isGuest && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleEdit(customer)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(customer.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 min-w-0 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    Points
                  </div>
                  <div className="mt-1">
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700 hover:bg-orange-100"
                    >
                      {customer.points} pts
                    </Badge>
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    History
                  </div>
                  <div className="mt-1 font-bold text-slate-800">
                    ৳{customer.spent.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    {customer.orders} Orders
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredCustomers.length === 0 && (
            <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-slate-500 shadow-sm">
              No{" "}
              {activeTab === "customers"
                ? "customers"
                : "account-created users"}{" "}
              found matching &quot;{search}&quot;.
            </div>
          )}
        </div>
        <div className="hidden md:block overflow-x-auto custom-table-scrollbar">
          <table className="w-full text-sm text-left min-w-[600px]">
            <thead className="bg-gray-50 text-slate-500 font-medium border-b border-gray-100">
              <tr>
                <th className="p-4 w-4">
                  <input type="checkbox" />
                </th>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Points</th>
                <th className="p-4">History</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/50">
                  <td className="p-4">
                    <input type="checkbox" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {customer.name}
                          {customer.isGuest && (
                            <Badge
                              variant="outline"
                              className="text-[10px] h-4 px-1 py-0 border-slate-300 text-slate-500 font-normal"
                            >
                              Guest
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID:{" "}
                          {customer.id.startsWith("guest_")
                            ? "Unregistered"
                            : `#${customer.id}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3 h-3" /> {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <Mail className="w-3 h-3" /> {customer.email}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-700 hover:bg-orange-100"
                    >
                      {customer.points} pts
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">
                      ৳{customer.spent.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {customer.orders} Orders
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!customer.isGuest && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No{" "}
                    {activeTab === "customers"
                      ? "customers"
                      : "account-created users"}{" "}
                    found matching &quot;{search}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
