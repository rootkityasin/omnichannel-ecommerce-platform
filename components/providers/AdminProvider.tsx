'use client';

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

import { SiteConfig, PaymentConfig, User, Hub } from '@/types/common';

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
    settings: SiteConfig;
    paymentConfig: Partial<PaymentConfig>;

    // RBAC & Hubs
    currentUser: User;
    activeHubId: string | 'ALL'; // 'ALL' only for Super Admin to see aggregate
    hubs: Hub[];
    availableHubs: Hub[]; // Hubs visible to current user
    switchHub: (hubId: string | 'ALL') => void;
    loginAs: (userId: string) => void;

    // Actions
    updateSettings: (settings: Partial<SiteConfig>) => void;
    updatePaymentConfig: (config: Partial<PaymentConfig>) => void;
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children, initialUser, initialData }: {
    children: React.ReactNode;
    initialUser?: User;
    initialData?: {
        settings?: SiteConfig;
    };
}) {
    // Auth State
    const [currentUser, setCurrentUser] = useState<User>(initialUser || MOCK_USERS[0]); // Fallback for dev only
    const [activeHubId, setActiveHubId] = useState<string | 'ALL'>('ALL');

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
        shopType: "RESTAURANT",
        ...initialData?.settings // Spread initial settings if available
    });

    const [paymentConfig, setPaymentConfigState] = useState<Partial<PaymentConfig>>({});
    const hasFetched = React.useRef(false);

    // Load from LocalStorage on Mount AND fetch fresh config
    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        if (typeof window !== 'undefined') {
            // 1. Try LocalStorage for settings
            const savedData = localStorage.getItem('crab-khai-admin-data-v8');
            if (savedData) {
                try {
                    const parsed = JSON.parse(savedData);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if (parsed.settings) setSettings((prev: any) => ({ ...prev, ...parsed.settings }));
                } catch (e) { console.error(e); }
            }

            // 2. Fetch fresh from DB (Background)
            import('@/app/actions/settings').then(mod => {
                mod.getSiteConfig().then(dbConfig => {
                    if (dbConfig) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setSettings((prev: any) => ({
                            ...prev,
                            ...dbConfig,
                            certificates: Array.isArray(dbConfig.certificates) ? dbConfig.certificates : [],
                            logoUrl: dbConfig.logoUrl ?? prev.logoUrl
                        }));

                    }
                });
            });
        }
    }, []);

    // Save to LocalStorage on Change (excluding orders/products)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const dataToSave = {
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
    }, [settings, paymentConfig]);


    // --- Actions ---
    const updateSettings = (newSettings: Partial<SiteConfig>) => setSettings((prev) => ({ ...prev, ...newSettings }));
    const updatePaymentConfig = (newConfig: Partial<PaymentConfig>) => setPaymentConfigState((prev) => ({ ...prev, ...newConfig }));

    const toggleSidebar = () => setSidebarCollapsed(prev => !prev);
    const switchHub = (hubId: string | 'ALL') => setActiveHubId(hubId);

    return (
        <AdminContext.Provider value={{
            settings,
            paymentConfig,

            currentUser,
            activeHubId,
            hubs: HUBS,
            availableHubs,
            switchHub,
            loginAs,

            updateSettings, updatePaymentConfig,
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
