'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateAdminSetupToken } from '@/app/actions/admin-helper';
import { toast } from 'sonner';
import { Edit2, Save, X, Eye, EyeOff } from 'lucide-react';

export function TokenEditor({ hasToken }: { hasToken: boolean }) {
    const [isEditing, setIsEditing] = useState(false);
    const [newToken, setNewToken] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!newToken) return;
        setLoading(true);
        const res = await updateAdminSetupToken(newToken);
        if (res.success) {
            toast.success("Security token updated successfully");
            setIsEditing(false);
            setNewToken("");
        } else {
            toast.error("Failed to update token");
        }
        setLoading(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 border shadow-sm">
                <Input
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    placeholder="Enter new token"
                    className="h-9 w-48 border-0 focus-visible:ring-0 px-2 font-mono text-sm"
                    autoFocus
                />
                <Button size="sm" onClick={handleSave} disabled={loading || !newToken} className="h-8 px-3 bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setNewToken(""); }} className="h-8 px-2 text-slate-500">
                    <X className="w-4 h-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <div className="font-mono font-bold bg-white px-3 py-1.5 rounded border border-purple-200 text-slate-700 min-w-[200px] text-center select-none tracking-widest">
                {hasToken ? "••••••••" : "Not Set"}
            </div>

            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 text-purple-700 border-purple-200 hover:bg-purple-100">
                <Edit2 className="w-3.5 h-3.5" /> {hasToken ? "Change" : "Set"}
            </Button>
        </div>
    );
}
