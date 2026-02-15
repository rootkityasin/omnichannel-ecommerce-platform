import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from './rate-limit';

describe('Rate Limiting Logic (ISO 27001 Control)', () => {

    beforeEach(() => {
        // Reset time to a fixed point
        vi.useFakeTimers();
    });

    it('should allow requests within the limit', async () => {
        const ip = "192.168.1.1";
        await expect(checkRateLimit(ip, 5, 60000)).resolves.toBe(true);
        await expect(checkRateLimit(ip, 5, 60000)).resolves.toBe(true);
    });

    it('should block requests exceeding the limit', async () => {
        const ip = "192.168.1.2";
        // Consume all 3 allowed tokens
        await checkRateLimit(ip, 3, 60000); // 1
        await checkRateLimit(ip, 3, 60000); // 2
        await checkRateLimit(ip, 3, 60000); // 3

        // 4th request should fail
        await expect(checkRateLimit(ip, 3, 60000)).resolves.toBe(false);
    });

    it('should reset limit after window expires', async () => {
        const ip = "192.168.1.3";
        const limit = 2;
        const window = 1000;

        // Use up limit
        await checkRateLimit(ip, limit, window);
        await checkRateLimit(ip, limit, window);
        await expect(checkRateLimit(ip, limit, window)).resolves.toBe(false); // Blocked

        // Advance time past window
        vi.advanceTimersByTime(window + 100);

        // Should work again
        await expect(checkRateLimit(ip, limit, window)).resolves.toBe(true);
    });
});
