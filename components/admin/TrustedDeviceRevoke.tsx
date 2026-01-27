'use client';

import { revokeDevice } from '@/app/actions/security';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function TrustedDeviceRevoke({ deviceId, deviceName }: { deviceId: string, deviceName: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRevoke = async () => {
        if (!confirm(`Are you sure you want to revoke access for ${deviceName}?`)) return;

        setIsLoading(true);
        try {
            const res = await revokeDevice(deviceId);
            if (res.success) {
                toast.success("Device revoked successfully");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to revoke");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={handleRevoke}
            disabled={isLoading}
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
    );
}
