'use client';




import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { getAdminOrders, updateAdminOrder, deleteAdminOrder } from '@/app/actions/order';
import { toast } from 'sonner';

// --- Types ---
export type Role = 'SUPER_ADMIN' | 'HUB_ADMIN';

// Add Payment Config Type Definition (simplified)
export interface PaymentConfigType {
    codEnabled?: boolean;
    bkashEnabled?: boolean;
    bkashAppKey?: string;
    bkashSecretKey?: string;
    bkashUsername?: string;
    bkashPassword?: string;
    nagadEnabled?: boolean;
    nagadMerchantNumber?: string;
    nagadPublicKey?: string;
    nagadPrivateKey?: string;
    selfMfsEnabled?: boolean;
    selfMfsType?: string;
    selfMfsPhone?: string;
    selfMfsInstruction?: string;
    selfMfsQrCode?: string;
    advancePaymentType?: string;
    advancePaymentValue?: number | string;
}

export interface Hub {
    id: string;
    name: string;
    location: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    hubId?: string; // If null/undefined, effectively Super Admin access to all
}

// --- Constants ---
const HUBS: Hub[] = [
    { id: 'dhaka-central', name: 'Dhaka Central Hub', location: 'Dhaka' },
    { id: 'khulna-hub', name: 'Khulna Hub', location: 'Khulna' },
    { id: 'chattogram-hub', name: 'Chattogram Hub', location: 'Chattogram' },
];

const MOCK_USERS: User[] = [
    { id: 'super-admin', name: 'Super Admin', email: 'admin@crabkhai.com', role: 'SUPER_ADMIN' },
];

interface AdminContextType {
    orders: any[];
    products: any[];
    allProducts: any[];
    allOrders: any[];
    settings: {
        contactPhone: string;
        contactEmail: string;
        contactAddress: string;
        shopName: string;
        logoUrl: string;
        measurementUnit: string;
        allergensText: string;
        certificates: string[];
        taxPercentage?: number;
        primaryColor?: string;
        secondaryColor?: string;
        weightUnitValue?: number;
        volumeUnitValue?: number;
        shopType?: string;
    };
    paymentConfig: PaymentConfigType;

    // RBAC & Hubs
    currentUser: User;
    activeHubId: string | 'ALL'; // 'ALL' only for Super Admin to see aggregate
    hubs: Hub[];
    availableHubs: Hub[]; // Hubs visible to current user
    switchHub: (hubId: string | 'ALL') => void;
    loginAs: (userId: string) => void;

