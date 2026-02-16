import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";

interface AuditLogParams {
    tenantId: string | null;
    actor: { name: string; email: string };
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'settings_update';
    entity: 'Product' | 'Order' | 'Settings' | 'User' | 'Category';
    entityId?: string;
    details: string;
    metadata?: Prisma.InputJsonValue;
}

/**
 * Enterprise Audit Logging
 * Tracks critical actions for compliance and accountability.
 */
export async function logAudit(params: AuditLogParams) {
    try {
        const headersList = await headers();
        const ip = headersList.get("x-forwarded-for")?.split(',')[0] || "unknown";
        const userAgent = headersList.get("user-agent") || "unknown";

        // Non-blocking write
        await prisma.auditLog.create({
            data: {
                tenantId: params.tenantId,
                actorName: params.actor.name,
                actorEmail: params.actor.email,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                details: params.details,
                metadata: (params.metadata || {}) as Prisma.InputJsonValue,
                ipAddress: ip,
                userAgent: userAgent,
            },
        });
    } catch (error) {
        console.error("⚠️ Audit Log Failed:", error);
        // We do NOT throw here to prevent blocking the user flow
    }
}
