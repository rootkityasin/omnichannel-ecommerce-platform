'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Loader2 } from 'lucide-react';
import { getEventsByDuration } from '@/app/actions/event';
import { toast } from 'sonner';

export function EventExportButton() {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async (days: number) => {
        setIsExporting(true);
        const toastId = toast.loading(`Generating Event Matrix report for last ${days} days...`);

        try {
            const events = await getEventsByDuration(days);

            if (!events || events.length === 0) {
                toast.error(`No events found for the last ${days} days.`, { id: toastId });
                return;
            }

            // CSV Creation
            const headers = ['Time', 'Event Name', 'Customer Name', 'Phone', 'City/Area', 'IP Address', 'Source URL', 'Signal Data'];
            const rows = events.map(event => [
                new Date(event.createdAt).toLocaleString(),
                event.eventName,
                `"${event.customerName || 'Anonymous'}"`,
                event.customerPhone || '',
                `"${(event.customerCity || '')} ${(event.customerArea ? '(' + event.customerArea + ')' : '')}"`.trim(),
                event.ipAddress || '',
                `"${event.sourceUrl || ''}"`,
                `"${JSON.stringify(event.eventData).replace(/"/g, '""')}"` // Escape quotes for CSV
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            const now = new Date();
            a.href = url;
            a.download = `Event_Matrix_${days}Days_${now.toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success(`Success! ${events.length} events exported.`, { id: toastId });
        } catch (error) {
            console.error('Export failed:', error);
            toast.error("Failed to generate report. Please try again.", { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-xs font-bold uppercase tracking-wider h-10 gap-2 border-slate-200 hover:bg-slate-50 shadow-sm" disabled={isExporting}>
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    {isExporting ? 'Exporting...' : 'Export Excel'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white border-slate-200">
                <DropdownMenuLabel className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-3">Select Duration</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => handleExport(7)} className="cursor-pointer font-bold text-slate-700 text-xs py-2.5">
                    Last 7 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(15)} className="cursor-pointer font-bold text-slate-700 text-xs py-2.5">
                    Last 15 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(30)} className="cursor-pointer font-bold text-slate-700 text-xs py-2.5">
                    Last 30 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport(90)} className="cursor-pointer font-bold text-slate-700 text-xs py-2.5">
                    Last 90 Days
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
