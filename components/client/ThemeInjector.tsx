'use client';

import { useEffect } from 'react';

export function ThemeInjector({ primaryColor, secondaryColor }: { primaryColor?: string, secondaryColor?: string }) {

    const applyStyles = (pColor?: string, sColor?: string) => {
        if (!pColor) return;
        const root = document.documentElement;
        root.style.setProperty('--crab-red', pColor);

        const hexToHsl = (hex: string) => {
            let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            if (!result) return null;
            let r = parseInt(result[1], 16);
            let g = parseInt(result[2], 16);
            let b = parseInt(result[3], 16);
            r /= 255; g /= 255; b /= 255;
            let max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h: number = 0, s, l = (max + min) / 2;
            if (max == min) { h = s = 0; }
            else {
                let d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                if (h) h /= 6;
            }
            if (h) h = Math.round(h * 360);
            s = Math.round(s * 100);
            l = Math.round(l * 100);
            return `${h} ${s}% ${l}%`;
        }

        const primaryHsl = hexToHsl(pColor);
        if (primaryHsl) {
            root.style.setProperty('--primary', primaryHsl);
        }

        if (sColor) {
            // Apply Secondary Color as Main Background
            root.style.setProperty('--background', sColor);
            // Also force body background if variable usage is inconsistent
            document.body.style.backgroundColor = sColor;
        }
    };

    useEffect(() => {
        applyStyles(primaryColor, secondaryColor);

        // Listen for preview messages
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'THEME_PREVIEW') {
                applyStyles(event.data.primaryColor, event.data.secondaryColor);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [primaryColor, secondaryColor]);

    return null; // Headless component
}
