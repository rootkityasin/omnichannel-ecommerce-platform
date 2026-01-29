'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSiteConfig } from '@/app/actions/settings';
// import { getPaymentConfig } from '@/app/actions/settings'; // If needed for public checkout

export interface SettingsContextType {
    settings: {
        contactPhone: string;
        contactEmail: string;
        contactAddress: string;
        shopName: string;
        logoUrl: string;
        measurementUnit: string;
        allergensText: string;
        certificates: any[];
        taxPercentage?: number;
        primaryColor: string;
        secondaryColor: string;
        weightUnitValue?: number;
        volumeUnitValue?: number;
        shopType?: string;
        privacyPolicy?: string;
        refundPolicy?: string;
        termsPolicy?: string;
    };
    loading: boolean;
    refreshSettings: () => Promise<void>;
}

const defaultSettings = {
    contactPhone: "",
    contactEmail: "",
    contactAddress: "",
    shopName: "Crab & Khai",
    logoUrl: "/logo.svg",
    measurementUnit: "PCS",
    allergensText: "",
    certificates: [] as any[],
    primaryColor: "#F40000",
    secondaryColor: "#0f172a",
    taxPercentage: 0,
    weightUnitValue: 200,
    volumeUnitValue: 1000,
    shopType: "RESTAURANT",
    termsPolicy: "",
    privacyPolicy: "",
    refundPolicy: ""
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SettingsContextType['settings']>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const hasFetched = useRef(false);

    const refreshSettings = async () => {
        try {
            const data = await getSiteConfig();
            if (data) {
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    logoUrl: data.logoUrl || prev.logoUrl,
                    contactPhone: data.contactPhone || prev.contactPhone,
                    contactEmail: data.contactEmail || prev.contactEmail,
                    contactAddress: data.contactAddress || prev.contactAddress,
                    shopName: data.shopName || prev.shopName,
                    termsPolicy: data.termsPolicy || prev.termsPolicy || "",
                    privacyPolicy: data.privacyPolicy || prev.privacyPolicy || "",
                    refundPolicy: data.refundPolicy || prev.refundPolicy || ""
                } as SettingsContextType['settings']));
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;
        refreshSettings();
    }, []);

    // Sync CSS variables with settings
    useEffect(() => {
        if (settings.primaryColor) {
            document.documentElement.style.setProperty('--crab-red', settings.primaryColor);
        }
        if (settings.secondaryColor) {
            document.documentElement.style.setProperty('--ocean-blue', settings.secondaryColor);
        }
    }, [settings.primaryColor, settings.secondaryColor]);

    return (
        <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
