import { NextRequest, NextResponse } from 'next/server';
import { trackMetaEvent } from '@/lib/serverTracking';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
    try {
        // 1. Security: Rate Limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        const isAllowed = await checkRateLimit(ip, 20, 60000); // 20 requests per minute
        if (!isAllowed) {
            return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
        }

        const body = await req.json();
        const { eventName, eventData, userData, sourceUrl } = body;

        // 2. Security: Input Validation
        if (!eventName || typeof eventName !== 'string' || eventName.length > 100) {
            return NextResponse.json({ success: false, error: 'Invalid eventName' }, { status: 400 });
        }

        // Basic payload size protection
        if (JSON.stringify(body).length > 20000) { // 20KB limit
            return NextResponse.json({ success: false, error: 'Payload too large' }, { status: 413 });
        }

        const userAgent = req.headers.get('user-agent') || '';

        // Merge provided user data with server-side info (PII will be hashed in the utility for Meta, but kept raw for DB)
        const fullUserData = {
            ...userData,
            clientIpAddress: ip,
            userAgent: userAgent,
        };

        // Trigger Tracking (Internal Logging + Meta CAPI)
        await trackMetaEvent(eventName, fullUserData, eventData, sourceUrl);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Track API Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to track event' }, { status: 500 });
    }
}
