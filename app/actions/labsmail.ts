'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const normalizeBaseUrl = (baseUrl: string) => {
    const trimmed = (baseUrl || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
};

const LABSMAIL_SCHEMA_ERROR =
    'LabsMail fields are missing in the database. Run `npx prisma db push` and restart the server.';
const LABSMAIL_SAVE_ERROR = 'Failed to save LabsMail settings.';
const LABSMAIL_EXPORT_ERROR = 'Failed to export leads. Check the LabsMail URL and API key.';
const LABSMAIL_ENCRYPTION_PREFIX = 'enc:v1:';
const LABSMAIL_ALLOWED_HOSTS = (process.env.LABSMAIL_ALLOWED_HOSTS || '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

const isMissingColumnError = (error: unknown) => {
    if (!error || typeof error !== 'object') return false;
    return (error as { code?: string }).code === 'P2022';
};

const getErrorMeta = (error: unknown) => {
    if (!error || typeof error !== 'object') {
        return { code: undefined, message: 'Unknown error' };
    }

    const withCode = error as { code?: string; message?: string };
    return {
        code: withCode.code,
        message: withCode.message || 'Unknown error'
    };
};

const isLocalHostname = (hostname: string) => {
    const value = hostname.toLowerCase();
    return value === 'localhost' || value === '127.0.0.1' || value === '::1';
};

const validateBaseUrl = (value: string) => {
    const normalized = normalizeBaseUrl(value);
    if (!normalized) return { normalized, error: '' } as const;

    let parsed: URL;
    try {
        parsed = new URL(normalized);
    } catch {
        return { normalized: '', error: 'LabsMail base URL is invalid.' } as const;
    }

    const protocol = parsed.protocol.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();
    if (protocol !== 'https:' && !(protocol === 'http:' && isLocalHostname(hostname))) {
        return {
            normalized: '',
            error: 'LabsMail base URL must use HTTPS (HTTP is only allowed for localhost).'
        } as const;
    }

    if (LABSMAIL_ALLOWED_HOSTS.length > 0 && !LABSMAIL_ALLOWED_HOSTS.includes(hostname)) {
        return {
            normalized: '',
            error: 'LabsMail base URL host is not allowed.'
        } as const;
    }

    return { normalized: parsed.origin, error: '' } as const;
};

const getEncryptionKey = () => {
    const secret = process.env.LABSMAIL_KEY_ENCRYPTION_SECRET;
    if (!secret) return null;
    return createHash('sha256').update(secret).digest();
};

const encryptApiKey = (apiKey: string) => {
    const key = getEncryptionKey();
    if (!key) return apiKey;

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${LABSMAIL_ENCRYPTION_PREFIX}${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
};

const decryptApiKey = (apiKey: string) => {
    if (!apiKey.startsWith(LABSMAIL_ENCRYPTION_PREFIX)) return apiKey;

    const key = getEncryptionKey();
    if (!key) return '';

    const payload = apiKey.slice(LABSMAIL_ENCRYPTION_PREFIX.length);
    const [ivBase64, tagBase64, encryptedBase64] = payload.split('.');
    if (!ivBase64 || !tagBase64 || !encryptedBase64) return '';

    try {
        const iv = Buffer.from(ivBase64, 'base64');
        const tag = Buffer.from(tagBase64, 'base64');
        const encrypted = Buffer.from(encryptedBase64, 'base64');
        const decipher = createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    } catch {
        return '';
    }
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

const requireAdmin = async () => {
    const session = await auth();
    const user = session?.user as { role?: string; tenantId?: string } | undefined;
    const role = user?.role;
    const tenantId = user?.tenantId;

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
            apiKey: decryptApiKey(config?.labsmailLeadKey || ''),
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

    const normalizedApiKey = (input.apiKey || '').trim();
    const urlValidation = validateBaseUrl(input.baseUrl);

    if (urlValidation.error) {
        return { success: false, error: urlValidation.error };
    }

    if (input.isActive && (!urlValidation.normalized || !normalizedApiKey)) {
        return { success: false, error: 'Base URL and API key are required when LabsMail export is enabled.' };
    }

    const encryptedApiKey = normalizedApiKey ? encryptApiKey(normalizedApiKey) : '';

    try {
        await prisma.siteConfig.upsert({
            where: { tenantId: authContext.tenantId },
            create: {
                tenantId: authContext.tenantId,
                labsmailBaseUrl: urlValidation.normalized,
                labsmailLeadKey: encryptedApiKey,
                labsmailActive: input.isActive
            },
            update: {
                labsmailBaseUrl: urlValidation.normalized,
                labsmailLeadKey: encryptedApiKey,
                labsmailActive: input.isActive
            }
        });

        revalidatePath('/admin/labsmail', 'page');
        return { success: true };
    } catch (error) {
        const errorMeta = getErrorMeta(error);
        console.error('[LabsMail Save Error]', {
            tenantId: authContext.tenantId,
            code: errorMeta.code,
            message: errorMeta.message
        });
        return {
            success: false,
            error: isMissingColumnError(error)
                ? LABSMAIL_SCHEMA_ERROR
                : LABSMAIL_SAVE_ERROR
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

    const baseUrlValidation = validateBaseUrl(config.labsmailBaseUrl || '');
    const baseUrl = baseUrlValidation.normalized;
    const apiKey = decryptApiKey((config.labsmailLeadKey || '').trim()).trim();

    if (baseUrlValidation.error) {
        return { success: false, error: baseUrlValidation.error };
    }

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

    const phones = Array.from(new Set(customers.map((customer) => customer.phone).filter(Boolean))) as string[];

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

    const statsMap = orders.reduce<Record<string, { count: number; spent: number }>>((acc, order) => {
        const key = order.customerPhone || '';
        if (!key) return acc;
        if (!acc[key]) acc[key] = { count: 0, spent: 0 };
        acc[key].count += 1;
        acc[key].spent += order.totalAmount || 0;
        return acc;
    }, {});

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
            const response = await fetchWithTimeout(url.toString(), {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'User-Agent': 'CrabKhai-LabsMail-Exporter/1.0'
                },
                body: JSON.stringify({ leads: chunk }),
                cache: 'no-store'
            }, 15000);

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const message =
                    errorPayload?.error ||
                    errorPayload?.message ||
                    `Failed to export leads (${response.status})`;
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
        const errorMeta = getErrorMeta(error);
        console.error('[LabsMail Export Error]', {
            tenantId: authContext.tenantId,
            code: errorMeta.code,
            message: errorMeta.message
        });
        return { success: false, error: LABSMAIL_EXPORT_ERROR };
    }
}
