/**
 * Client-side helper to trigger server-side tracking
 */

interface TrackEventParams {
    eventName: string;
    eventData?: Record<string, unknown>;
    userData?: {
        email?: string;
        phone?: string;
        name?: string;
        area?: string;
        city?: string;
    };
}

export const trackEvent = async ({ eventName, eventData, userData }: TrackEventParams) => {
    try {
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
                eventData,
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
