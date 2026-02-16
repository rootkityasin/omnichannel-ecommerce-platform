'use client';

import { useState, useEffect } from 'react';
import { getStorySections, updateStorySection } from '@/app/actions/story';
import { Button } from '@/components/ui/button';
import { Trash2, Phone, Ban, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';

export function BlockedListTab() {
    const [blockedPhones, setBlockedPhones] = useState<string[]>([]);
    const [blockedEmails, setBlockedEmails] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        setIsLoading(true);
        const sections = await getStorySections();
        const blockedSection = sections.find((s: any) => s.type === 'BLOCKED_CUSTOMERS');
        if (blockedSection?.content) {
            const content = blockedSection.content as any;
            setBlockedPhones(content.phones || []);
            setBlockedEmails(content.emails || []);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleUnblockPhone = async (phone: string) => {
        if (!confirm(`Unblock ${phone}?`)) return;

        const newPhones = blockedPhones.filter(p => p !== phone);
        setBlockedPhones(newPhones);
        await updateStorySection('BLOCKED_CUSTOMERS', { phones: newPhones, emails: blockedEmails });
        toast.success(`${phone} unblocked.`);
    };

    const handleUnblockEmail = async (email: string) => {
        if (!confirm(`Unblock ${email}?`)) return;

        const newEmails = blockedEmails.filter(e => e !== email);
        setBlockedEmails(newEmails);
        await updateStorySection('BLOCKED_CUSTOMERS', { phones: blockedPhones, emails: newEmails });
        toast.success(`${email} unblocked.`);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading block list...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Ban className="w-5 h-5 text-red-600" />
                    Blocked Phone Numbers
                </h2>
                <div className="space-y-2">
                    {blockedPhones.length > 0 ? blockedPhones.map(phone => (
                        <div key={phone} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-red-400" />
                                <span className="font-mono font-bold text-red-900">{phone}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleUnblockPhone(phone)} className="text-red-600 hover:text-red-700 hover:bg-red-100">
                                <Trash2 className="w-4 h-4 mr-2" /> Unblock
                            </Button>
                        </div>
                    )) : (
                        <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mb-2">
                                <AlertOctagon className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">No blocked numbers</p>
                            <p className="text-xs text-slate-400">Mark orders as "Fake" to add numbers here.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Emails Section (Optional) */}
            {blockedEmails.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-60">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Blocked Emails</h2>
                    <div className="space-y-2">
                        {blockedEmails.map(email => (
                            <div key={email} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span>{email}</span>
                                <Button variant="ghost" size="sm" onClick={() => handleUnblockEmail(email)}>Unblock</Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
