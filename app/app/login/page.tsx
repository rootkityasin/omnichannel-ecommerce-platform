
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SuperAdminLogin() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await signIn('credentials', {
                phone: formData.phone,
                password: formData.password,
                redirect: false,
            });

            if (res?.error) {
                toast.error("Invalid Credentials");
                setIsLoading(false);
            } else {
                toast.success("Welcome Back, Admin");
                // Force a hard reload to ensure middleware/session updates apply immediately
                window.location.href = '/';
            }
        } catch (error) {
            toast.error("Something went wrong");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-xl p-8 shadow-2xl">
                <div className="flex flex-col items-center mb-8 space-y-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">Platform Admin</h1>
                    <p className="text-slate-400 text-sm">Restricted Access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Phone / Email</Label>
                        <Input
                            id="phone"
                            placeholder="Enter credentials"
                            className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:ring-blue-600 focus:border-blue-600"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-600 focus:ring-blue-600 focus:border-blue-600"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-5"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authenticate"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-slate-600">
                        Unauthorized access is prohibited and monitored.
                    </p>
                </div>
            </div>
        </div>
    );
}