    // Actions
    setOrders: (orders: any[]) => void;
    setProducts: (products: any[]) => void;
    updateSettings: (settings: any) => void;
    updatePaymentConfig: (config: PaymentConfigType) => void;
    addOrder: (order: any) => void;
    updateOrder: (id: string, updates: any) => void;
    updateProduct: (id: string, updates: any) => void;
    addProduct: (product: any) => void;
    deleteOrder: (id: string) => void;
    deleteProduct: (id: string) => void;
    toggleStock: (id: string) => void;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: any }) {
    // Auth State
    const [currentUser, setCurrentUser] = useState<User>(initialUser || MOCK_USERS[0]); // Fallback for dev only
    const [activeHubId, setActiveHubId] = useState<string | 'ALL'>('ALL');

    const [orders, setOrdersState] = useState<any[]>([]);
    const [products, setProductsState] = useState<any[]>([]);
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(true); // Default collapsed (mobile friendly start)

    // --- RBAC Logic ---

    // Login Handler (Simulated)
    const loginAs = (userId: string) => {
        const user = MOCK_USERS.find(u => u.id === userId);
        if (user) {
            setCurrentUser(user);
            // If Hub Admin, force their hub. If Super Admin, default to ALL or keep current.
            if (user.role === 'HUB_ADMIN' && user.hubId) {
                setActiveHubId(user.hubId);
            } else {
                setActiveHubId('ALL');
            }
        }
    };

    // Derived: Available Hubs for the current user
    const availableHubs = useMemo(() => {
        if (currentUser.role === 'SUPER_ADMIN') return HUBS;
        return HUBS.filter(h => h.id === currentUser.hubId);
    }, [currentUser]);

    // Derived: Filtered Data based on Active Hub / Role
    const filteredOrders = useMemo(() => {
        if (activeHubId === 'ALL') return orders;
        return orders.filter(o => o.hubId === activeHubId);
    }, [orders, activeHubId]);

    const filteredProducts = useMemo(() => {
        if (activeHubId === 'ALL') return products;
        return products.filter(p => p.hubId === activeHubId || !p.hubId); // Products might remain global? Assuming local for now.
    }, [products, activeHubId]);


    // --- Persistence & Settings ---
    const [settings, setSettings] = useState({
        contactPhone: "+880 1804 221 161",
        contactEmail: "crabkhaibangladesh@gmail.com",
        contactAddress: "195 Green Road, Dhaka",
        shopName: "Crab & Khai",
        logoUrl: "/logo.svg",
        measurementUnit: "PCS",
        allergensText: "Crustaceans",
        certificates: [
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/HACCP_Certification_Mark.svg/1200px-HACCP_Certification_Mark.svg.png",
            "https://www.qualityaustria.com/fileadmin/_processed_/c/9/csm_GMP_Good_Manufacturing_Practice_Logo_3502845680.jpg",
        ],
        taxPercentage: 0,
        primaryColor: "#ea0000",
        secondaryColor: "#0f172a",
        shopType: "RESTAURANT"
    });

    const [paymentConfig, setPaymentConfigState] = useState<PaymentConfigType>({});
    const hasFetched = React.useRef(false);

    // Load from LocalStorage on Mount AND fetch fresh config/orders
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        if (typeof window !== 'undefined') {
            // 1. Try LocalStorage for settings/products (not orders anymore, orders are handled by server)
            const savedData = localStorage.getItem('crab-khai-admin-data-v8');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    if (parsed.products) setProductsState(parsed.products);
                    if (parsed.settings) setSettings(prev => ({ ...prev, ...parsed.settings }));
                } catch (e) { console.error(e); }
            }

            // 2. Fetch fresh from DB (Background)
            import('@/app/actions/settings').then(mod => {
                mod.getSiteConfig().then(dbConfig => {
                    if (dbConfig) {
                        setSettings(prev => ({
                            ...prev,
                            ...dbConfig,
                            certificates: Array.isArray(dbConfig.certificates) ? dbConfig.certificates : [],
                            logoUrl: dbConfig.logoUrl ?? prev.logoUrl
                        }));

                    }
                });
            });

            // 3. Fetch Orders from DB
            getAdminOrders().then(dbOrders => {
                if (dbOrders) setOrdersState(dbOrders);
            });
        }
    }, []);

    // Save to LocalStorage on Change (excluding orders)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const dataToSave = {
                // products: products, // Too large for localStorage, fetches fresh from DB anyway
                settings: settings,
                paymentConfig: paymentConfig
            };
            try {
                // Cleanup old version to free space
                localStorage.removeItem('crab-khai-admin-data-v7');
                localStorage.setItem('crab-khai-admin-data-v8', JSON.stringify(dataToSave));
            } catch (e) {
                console.warn("Failed to save to localStorage:", e);
            }
        }
    }, [products, settings, paymentConfig]);


    // --- Actions ---
    const setOrders = (newOrders: any[]) => setOrdersState(newOrders);
    const setProducts = (newProducts: any[]) => setProductsState(newProducts);
    const updateSettings = (newSettings: any) => setSettings(prev => ({ ...prev, ...newSettings }));
    const updatePaymentConfig = (newConfig: any) => setPaymentConfigState(prev => ({ ...prev, ...newConfig }));

    const addOrder = (order: any) => {
        // Since manual orders are created via OrdersPage form, they should ideally call createOrder action
        // For now we keep this local-first if needed, but the true fix is fetching after creation.
        setOrdersState([order, ...orders]);
    };

    const updateOrder = async (id: string, updates: any) => {
        // 1. Update UI immediately
        setOrdersState(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));

        // 2. Update DB
        const res = await updateAdminOrder(id, updates);
        if (!res.success) {
            toast.error("Failed to sync status with database");
            // Optionally revert UI here
        }
    };

    const deleteOrder = async (id: string) => {
        const res = await deleteAdminOrder(id);
        if (res.success) {
            setOrdersState(prev => prev.filter(o => o.id !== id));
            toast.success("Order deleted from database");
        } else {
            toast.error("Failed to delete from database");
        }
    };

    const addProduct = (product: any) => setProductsState([{ ...product, hubId: activeHubId === 'ALL' ? 'dhaka-central' : activeHubId }, ...products]);
    const updateProduct = (id: string, updates: any) => {
        setProductsState(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };
    const toggleStock = (id: string) => {
        setProductsState(prev => prev.map(p => p.id === id ? { ...p, stock: !p.stock } : p));
    };
    const deleteProduct = (id: string) => setProductsState(prev => prev.filter(p => p.id !== id));

    const toggleSidebar = () => setSidebarCollapsed(prev => !prev);
    const switchHub = (hubId: string | 'ALL') => setActiveHubId(hubId);

    return (
        <AdminContext.Provider value={{
            // Data exposed is now filtered!
            orders: filteredOrders,
            products: filteredProducts,
            allProducts: products, // Expose raw products for client usage ignoring admin hub filter
            allOrders: orders, // Expose raw orders if needed
            settings,
            paymentConfig,

            currentUser,
            activeHubId,
            hubs: HUBS,
            availableHubs,
            switchHub,
            loginAs,

            setOrders, setProducts, updateSettings, updatePaymentConfig,
            addOrder, updateOrder, deleteOrder,
            addProduct, updateProduct, deleteProduct, toggleStock,
            isSidebarCollapsed, toggleSidebar,
            logout: () => {
                window.location.href = '/api/admin/logout';
            }
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}
