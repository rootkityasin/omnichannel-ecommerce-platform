'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Terminal, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

interface SignalDataCellProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    eventName: string;
}

export function SignalDataCell({ data, eventName }: SignalDataCellProps) {
    const [copied, setCopied] = useState(false);
    const jsonString = JSON.stringify(data, null, 2);

    const handleCopy = () => {
        navigator.clipboard.writeText(jsonString);
        setCopied(true);
        toast.success("Signal data copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const isNoData = !data || (typeof data === 'object' && Object.keys(data).length === 0);

    return (
        <div className="flex items-center gap-3 group">
            <div className="text-xs text-slate-600 font-medium truncate max-w-[200px]">
                {isNoData ? (
                    <span className="text-slate-400 italic">No extra data</span>
                ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    Object.entries(data as any)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(', ')
                )}
            </div>

            {!isNoData && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white border-slate-200">
                        <DialogHeader className="border-b pb-4 mb-4">
                            <div className="flex items-center justify-between pr-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <Terminal className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-xl font-black text-slate-900 leading-none">
                                            Signal Detail
                                        </DialogTitle>
                                        <p className="text-sm text-slate-500 font-medium mt-1">
                                            Full data payload for <span className="text-blue-600 font-bold">{eventName}</span>
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopy}
                                    className="h-9 gap-2 border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider"
                                >
                                    {copied ? (
                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                    ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                    )}
                                    {copied ? 'Copied' : 'Copy JSON'}
                                </Button>
                            </div>
                        </DialogHeader>

                        <div className="relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-slate-50/50 rounded-xl -z-10" />
                            <pre className="p-6 text-sm font-mono text-slate-700 overflow-auto max-h-[60vh] popup-scrollbar selection:bg-blue-100 italic leading-relaxed">
                                <code>{jsonString}</code>
                            </pre>
                        </div>

                        <div className="mt-4 flex items-center gap-2 px-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Valid JSON Signal Captured
                            </span>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
