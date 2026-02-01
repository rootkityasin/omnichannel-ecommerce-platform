
interface RateLimitContext {
    count: number;
    lastReset: number;
}

const activeWindows = new Map<string, RateLimitContext>();

export async function checkRateLimit(ipOrIdentifier: string, limit: number = 5, windowMs: number = 60000): Promise<boolean> {
    const now = Date.now();
    const context = activeWindows.get(ipOrIdentifier) || { count: 0, lastReset: now };

    // Reset if window has passed
    if (now - context.lastReset > windowMs) {
        context.count = 0;
        context.lastReset = now;
    }

    if (context.count >= limit) {
        return false; // Rate limit exceeded
    }

    context.count++;
    activeWindows.set(ipOrIdentifier, context);
    return true; // Allowed
}
