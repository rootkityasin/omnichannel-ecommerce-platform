"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Calendar,
  LogIn,
  MoreVertical,
  Edit,
  Trash2,
  KeyRound,
  Ban,
  CheckCircle,
  Clock,
  Square,
  CheckSquare,
  ShoppingBag,
  Package,
} from "lucide-react";
import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
  deleteTenant,
  updateTenantStatus,
  updateTenantPlan,
  getImpersonationLink,
} from "@/app/actions/super-admin";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditCompanyModal } from "./EditCompanyModal";
import { CompanyUsersModal } from "./CompanyUsersModal";
import { Tenant } from "@/types/common";

interface TenantProps {
  tenant: Tenant;
  plans: {
    id: string;
    name: string;
    slug: string;
    price: number;
    period: string;
    features: Record<string, unknown>; // Kept as any or structured if known, but main issue was plans: any[]
  }[];
}

export function TenantCard({ tenant, plans }: Readonly<TenantProps>) {
  const [isPending, startTransition] = useTransition();

  // State
  const [isOpen, setIsOpen] = useState(false); // Menu
  const [showDelete, setShowDelete] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

  // Plan Logic (Badge Mapping)
  const getPlanBadge = (planName: string) => {
    const p = planName.toUpperCase();
    if (p.includes("PLATINUM"))
      return { label: "Platinum", color: "bg-green-500 text-white" };
    if (p.includes("GOLD"))
      return { label: "Gold", color: "bg-yellow-500 text-white" };
    if (p.includes("SILVER"))
      return { label: "Silver", color: "bg-slate-400 text-white" };
    if (p.includes("FREE"))
      return { label: "Free Plan", color: "bg-slate-500 text-white" };
    return { label: planName, color: "bg-slate-500 text-white" };
  };

  const planBadge = getPlanBadge(tenant.plan);

  const handleAction = async (action: string) => {
    if (action === "delete") {
      setShowDelete(true);
      return;
    }
    if (action === "edit") {
      setShowEdit(true);
      return;
    }
    if (action === "toggle_status") {
      startTransition(async () => {
        const res = await updateTenantStatus(tenant.id, !tenant.isActive);
        if (res.success)
          toast.success(`Tenant ${tenant.isActive ? "disabled" : "enabled"}`);
        else toast.error(res.error);
      });
    }
    if (action === "impersonate") {
      startTransition(async () => {
        const res = await getImpersonationLink(tenant.id);
        if (res.success && res.url) {
          toast.success("Redirecting...");
          window.open(res.url, "_blank");
        } else {
          toast.error(res.error || "Failed to link");
        }
      });
    }
  };

  const handleUpgrade = async (newPlan: string) => {
    startTransition(async () => {
      const res = await updateTenantPlan(tenant.id, newPlan);
      if (res.success) {
        toast.success(`Plan updated to ${newPlan}`);
        setShowPlan(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  const confirmDelete = async () => {
    startTransition(async () => {
      const res = await deleteTenant(tenant.id);
      if (res.success) {
        toast.success("Deleted");
        setShowDelete(false);
      } else toast.error(res.error);
    });
  };

  const [now, setNow] = useState<Date | null>(null);

  // Expiry Logic
  const createdAt = new Date(tenant.createdAt);
  const expiryDateObj = new Date(createdAt);
  expiryDateObj.setFullYear(createdAt.getFullYear() + 1); // Mock 1 year validity

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);

  const diffDays = now
    ? Math.ceil(
        (expiryDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
    : 365;

  const isExpired = diffDays <= 0;

  let daysLeftText = "Calculating...";
  if (now) {
    daysLeftText = isExpired ? "Expired" : `${diffDays} Days Left`;
  }

  let daysColor = "text-slate-600";
  if (isExpired) {
    daysColor = "text-red-600";
  } else if (diffDays < 30) {
    daysColor = "text-orange-600";
  }

  let clockColor = "text-cyan-500";
  if (isExpired) {
    clockColor = "text-red-500";
  } else if (diffDays < 30) {
    clockColor = "text-orange-500";
  }

  // Format dates for display
  const createdDateDisplay = `${String(createdAt.getDate()).padStart(2, "0")}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${createdAt.getFullYear()}`;
  const expiredDateDisplay = expiryDateObj.toLocaleDateString("en-US", {
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <Card className="border-0 shadow-sm hover:shadow-md transition-all bg-white overflow-hidden flex flex-col h-full rounded-2xl">
        {/* Header: Plan Badge & Menu */}
        <div className="flex justify-between items-start p-4 pb-0">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
              planBadge.color,
            )}
          >
            {planBadge.label}
          </span>
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2 text-slate-300 hover:text-slate-500"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 shadow-lg border-slate-100 rounded-xl"
            >
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => handleAction("edit")}
              >
                <Edit className="w-4 h-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer text-red-500 focus:text-red-500"
                onClick={() => handleAction("delete")}
              >
                <Trash2 className="w-4 h-4" /> Delete
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => handleAction("impersonate")}
              >
                <LogIn className="w-4 h-4" /> Login As Company
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 p-2 cursor-pointer">
                <KeyRound className="w-4 h-4" /> Reset Password
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 p-2 cursor-pointer"
                onClick={() => handleAction("toggle_status")}
              >
                {tenant.isActive ? (
                  <Ban className="w-4 h-4 text-red-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {tenant.isActive ? "Login Disable" : "Enable Login"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Body: User Info */}
        <CardContent className="flex flex-col flex-1 p-4 pt-2 gap-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 rounded-lg border border-slate-100 bg-slate-50">
              {/* Assuming tenant has no image field yet, using name initials */}
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${tenant.name}`}
              />
              <AvatarFallback className="rounded-lg bg-emerald-100 text-emerald-700 font-bold">
                {tenant.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <h3
                className="font-semibold text-slate-900 truncate text-base leading-tight"
                title={tenant.name}
              >
                {tenant.name}
              </h3>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                {tenant.primaryDomain || tenant.customDomain || "No domain set"}
              </p>
            </div>
          </div>

          {/* Date Blocks */}
          <div className="flex items-center justify-between text-xs text-slate-700 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50">
            <div className="flex items-center gap-1.5" title="Creation Date">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-medium text-slate-800">
                {createdDateDisplay}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5"
              title="Days until Plan Expiry"
            >
              <Clock className={cn("w-3.5 h-3.5", clockColor)} />
              <span className={cn("font-medium tabular-nums", daysColor)}>
                {daysLeftText}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <Button
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold h-9 text-xs shadow-sm"
              onClick={() => setShowPlan(true)}
            >
              Upgrade Plan
            </Button>
            <Button
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold h-9 text-xs shadow-sm"
              onClick={() => handleAction("impersonate")}
            >
              Admin Hub
            </Button>
          </div>

          {/* Expiry Text */}
          <div className="text-center">
            <p className="text-[10px] text-slate-600 font-medium">
              Plan Expired : {expiredDateDisplay}
            </p>
          </div>
        </CardContent>

        {/* Footer: Stats */}
        <CardFooter className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-50 p-0 bg-white">
          <button
            onClick={() => setShowUsers(true)}
            className="flex items-center justify-center gap-1.5 py-3 hover:bg-slate-50 transition-colors group"
            title="Active Staff Users"
          >
            <div className="bg-rose-100 p-1 rounded text-rose-500 group-hover:scale-110 transition-transform">
              <Users className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {tenant._count?.users ?? 0}
            </span>
          </button>

          <div
            className="flex items-center justify-center gap-1.5 py-3"
            title="Total Orders"
          >
            <div className="bg-orange-100 p-1 rounded text-orange-500">
              <ShoppingBag className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {tenant._count?.orders ?? 0}
            </span>
          </div>

          <div
            className="flex items-center justify-center gap-1.5 py-3"
            title="Total Products"
          >
            <div className="bg-cyan-100 p-1 rounded text-cyan-500">
              <Package className="w-3 h-3" />
            </div>
            <span className="text-xs font-semibold text-slate-800">
              {tenant._count?.products ?? 0}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Dialogs */}

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          {/* ... Delete Confirm UI ... */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal - Redesigned List Layout */}
      <Dialog open={showPlan} onOpenChange={setShowPlan}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upgrade Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-0 divide-y divide-slate-100 border-y border-slate-100 mt-4 rounded-lg bg-slate-50/50">
            {plans.map((p) => {
              const isCurrent = tenant.plan === p.slug;

              // Parse limits from feature strings if possible
              // Expected format: "2 Staff Accounts", "50 Products", "100 Orders/mo"
              const features =
                typeof p.features === "string"
                  ? JSON.parse(p.features)
                  : p.features;

              const getLimit = (keyword: string) => {
                const feat = features.find((f: string) => f.includes(keyword));
                if (!feat) return "-";
                const num = feat.match(/([\d,]+|Unlimited|Untolimted)/i); // Handle typo if any
                return num ? num[0] : "-";
              };

              const usersLimit = getLimit("Staff");
              const productsLimit = getLimit("Products");
              const ordersLimit = getLimit("Orders");

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-4 px-4 group hover:bg-white transition-all first:rounded-t-lg last:rounded-b-lg hover:shadow-sm"
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-56">
                      <span className="font-bold text-slate-800 block text-sm">
                        {p.name} ({p.price > 0 ? `৳${p.price}` : "Free"}) /{" "}
                        {p.period?.replace("/", "")}
                      </span>
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-8 text-xs text-slate-500">
                      <div className="flex flex-col items-start min-w-[80px]">
                        <span className="font-medium text-slate-600">
                          Users : {usersLimit}
                        </span>
                      </div>
                      <div className="flex flex-col items-start min-w-[80px]">
                        <span className="font-medium text-slate-600">
                          Products : {productsLimit}
                        </span>
                      </div>
                      <div className="flex flex-col items-start min-w-[80px]">
                        <span className="font-medium text-slate-600">
                          Orders : {ordersLimit}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="icon"
                    className={cn(
                      "w-9 h-9 rounded-md shadow-sm transition-all border",
                      isCurrent
                        ? "bg-lime-500 border-lime-600 text-white hover:bg-lime-600"
                        : "bg-white border-slate-200 text-slate-300 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50",
                    )}
                    onClick={() => !isCurrent && handleUpgrade(p.slug)}
                    disabled={isPending}
                  >
                    {isCurrent ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <EditCompanyModal
        tenant={tenant}
        open={showEdit}
        onOpenChange={setShowEdit}
      />

      <CompanyUsersModal
        tenantId={tenant.id}
        tenantName={tenant.name}
        open={showUsers}
        onOpenChange={setShowUsers}
      />
    </>
  );
}
