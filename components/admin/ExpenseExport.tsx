'use client';

import { Button } from "@/components/ui/button";
import { Download, FileDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function ExpenseExport({ expenses }: { expenses: { date: string | Date; title: string; amount: number; category: string; hub?: { name: string } }[] }) {

    const downloadCSV = (days: number) => {
        const now = new Date();
        const pastDate = new Date();
        pastDate.setDate(now.getDate() - days);

        const filtered = expenses.filter(e => new Date(e.date) >= pastDate);

        if (filtered.length === 0) {
            toast.error(`No expenses found in the last ${days} days.`);
            return;
        }

        // CSV Header
        let csv = "Date,Title,Category,Amount,Hub\n";

        // CSV Rows
        filtered.forEach(e => {
            const dateStr = new Date(e.date).toLocaleDateString();
            const hubName = e.hub?.name || 'General';
            const cleanTitle = e.title.replace(/,/g, ' '); // Escape commas
            csv += `${dateStr},${cleanTitle},${e.category},${e.amount},${hubName}\n`;
        });

        // Trigger Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_report_${days}days.csv`;
        a.click();

        toast.success(`Downloaded report for last ${days} days`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 border-slate-200">
                    <FileDown className="w-4 h-4 text-green-600" />
                    Export Report
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadCSV(7)}>
                    Last 7 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadCSV(15)}>
                    Last 15 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadCSV(30)}>
                    Last 30 Days
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
