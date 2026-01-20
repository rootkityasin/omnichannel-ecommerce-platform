'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguageStore } from '@/lib/languageStore';
import { translations } from '@/lib/translations';

export function useGeolocation() {
    const { language } = useLanguageStore();
    const t = translations[language];
    const [isLocating, setIsLocating] = useState(false);

    const getGeoLocation = () => {
        if (!('geolocation' in navigator)) {
            toast.error(t.geoNotSupported || "Geolocation is not supported by this browser.");
            return;
        }

        setIsLocating(true);
        toast.loading("Locating you...", { id: "location-toast" });

        const options = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 1000 * 60 * 5 // 5 minutes
        };

        navigator.geolocation.getCurrentPosition(
            (position) => {
                toast.dismiss("location-toast");
                setIsLocating(false);
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Define your delivery zones here or fetch from config
                const deliveryZones = [
                    { name: 'Dhaka', lat: 23.8103, lng: 90.4125 },
                    { name: 'Khulna', lat: 22.8456, lng: 89.5403 },
                    { name: 'Chottogram', lat: 22.3569, lng: 91.7832 }
                ];

                let nearestCity = null;
                let minDistance = Infinity;

                deliveryZones.forEach(zone => {
                    const R = 6371; // Radius of the earth in km
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

                if (minDistance <= 25) { // Increased slightly 20 -> 25
                    toast.success(`${t.deliveryAreaSuccess} ${nearestCity}.`, { duration: 5000 });
                } else {
                    toast.error(t.deliveryAreaFail || "Sorry, we don't deliver to your area yet.", { duration: 5000 });
                }
            },
            (error) => {
                toast.dismiss("location-toast");
                setIsLocating(false);
                let errorMessage = "Location access failed.";

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location access denied. Please enable location permissions in your browser settings for this site.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable. Please try again.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out. Please check your connection.";
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
