'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';

export function useGeolocation() {
    const { language } = useLanguageStore();
    const t = translations[language];
    const [isLocating, setIsLocating] = useState(false);

    const getGeoLocation = async () => {
        if (!('geolocation' in navigator)) {
            toast.error(t.geoNotSupported || "Geolocation is not supported by this browser.");
            return;
        }

        // Check if we are in a secure context (HTTPS or localhost)
        // Modern browsers block Geolocation on insecure origins
        if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
            toast.error("Browser security blocks location on insecure connections. Please use localhost or HTTPS.", {
                duration: 6000
            });
            return;
        }

        // Diagnostic: Check permission state if API is available
        if (navigator.permissions && navigator.permissions.query) {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                if (result.state === 'denied') {
                    toast.error("Location is blocked in your browser. Please click the 'Lock' icon in the address bar to Allow access.", {
                        duration: 8000,
                        id: "location-blocked"
                    });
                    return;
                }
            } catch (e) {
                console.error("Permission check failed", e);
            }
        }

        setIsLocating(true);
        toast.loading("Requesting browser permission...", { id: "location-toast" });

        // Simple options are often more reliable
        const options = {
            enableHighAccuracy: false,
            timeout: 15000, // Longer timeout for manual interaction
            maximumAge: 0   // Force fresh location
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                toast.dismiss("location-toast");
                setIsLocating(false);
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                const deliveryZones = [
                    { name: 'Dhaka', lat: 23.8103, lng: 90.4125 },
                    { name: 'Khulna', lat: 22.8456, lng: 89.5403 },
                    { name: 'Chottogram', lat: 22.3569, lng: 91.7832 }
                ];

                let nearestCity = null;
                let minDistance = Infinity;

                deliveryZones.forEach(zone => {
                    const R = 6371;
                    const dLat = (zone.lat - userLat) * (Math.PI / 180);
                    const dLon = (zone.lng - userLng) * (Math.PI / 180);
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(userLat * (Math.PI / 180)) * Math.cos(zone.lat * (Math.PI / 180)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const d = R * c;

                    if (d < minDistance) {
                        minDistance = d;
                        nearestCity = zone.name;
                    }
                });

                if (minDistance <= 25) {
                    toast.success(`${t.deliveryAreaSuccess} ${nearestCity}.`, { duration: 5000 });
                } else {
                    toast.error(t.deliveryAreaFail || "Sorry, we don't deliver to your area yet.", { duration: 5000 });
                }
            },
            (error) => {
                toast.dismiss("location-toast");
                setIsLocating(false);
                let errorMessage = "Location check failed.";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Please click 'Allow' in the browser popup. If you don't see it, check the lock icon in the address bar.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location unavailable. Please check your GPS.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out. Please try again.";
                        break;
                }

                toast.error(errorMessage, { duration: 6000 });
                console.error("Geolocation Error:", error);
            },
            options
        );
    };

    return { getGeoLocation, isLocating };
}
