"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { fetchSiteConfig } from "@/app/[domain]/actions/settings";
import { useParams } from "next/navigation";

export interface SettingsContextType {
  settings: {
    tenantId?: string;
    contactPhone: string;
    contactEmail: string;
    contactAddress: string;
    shopName: string;
    logoUrl: string;
    measurementUnit: string;
    allergensText: string;
    certificates: string[];
    taxPercentage?: number;
    primaryColor: string;
    secondaryColor: string;
    weightUnitValue?: number;
    volumeUnitValue?: number;
    shopType?: string;
    privacyPolicy?: string | null;
    refundPolicy?: string | null;
    termsPolicy?: string | null;
  };
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings = {
  tenantId: undefined as string | undefined, // Added for registration sync
  contactPhone: "",
  contactEmail: "",
  contactAddress: "",
  shopName: "Crab Khai",
  logoUrl: "/logo.svg",
  measurementUnit: "PCS",
  allergensText: "",
  certificates: [] as string[],
  primaryColor: "#F40000",
  secondaryColor: "#0f172a",
  taxPercentage: 0,
  weightUnitValue: 200,
  volumeUnitValue: 1000,
  shopType: "RESTAURANT",
  termsPolicy: "",
  privacyPolicy: "",
  refundPolicy: "",
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: Partial<SettingsContextType["settings"]>;
}) {
  const [settings, setSettings] = useState<SettingsContextType["settings"]>({
    ...defaultSettings,
    ...initialSettings,
  });
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const domain = params?.domain as string;

  const refreshSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchSiteConfig(domain);
      if (data) {
        setSettings(
          (prev) =>
            ({
              ...prev,
              ...data,
              tenantId: data.tenantId || prev.tenantId,
              logoUrl: data.logoUrl || prev.logoUrl,
              contactPhone: data.contactPhone || prev.contactPhone,
              contactEmail: data.contactEmail || prev.contactEmail,
              contactAddress: data.contactAddress || prev.contactAddress,
              shopName: data.shopName || prev.shopName,
              termsPolicy: data.termsPolicy || prev.termsPolicy || "",
              privacyPolicy: data.privacyPolicy || prev.privacyPolicy || "",
              refundPolicy: data.refundPolicy || prev.refundPolicy || "",
            }) as SettingsContextType["settings"],
        );
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync CSS variables with settings
  useEffect(() => {
    if (settings.primaryColor) {
      document.documentElement.style.setProperty(
        "--crab-red",
        settings.primaryColor,
      );
    }
    if (settings.secondaryColor) {
      document.documentElement.style.setProperty(
        "--ocean-blue",
        settings.secondaryColor,
      );
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
    console.warn(
      "useSettings must be used within a SettingsProvider. Using default settings.",
    );
    return {
      settings: defaultSettings,
      loading: false,
      refreshSettings: async () => {},
    };
  }
  return context;
}
