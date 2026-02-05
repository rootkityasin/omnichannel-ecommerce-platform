'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const normalizeBaseUrl = (baseUrl: string) => {
    const trimmed = (baseUrl || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
};

const globalForLabsmail = globalThis as unknown as { labsmailSchemaReady?: boolean };
const LABSMAIL_SCHEMA_ERROR =
    'LabsMail fields are missing in the database. Run `npx prisma db push` and restart the server.';

const isMissingColumnError = (error: unknown) => {
    if (!error || typeof error !== 'object') return false;
    return (error as { code?: string }).code === 'P2022';
};

const ensureLabsmailColumns = async () => {
    if (globalForLabsmail.labsmailSchemaReady) return;
    await prisma.$executeRaw`
        ALTER TABLE IF EXISTS "SiteConfig"
            ADD COLUMN IF NOT EXISTS "labsmailBaseUrl" TEXT,
            ADD COLUMN IF NOT EXISTS "labsmailLeadKey" TEXT,
            ADD COLUMN IF NOT EXISTS "labsmailActive" BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "labsmailLastExportedAt" TIMESTAMP(3)
    `;
    globalForLabsmail.labsmailSchemaReady = true;
};

const requireAdmin = async () => {
    const session = await auth();
    const role = (session?.user as any)?.role;
    const tenantId = (session?.user as any)?.tenantId as string | undefined;

    if (!session?.user || role === 'USER') {
        return { error: 'Unauthorized' } as const;
    }

    if (!tenantId) {
        return { error: 'Tenant not found' } as const;
    }

    return { session, role, tenantId } as const;
};

export async function getLabsmailConfig() {
    const authContext = await requireAdmin();
    if ('error' in authContext) {
        return {
            baseUrl: '',
            apiKey: '',
            isActive: false,
            lastExportedAt: null,
            error: authContext.error
        };
    }

    try {
        await ensureLabsmailColumns();
        const config = await prisma.siteConfig.findFirst({
            where: { tenantId: authContext.tenantId },
            select: {
                labsmailBaseUrl: true,
                labsmailLeadKey: true,
                labsmailActive: true,
                labsmailLastExportedAt: true
            }
        });

        return {
            baseUrl: config?.labsmailBaseUrl || '',
            apiKey: config?.labsmailLeadKey || '',
            isActive: config?.labsmailActive ?? false,
            lastExportedAt: config?.labsmailLastExportedAt || null
        };
    } catch (error) {
        return {
            baseUrl: '',
            apiKey: '',
            isActive: false,
            lastExportedAt: null,
            error: isMissingColumnError(error)
                ? LABSMAIL_SCHEMA_ERROR
                : 'Unable to load LabsMail settings.'
        };
    }
}

export async function saveLabsmailConfig(input: {
    baseUrl: string;
    apiKey: string;
    isActive: boolean;
}) {
    const authContext = await requireAdmin();
    if ('error' in authContext) {
        return { success: false, error: authContext.error };
    }

    const baseUrl = normalizeBaseUrl(input.baseUrl);

    try {
        await ensureLabsmailColumns();
        await prisma.siteConfig.upsert({
            where: { tenantId: authContext.tenantId },
            create: {
                tenantId: authContext.tenantId,
                labsmailBaseUrl: baseUrl,
                labsmailLeadKey: input.apiKey,
                labsmailActive: input.isActive
            },
            update: {
                labsmailBaseUrl: baseUrl,
                labsmailLeadKey: input.apiKey,
                labsmailActive: input.isActive
            }
        });

        revalidatePath('/admin/labsmail', 'page');
        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: isMissingColumnError(error)
                ? LABSMAIL_SCHEMA_ERROR
                : 'Failed to save LabsMail settings.'
        };
    }
}

const chunkArray = <T,>(items: T[], chunkSize: number) => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
};

