'use client';

import { useState } from 'react';
import { authorizeDevice } from '@/app/actions/security';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function DeviceSetupPage() {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await authorizeDevice(token, navigator.userAgent);
            if (res.success) {
                toast.success("Device Authorized Successfully!");
                router.push('/admin'); // Redirect to dashboard
                router.refresh();
            } else {
                toast.error(res.error || "Setup failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                    <ShieldCheck className="w-8 h-8" />
                </div>

                <div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Device Security Check</h1>
                    <p className="text-slate-500 text-sm">
                        This device is not recognized. Please enter your <b>Admin Setup Token</b> to authorize this device for 30 days.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        placeholder="Enter Setup Token"
                        className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono text-center tracking-widest"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />

                    <button
                        disabled={loading || !token}
                        className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin w-4 h-4" />}
                        Authorize Device
                    </button>

                    <p className="text-xs text-slate-400">
                        If you don't have a token, contact your Super Admin.
                    </p>
                </form>
            </div>
        </div>
    );
}
