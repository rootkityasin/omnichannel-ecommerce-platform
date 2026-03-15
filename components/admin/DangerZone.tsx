"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function DangerZone() {
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleReset = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Confirmation failed. You must type 'DELETE' exactly.");
      return;
    }

    setIsResetOpen(false);
    toast.promise(
      (async () => {
        const { resetDatabaseAction } =
          await import("@/app/actions/admin-reset");
        const res = await resetDatabaseAction();
        if (!res.success) throw new Error(res.message);
        return res.message;
      })(),
      {
        loading: "Resetting Database... (This may take a moment)",
        success: "Database has been reset successfully.",
        error: (err) => `Failed: ${err.message}`,
      },
    );
  };

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
            This action will permanently delete all tenant data including{" "}
            <strong>
              Products, Orders, Customers, Categories, Product Sections, and
              analytics events
            </strong>
            .
            <br />
            <strong>Your current Admin Account will be preserved.</strong>
          </p>
          <Button
            onClick={() => {
              setIsResetOpen(true);
              setConfirmText("");
            }}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset Entire Database
          </Button>
        </div>
      </div>

      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="border-red-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Emergency Reset
            </DialogTitle>
            <DialogDescription className="text-red-900 font-medium">
              WARNING: THIS CANNOT BE UNDONE.
            </DialogDescription>
            <DialogDescription>
              Type <span className="font-bold text-red-600">DELETE</span> below
              to confirm total database wipe.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="border-red-200 focus-visible:ring-red-500"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsResetOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={confirmText !== "DELETE"}
            >
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
