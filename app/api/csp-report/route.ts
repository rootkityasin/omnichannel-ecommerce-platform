import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const report = body['csp-report'] || body;

        const blockedUri = report['blocked-uri'] || 'unknown';
        const violatedDirective = report['violated-directive'] || 'unknown';
        const originalPolicy = report['original-policy'] || 'unknown';

        // Log to Database
        await prisma.securityLog.create({
            data: {
                ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
                action: 'CSP_VIOLATION',
                severity: 'WARNING',
                details: `Blocked: ${blockedUri} | Directive: ${violatedDirective}`,
                userAgent: req.headers.get('user-agent') || 'unknown',
            }
        });

        // Still log to console for immediate debug
        console.warn('CSP Violation Saved:', JSON.stringify(report, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("CSP Report Error", error);
        return NextResponse.json({ success: false }, { status: 400 });
    }
}
