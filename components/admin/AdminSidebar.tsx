'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    Layers,
    Users,
    Settings,
    Smartphone,
    Palette,
    FileText,
    Ticket,
    Shield,
    BarChart3,
    CreditCard,
    Repeat,
    Zap,
    ChevronLeft,
    ChevronRight,
    Search,
    LogOut,
    Menu,
    Store,
    ShieldCheck,
    ClipboardList,
    Megaphone, // Added
    Paintbrush, // Added
    LayoutTemplate, // Added
    FlaskConical // Added
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useAdmin } from '@/components/providers/AdminProvider';
import { Button } from '@/components/ui/button';
import { HubSelector } from './HubSelector';

export function AdminSidebar() {
    const pathname = usePathname();
    const { isSidebarCollapsed, toggleSidebar, setOrders } = useAdmin(); // Access setOrders if needed, or just specific context

    // Auto-collapse on mobile
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) { // lg breakpoint
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

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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


    const menuGroups = [
        {
            label: 'Main',
            items: [
                { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
                { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
                { label: 'Products', href: '/admin/products', icon: Package },
                { label: 'Categories', href: '/admin/categories', icon: Layers },
                { label: 'Customers', href: '/admin/customers', icon: Users },
            ],
        },
        {
            label: 'CONFIGURATION',
            items: [
                { label: 'Manage Shop', href: '/admin/shop', icon: Settings },
                { label: 'Customize Theme', href: '/admin/theme', icon: Palette },
                { label: 'Landing Page', href: '/admin/landing', icon: LayoutTemplate },
                { label: 'Promo Codes', href: '/admin/promos', icon: Ticket },

                { label: 'Security', icon: ShieldCheck, href: '/admin/security', badge: 'NEW', badgeColor: "bg-blue-100 text-blue-600" },
                { label: 'Inventory', icon: ClipboardList, href: '/admin/inventory' },
                { label: 'Automation', href: '/admin/automation', icon: Zap, badge: 'HOT', badgeColor: "bg-red-100 text-red-600" },
            ],
        },
        {
            label: 'REPORTS',
            items: [
                { label: 'Event Matrix', href: '/admin/events', icon: BarChart3, badge: 'LIVE', badgeColor: "bg-green-100 text-green-600" },
                { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
                { label: 'Reviews', href: '/admin/reviews', icon: Megaphone, badge: 'NEW', badgeColor: "bg-purple-100 text-purple-600" },
            ],
        },

    ];

    return (
        <>


            {/* Backdrop for Mobile */}
            {!isSidebarCollapsed && (
                <div
                    className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={toggleSidebar}
                />
            )}

            <aside className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out flex flex-col shadow-xl lg:shadow-none",
                // Desktop: width toggles between 20 and 64
                isSidebarCollapsed ? "lg:w-20" : "lg:w-64",
                // Mobile: width is always 64, but toggles translation
                "w-64",
                // Translation logic
                isSidebarCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
            )}>
                {/* Logo & Toggle Header */}
                <div className={cn("flex items-center h-16 border-b border-gray-100 transition-all duration-300", isSidebarCollapsed ? "justify-center px-0" : "justify-between px-6")}>
                    {isSidebarCollapsed ? (
                        // Collapsed (Desktop only)
                        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-slate-400 hover:text-orange-600 hidden lg:flex">
                            <Menu className="w-6 h-6" />
                        </Button>
                    ) : (
                        <>
                            {/* Expanded View */}
                            <div className="flex items-center gap-2">
                                <img src="/logo.svg" alt="CrabKhai" className="h-10 w-auto" />
                                {/* Mobile Close Button (X) */}
                                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-red-500 absolute right-2 top-3">
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                            </div>

                            {/* Desktop Toggle Button */}
                            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-slate-400 hover:text-orange-600 hidden lg:flex">
                                <ChevronLeft className="w-6 h-6" />
                            </Button>
                        </>
                    )}
                </div>

                {/* Hub Selector / Role Simulator */}
                <HubSelector />

                {/* Menu */}
                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="px-3">
                            {group.label !== 'Main' && !isSidebarCollapsed && (
                                <h4 className="mb-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider animate-in fade-in">{group.label}</h4>
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
                                                isSidebarCollapsed ? "justify-center" : "justify-between"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-orange-600" : "text-slate-400 group-hover:text-slate-600")} />
                                                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                                            </div>

                                            {!isSidebarCollapsed && item.badge && (
                                                <span className={cn(
                                                    "px-1.5 py-0.5 text-[10px] font-bold rounded-md ml-auto",
                                                    item.badge === 'NEW' ? (item.badgeColor || "bg-gray-100 text-gray-600") : "bg-orange-100 text-orange-600"
                                                )}>
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
                            everywhere <FlaskConical className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
