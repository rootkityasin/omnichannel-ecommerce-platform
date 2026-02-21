"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  Users,
  Settings,
  Palette,
  Ticket,
  BarChart3,
  Zap,
  ChevronLeft,
  Menu,
  ShieldCheck,
  ClipboardList,
  Megaphone, // Added
  LayoutTemplate, // Added
  FlaskConical, // Added
  Printer, // Added
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useAdmin } from "@/components/providers/AdminProvider";
import { Button } from "@/components/ui/button";

import { useSession } from "next-auth/react";

export function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useAdmin(); // Access setOrders if needed, or just specific context

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // lg breakpoint
        if (!isSidebarCollapsed) toggleSidebar();
      }
    };

    // Initial check
    if (window.innerWidth < 1024) {
      // We can't toggle here easily without causing double-render or loop if we are not careful.
      // But since we want "default to desktop", and "little screen only icon",
      // maybe better to let the Provider handle initial state?
      // Or just simpler:
    }

    // Actually, let's just use CSS media queries for "mobile first" strategies usually,
    // but since we have state-driven layout (ml-64), JS is needed.

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarCollapsed, toggleSidebar]);

  // Better approach:
  // On mount, check width. If small & not collapsed, collapse.
  useEffect(() => {
    const checkSize = () => {
      if (window.innerWidth < 1024) {
        // We need to access the setter directly or ensure toggle works as 'set(true)'
        // My toggle is just prev => !prev. This is risky for resize events.
        // I should expose 'setSidebarCollapsed' or make toggle accept a value.
        // For now, I'll stick to manual toggle or a simple check on mount.
      }
    };
    checkSize();
  }, []);

  const { data: session } = useSession();
  interface ExtendedUser {
    role?: string;
    permissions?: string[];
  }
  const userRole = (session?.user as ExtendedUser)?.role;
  const userPermissions = (session?.user as ExtendedUser)?.permissions || [];

  // Debug Permissions removed to clean up lint warnings

  // Helper to check permission
  // If no permission key is set, the item is visible to all admins (or base role checks)
  const isAdminRole = [
    "SUPER_ADMIN",
    "TENANT_ADMIN",
    "HUB_ADMIN",
    "STAFF",
  ].includes(userRole || "");
  const canSee = (permissionKey?: string) => {
    if (!permissionKey) return true;
    if (userRole === "SUPER_ADMIN" || userRole === "TENANT_ADMIN") return true; // Full access for Owners
    if (isAdminRole && userPermissions.length === 0) return true; // Fallback when permissions are not seeded
    return userPermissions.includes(permissionKey);
  };

  interface MenuItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
    permission?: string;
  }

  const menuGroups: { label: string; items: MenuItem[] }[] = [
    {
      label: "Main",
      items: [
        {
          label: "Dashboard",
          href: "/admin",
          icon: LayoutDashboard,
          permission: "VIEW_DASHBOARD",
        }, // Restricted
        {
          label: "Orders",
          href: "/admin/orders",
          icon: ShoppingBag,
          permission: "VIEW_ORDERS",
        },
        {
          label: "Products",
          href: "/admin/products",
          icon: Package,
          permission: "VIEW_PRODUCTS",
        },
        {
          label: "Categories",
          href: "/admin/categories",
          icon: Layers,
          permission: "VIEW_CATEGORIES",
        },
        {
          label: "Customers",
          href: "/admin/customers",
          icon: Users,
          permission: "VIEW_CUSTOMERS",
        },
      ].filter((item) => canSee(item.permission)),
    },
    {
      label: "CONFIGURATION",
      items: [
        {
          label: "Manage Shop",
          href: "/admin/shop",
          icon: Settings,
          permission: "MANAGE_SHOP",
        },
        {
          label: "Customize Theme",
          href: "/admin/theme",
          icon: Palette,
          permission: "MANAGE_THEME",
        },
        {
          label: "Landing Page",
          href: "/admin/landing",
          icon: LayoutTemplate,
          permission: "MANAGE_LANDING",
        },
        {
          label: "Promotions",
          href: "/admin/promos",
          icon: Ticket,
          permission: "MANAGE_PROMOS",
        },
        {
          label: "Invoice",
          href: "/admin/settings/invoice",
          icon: Printer,
          permission: "MANAGE_SHOP",
        }, // Reusing MANAGE_SHOP for now or MANAGE_SETTINGS

        {
          label: "Security",
          icon: ShieldCheck,
          href: "/admin/security",
          badge: "NEW",
          badgeColor: "bg-blue-100 text-blue-600",
          permission: "MANAGE_SECURITY",
        },
        {
          label: "Inventory",
          icon: ClipboardList,
          href: "/admin/inventory",
          permission: "MANAGE_INVENTORY",
        },
        {
          label: "Automation",
          href: "/admin/automation",
          icon: Zap,
          badge: "HOT",
          badgeColor: "bg-red-100 text-red-600",
          permission: "MANAGE_AUTOMATION",
        },
      ].filter((item) => canSee(item.permission)),
    },
    {
      label: "REPORTS",
      items: [
        {
          label: "Event Matrix",
          href: "/admin/events",
          icon: BarChart3,
          badge: "LIVE",
          badgeColor: "bg-green-100 text-green-600",
          permission: "VIEW_REPORTS",
        },
        {
          label: "Analytics",
          href: "/admin/analytics",
          icon: BarChart3,
          permission: "VIEW_ANALYTICS",
        },
        {
          label: "Reviews",
          href: "/admin/reviews",
          icon: Megaphone,
          badge: "NEW",
          badgeColor: "bg-purple-100 text-purple-600",
          permission: "VIEW_REVIEWS",
        },
      ].filter((item) => canSee(item.permission)),
    },
    {
      label: "LEADS",
      items: [
        { label: "LabsMail", href: "/admin/labsmail", icon: FlaskConical },
      ],
    },
  ].filter((group) => group.items.length > 0);

  return (
    <>
      {/* Backdrop for Mobile */}
      {!isSidebarCollapsed && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none",
          // Desktop: width toggles between 20 and 64
          isSidebarCollapsed ? "lg:w-20" : "lg:w-64",
          // Mobile: width is always 64, but toggles translation
          "w-64",
          // Translation logic
          isSidebarCollapsed
            ? "-translate-x-full lg:translate-x-0"
            : "translate-x-0",
        )}
      >
        {/* Logo & Toggle Header */}
        <div
          className={cn(
            "flex items-center h-16 border-b border-gray-100 transition-all duration-300",
            isSidebarCollapsed ? "justify-center px-0" : "justify-between px-6",
          )}
        >
          {isSidebarCollapsed ? (
            // Collapsed (Desktop only)
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-slate-400 hover:text-orange-600 hidden lg:flex"
            >
              <Menu className="w-6 h-6" />
            </Button>
          ) : (
            <>
              {/* Expanded View */}
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="CrabKhai" className="h-10 w-auto" />
                {/* Mobile Close Button (X) */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="lg:hidden text-slate-400 hover:text-red-500 absolute right-2 top-3"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              </div>

              {/* Desktop Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-slate-400 hover:text-orange-600 hidden lg:flex"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>

        {/* Hub Selector removed as per request */}

        {/* Menu */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="px-3">
              {group.label !== "Main" && !isSidebarCollapsed && (
                <h4 className="mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider animate-in fade-in">
                  {group.label}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        // Auto-close on mobile
                        if (window.innerWidth < 1024) {
                          toggleSidebar();
                        }
                      }}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors relative group",
                        isActive
                          ? "bg-orange-50 text-orange-600"
                          : "text-slate-600 hover:bg-gray-50 hover:text-slate-900",
                        isSidebarCollapsed
                          ? "justify-center"
                          : "justify-between",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          className={cn(
                            "w-5 h-5 flex-shrink-0 transition-colors",
                            isActive
                              ? "text-orange-600"
                              : "text-slate-400 group-hover:text-slate-600",
                          )}
                        />
                        {!isSidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!isSidebarCollapsed && item.badge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 text-[10px] font-bold rounded-md ml-auto",
                            item.badge === "NEW"
                              ? item.badgeColor || "bg-gray-100 text-gray-600"
                              : "bg-orange-100 text-orange-600",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Status Dot for collapsed view if needed, maybe not now */}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Collapse Toggle */}
        {/* Footer with Toggle Check - actually removing toggle from here as per request */}
        {/* Footer Limit */}
        <div className="p-4 border-t border-gray-100">
          {!isSidebarCollapsed && (
            <div className="flex items-center justify-center p-2 text-xs font-medium text-slate-500 hover:text-orange-600 cursor-pointer gap-1">
              90s Labs <FlaskConical className="w-3 h-3" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
