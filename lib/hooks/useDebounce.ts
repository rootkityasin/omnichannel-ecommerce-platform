'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook that debounces a value
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Debounced callback function
 * Useful for search inputs, form validation, API calls, etc.
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 300
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return ((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }) as T;
}

/**
 * Throttle function - limits how often a function can be called
 * Useful for scroll handlers, resize listeners, etc.
 */
export function useThrottle<T>(value: T, interval: number = 500): T {
    const [throttledValue, setThrottledValue] = useState<T>(value);
    const lastUpdated = useRef<number>(0);

    useEffect(() => {
        const now = Date.now();
        if (now - lastUpdated.current >= interval) {
            lastUpdated.current = now;
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setThrottledValue(value);
        } else {
            const handler = setTimeout(() => {
                lastUpdated.current = Date.now();
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setThrottledValue(value);
            }, interval - (now - lastUpdated.current));

            return () => clearTimeout(handler);
        }
    }, [value, interval]);

    return throttledValue;
}
