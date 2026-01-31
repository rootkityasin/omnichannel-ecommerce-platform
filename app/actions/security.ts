'use server';

import { prisma } from '@/lib/prisma';
import { cookies, headers } from 'next/headers';
import { UAParser } from 'ua-parser-js';

const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET || "crab-secret-setup-123";

// Generate a random device ID
function generateDeviceId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function authorizeDevice(token: string, userAgentString: string) {
    try {
        const config = await prisma.siteConfig.findFirst({
            select: { adminSetupToken: true }
        });
        const validTokenRaw = config?.adminSetupToken || process.env.ADMIN_SETUP_SECRET || "crab-secret-setup-123";
        const VALID_TOKEN = validTokenRaw.trim(); // Handle accidental trailing spaces

        if (token.trim() !== VALID_TOKEN) {
            return { success: false, error: "Invalid Setup Token" };
        }

        const deviceId = generateDeviceId();
        const ua = new UAParser(userAgentString);
        const os = ua.getOS().name || "Unknown OS";
        const browser = ua.getBrowser().name || "Unknown Browser";
        const deviceType = ua.getDevice().type || "Desktop";
        const deviceName = `${browser} on ${os}`;

        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || "127.0.0.1";

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 2); // 2 Hours Validity

        await prisma.trustedDevice.create({
            data: {
                deviceId,
                name: deviceName,
                userAgent: userAgentString,
                ipAddress: ip,
                os,
                browser,
                deviceType,
                expiresAt
            }
        });

        // Set Cookie
        const isLocal = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes('localhost');
        const cookieStore = await cookies();

        cookieStore.set('trusted_device', deviceId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && !isLocal && !process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes('localhost'),
            expires: expiresAt,
            path: '/'
        });

        // Set verification timestamp cookie (for throttling DB checks)
        cookieStore.set('device_verified', Date.now().toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' && !isLocal && !process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes('localhost'),
            maxAge: 60 * 60 * 2, // 2 hours
            path: '/'
        });

        // Log it
        await prisma.securityLog.create({
            data: {
                ipAddress: ip,
                action: "DEVICE_AUTHORIZED",
                severity: "HIGH",
                details: `Authorized: ${deviceName} (${ip})`,
                userAgent: userAgentString
            }
        });

        // Notify Admins
        if (prisma.notification) {
            await prisma.notification.create({
                data: {
                    title: "Security Alert: New Device",
                    message: `Authorized ${deviceName} from IP ${ip}. Review if suspicious.`,
                    type: "WARNING"
                }
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Device Auth Error:", error);
        return { success: false, error: "System Error" };
    }
}

export async function checkDeviceTrust() {
    try {
        const cookieStore = await cookies();
        const deviceId = cookieStore.get('trusted_device')?.value;

        if (!deviceId) return false;

        const device = await prisma.trustedDevice.findUnique({
            where: { deviceId }
        });

        if (!device) return false;
        if (new Date() > device.expiresAt) return false;

        return true;
    } catch (error) {
        console.error("Check Trust Error:", error);
        return false;
    }
}

export async function revokeDevice(deviceId: string) {
    try {
        await prisma.trustedDevice.delete({
            where: { id: deviceId }
        });

        // Log it
        await prisma.securityLog.create({
            data: {
                ipAddress: "ADMIN_ACTION",
                action: "DEVICE_REVOKED",
                severity: "HIGH",
                details: `Revoked device ID: ${deviceId}`
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Revoke Device Error:", error);
        return { success: false, error: "Failed to revoke device" };
    }
}

export async function logSecurityEvent(action: string, severity: string, details?: string) {
    try {
        await prisma.securityLog.create({
            data: {
                ipAddress: "UNKNOWN",
                action,
                severity,
                details
            }
        });
    } catch (e) {
        // limit crash risk
        console.error("Log failed", e);
    }
}
