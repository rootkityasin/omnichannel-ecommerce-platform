import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from './rate-limit';

describe('Rate Limiting Logic (ISO 27001 Control)', () => {

    beforeEach(() => {
        // Reset time to a fixed point
        vi.useFakeTimers();
    });

    it('should allow requests within the limit', () => {
        const ip = "192.168.1.1";
        expect(checkRateLimit(ip, 5, 60000)).toBe(true);
        expect(checkRateLimit(ip, 5, 60000)).toBe(true);
    });

    it('should block requests exceeding the limit', () => {
        const ip = "192.168.1.2";
        // Consume all 3 allowed tokens
        checkRateLimit(ip, 3, 60000); // 1
        checkRateLimit(ip, 3, 60000); // 2
        checkRateLimit(ip, 3, 60000); // 3

        // 4th request should fail
        expect(checkRateLimit(ip, 3, 60000)).toBe(false);
    });

    it('should reset limit after window expires', () => {
        const ip = "192.168.1.3";
        const limit = 2;
        const window = 1000;

        // Use up limit
        checkRateLimit(ip, limit, window);
        checkRateLimit(ip, limit, window);
        expect(checkRateLimit(ip, limit, window)).toBe(false); // Blocked

        // Advance time past window
        vi.advanceTimersByTime(window + 100);

        // Should work again
        expect(checkRateLimit(ip, limit, window)).toBe(true);
    });
});
