/**
 * Client-side helper to trigger server-side tracking
 */

interface TrackEventParams {
    eventName: string;
    eventData?: Record<string, unknown>;
    eventId?: string;
    dataLayerEventName?: string;
    userData?: {
        email?: string;
        phone?: string;
        name?: string;
        area?: string;
        city?: string;
    };
}

const createEventId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const trackEvent = async ({ eventName, eventData, userData, eventId, dataLayerEventName }: TrackEventParams) => {
    try {
        const resolvedEventId = eventId || createEventId();
        const eventDataWithoutEventId = { ...(eventData || {}) };
        delete eventDataWithoutEventId.event_id;

        const mergedEventData = {
            ...eventDataWithoutEventId,
            event_id: resolvedEventId,
        };

        const windowWithDataLayer = window as typeof window & {
            dataLayer?: Record<string, unknown>[];
        };

        windowWithDataLayer.dataLayer = windowWithDataLayer.dataLayer || [];
        windowWithDataLayer.dataLayer.push({
            event: dataLayerEventName || eventName,
            event_name: eventName,
            ...mergedEventData,
        });

        // Get Facebook cookies if they exist
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
            return undefined;
        };

        const fbp = getCookie('_fbp');
        const fbc = getCookie('_fbc');

        const response = await fetch('/api/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                eventName,
                eventData: mergedEventData,
                userData: {
                    ...userData,
                    fbp,
                    fbc,
                },
                sourceUrl: window.location.href,
            }),
        });

        if (!response.ok) {
            console.error('Track API Error:', response.status, response.statusText);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Client Track Error:', error);
    }
};
