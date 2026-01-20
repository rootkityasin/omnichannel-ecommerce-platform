'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface LocationPermissionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function LocationPermissionDialog({
    isOpen,
    onOpenChange,
    onConfirm,
}: LocationPermissionDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[360px] p-0 overflow-hidden border-white/20 bg-white/70 backdrop-blur-xl shadow-2xl rounded-[32px]">
                <div className="p-5 flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-crab-red/10 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-crab-red" />
                    </div>
                    <div className="space-y-1 text-center">
                        <DialogTitle className="text-lg font-black text-slate-900 leading-tight">Location Permission</DialogTitle>
                        <DialogDescription className="text-xs font-semibold text-slate-500 leading-relaxed px-2">
                            Allow this site to use your location for location permissions.
                        </DialogDescription>
                    </div>

                    <div className="flex w-full gap-2 mt-2">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-10 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 transition-colors"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                onConfirm();
                                onOpenChange(false);
                            }}
                            className="flex-1 h-10 bg-crab-red hover:bg-crab-red/90 text-white text-xs font-bold shadow-lg shadow-crab-red/20 transition-all active:scale-95"
                        >
                            Allow
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
