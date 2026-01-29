import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // SOC 2 Availability Check: Verify Database Connection
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json(
            {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                services: {
                    database: 'connected',
                    web: 'running'
                },
                compliance: {
                    soc2: 'readiness-check-active'
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Health Check Failed:', error);
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: 'Database connection failed'
            },
            { status: 503 }
        );
    }
}