export async function exportLabsmailLeads(options?: { days?: number }) {
    const authContext = await requireAdmin();
    if ('error' in authContext) {
        return { success: false, error: authContext.error };
    }

    let config;
    try {
        await ensureLabsmailColumns();
        config = await prisma.siteConfig.findFirst({
            where: { tenantId: authContext.tenantId },
            select: {
                labsmailBaseUrl: true,
                labsmailLeadKey: true,
                labsmailActive: true
            }
        });
    } catch (error) {
        return {
            success: false,
            error: isMissingColumnError(error)
                ? LABSMAIL_SCHEMA_ERROR
                : 'Unable to load LabsMail settings.'
        };
    }

    if (!config?.labsmailActive) {
        return { success: false, error: 'LabsMail integration is not active.' };
    }

    const baseUrl = normalizeBaseUrl(config.labsmailBaseUrl || '');
    const apiKey = (config.labsmailLeadKey || '').trim();

    if (!baseUrl || !apiKey) {
        return { success: false, error: 'Base URL or API key is missing.' };
    }

    const cutoffDate = options?.days
        ? new Date(Date.now() - options.days * 24 * 60 * 60 * 1000)
        : undefined;

    const customers = await prisma.user.findMany({
        where: {
            role: 'USER',
            tenantId: authContext.tenantId,
            ...(cutoffDate ? { createdAt: { gte: cutoffDate } } : {})
        },
        select: { id: true, name: true, email: true, phone: true, createdAt: true }
    });

    if (!customers.length) {
        return { success: false, error: 'No customers found to export.' };
    }

    const phones = Array.from(new Set(customers.map((c) => c.phone).filter(Boolean))) as string[];

    const orders = phones.length
        ? await prisma.order.findMany({
            where: {
                customerPhone: { in: phones },
                tenantId: authContext.tenantId,
                status: { not: 'CANCELLED' }
            },
            select: { customerPhone: true, totalAmount: true }
        })
        : [];

    const statsMap = orders.reduce((acc, order) => {
        const key = order.customerPhone || '';
        if (!key) return acc;
        if (!acc[key]) acc[key] = { count: 0, spent: 0 };
        acc[key].count += 1;
        acc[key].spent += order.totalAmount || 0;
        return acc;
    }, {} as Record<string, { count: number; spent: number }>);

    const leads = customers.map((customer) => {
        const stats = customer.phone ? statsMap[customer.phone] : undefined;
        const value = stats?.spent || undefined;
        const status = stats?.count ? 'qualified' : 'new';
        const notes = stats?.count
            ? `Imported from CrabKhai. Orders: ${stats.count}. Spent: ${stats.spent}.`
            : 'Imported from CrabKhai.';

        return {
            name: customer.name || 'Unknown',
            email: customer.email,
            phone: customer.phone || undefined,
            source: 'crabkhai',
            status,
            value,
            notes
        };
    });

    try {
        const url = new URL('/api/leads/ingest', baseUrl);
        const chunks = chunkArray(leads, 200);
        const totals = { created: 0, updated: 0, skipped: 0 };

        for (const chunk of chunks) {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({ leads: chunk }),
                cache: 'no-store'
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const message = errorPayload?.error || `Failed to export leads (${response.status})`;
                return { success: false, error: message };
            }

            const payload = await response.json();
            const result = payload?.results || {};
            totals.created += result.created || 0;
            totals.updated += result.updated || 0;
            totals.skipped += result.skipped || 0;
        }

        const lastExportedAt = new Date();
        await prisma.siteConfig.update({
            where: { tenantId: authContext.tenantId },
            data: { labsmailLastExportedAt: lastExportedAt }
        });

        revalidatePath('/admin/labsmail', 'page');

        return {
            success: true,
            totalLeads: leads.length,
            results: totals,
            lastExportedAt
        };
    } catch (error) {
        return { success: false, error: 'Failed to export leads. Check the LabsMail URL and API key.' };
    }
}
