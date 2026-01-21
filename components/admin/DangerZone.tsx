'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export function DangerZone() {
    return (
        <Card className="p-6 border-red-200 bg-red-50">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-700">
                <span className="w-2 h-6 bg-red-600 rounded-full" />
                Danger Zone
            </h2>
            <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-red-200">
                    <h3 className="font-semibold text-red-900 mb-2">Reset Database</h3>
                    <p className="text-sm text-red-700 mb-4">
                        This action will permanently delete all data including <strong>Products, Orders, Customers, and Categories</strong>.
                        <br />
                        <strong>Your current Admin Account will be preserved.</strong>
                    </p>
                    <Button
                        onClick={async () => {
                            const confirm = window.prompt("To confirm, type 'DELETE' in the box below.\n\nWARNING: THISCANNOT BE UNDONE.");
                            if (confirm === 'DELETE') {
                                toast.promise(
                                    (async () => {
                                        const { resetDatabaseAction } = await import('@/app/actions/admin-reset');
                                        const res = await resetDatabaseAction();
                                        if (!res.success) throw new Error(res.message);
                                        return res.message;
                                    })(),
                                    {
                                        loading: 'Resetting Database... (This may take a moment)',
                                        success: 'Database has been reset successfully.',
                                        error: (err) => `Failed: ${err.message}`
                                    }
                                );
                            } else if (confirm !== null) {
                                toast.error("Confirmation failed. You must type 'DELETE' exactly.");
                            }
                        }}
                        variant="destructive"
                        className="w-full sm:w-auto"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Reset Entire Database
                    </Button>
                </div>
            </div>
        </Card>
    );
}
