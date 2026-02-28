"use client";

import { Bell, Check, Trash2, Mail, LogOut, Menu } from "lucide-react";
import { useAdmin } from "@/components/providers/AdminProvider";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import {
  fetchNotifications as fetchAdminNotifications,
  markNotificationAsRead,
  clearAllNotifications,
} from "@/app/[domain]/admin/notifications/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type?: string;
  link?: string;
}

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const { currentUser, logout, toggleSidebar } = useAdmin();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await fetchAdminNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
    } catch (error) {
      console.error(error);
    }
  };

  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetched = useRef(false); // Prevent duplicate fetches (React Strict Mode)

  // Polling Loop

  useEffect(() => {
    if (hasFetched.current) return; // Skip if already fetched
    hasFetched.current = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    loadNotifications();
    // scheduleNextPoll(); // DISABLED: To prevent excessive requests

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationAsRead(id);
    loadNotifications();
  };

  const handleClear = async () => {
    await clearAllNotifications();
    loadNotifications();
  };

  // Hydration Fix: Render static placeholders during SSR
  if (!mounted) {
    return (
      <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            disabled
            className="lg:hidden text-slate-500 -ml-2"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            {title || "Dashboard"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2.5 rounded-full hover:bg-slate-100 transition-all duration-300 outline-none group">
            <Bell className="w-6 h-6 text-slate-400" />
          </button>

          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-white">
            {currentUser?.name?.charAt(0) || "A"}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden text-slate-500 hover:text-slate-700 -ml-2"
        >
          <Menu className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          {title || "Dashboard"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2.5 rounded-full hover:bg-slate-100 transition-all duration-300 outline-none group active:scale-95">
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute top-1 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10 shadow-sm"
                  />
                )}
              </AnimatePresence>
              <motion.div
                animate={
                  unreadCount > 0 ? { rotate: [0, -20, 20, -10, 10, 0] } : {}
                }
                transition={{
                  repeat: unreadCount > 0 ? Infinity : 0,
                  repeatDelay: 5,
                  duration: 1,
                }}
              >
                <Bell
                  className={`w-6 h-6 ${unreadCount > 0 ? "text-slate-800 fill-slate-800/10" : "text-slate-400 group-hover:text-slate-600"}`}
                />
              </motion.div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[380px] p-0 border-0 shadow-xl bg-white/95 backdrop-blur-xl rounded-2xl overflow-hidden ring-1 ring-slate-200"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-1">
              <AnimatePresence mode="popLayout">
                {notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <Bell className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">
                      All caught up!
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      No new notifications
                    </p>
                  </motion.div>
                ) : (
                  notifications.map((n, i) => (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        transition: { duration: 0.2 },
                      }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "group relative flex flex-col gap-1 p-3 rounded-xl transition-all duration-200 border border-transparent",
                        !n.read
                          ? "bg-blue-50/60 hover:bg-blue-50 border-blue-100"
                          : "hover:bg-slate-50 border-transparent hover:border-slate-100",
                      )}
                    >
                      <div className="flex w-full justify-between items-start gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full mt-2 shrink-0",
                              !n.read
                                ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                : "bg-transparent",
                            )}
                          />
                          <div className="space-y-1">
                            <p
                              className={cn(
                                "text-sm font-medium leading-none",
                                !n.read ? "text-slate-900" : "text-slate-600",
                              )}
                            >
                              {n.title}
                            </p>
                            <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </div>
                        {!n.read && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded-full"
                            onClick={(e) => handleRead(n.id, e)}
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pl-5">
                        <span className="text-[10px] font-medium text-slate-400">
                          {format(new Date(n.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
            <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
              <Link
                href="/admin/notifications"
                className="text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors block w-full py-1"
              >
                View History
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white font-bold text-xs shadow-md ring-2 ring-white cursor-pointer hover:shadow-lg transition-all">
              {currentUser?.name?.charAt(0) || "A"}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium leading-none">
                {currentUser?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {{
                  SUPER_ADMIN: "Super Admin",
                  TENANT_ADMIN: "Shop Admin",
                  HUB_ADMIN: "Hub Manager",
                  STAFF: "Staff",
                  USER: "Customer",
                }[currentUser?.role || ""] || "User"}
              </p>
            </div>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 flex items-center gap-2 text-slate-500">
              <Mail className="w-4 h-4" />
              <span className="text-xs truncate">
                {currentUser?.email || "admin@90slabs.com"}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
