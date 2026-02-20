"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState, useTransition } from "react";
import { Loader2, Users, UserCheck, UserX, User } from "lucide-react";
import { toast } from "sonner";
import {
  getTenantUsers,
  updateTenantUserStatus,
} from "@/app/actions/super-admin";

interface CompanyUsersModalProps {
  tenantId: string;
  tenantName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isBlocked: boolean;
  role: string;
  isActive?: boolean;
}

export function CompanyUsersModal({
  tenantId,
  tenantName,
  open,
  onOpenChange,
}: CompanyUsersModalProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getTenantUsers(tenantId);
    if (res.success && res.users) {
      const mappedUsers: UserData[] = res.users.map((user) => {
        const base = user as UserData;
        return {
          ...base,
          isActive: base.isActive ?? true,
          isBlocked: base.isActive === false,
        };
      });
      setUsers(mappedUsers);
    } else {
      toast.error(res.error || "Failed to load users");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && tenantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsers();
    }
  }, [open, tenantId]);

  const handleToggleStatus = (userId: string, nextActive: boolean) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: nextActive } : u)),
    );

    startTransition(async () => {
      const res = await updateTenantUserStatus(userId, !nextActive);
      if (!res.success) {
        toast.error("Failed to update status");
        // Revert
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isActive: !nextActive } : u,
          ),
        );
      } else {
        toast.success(`User ${nextActive ? "enabled" : "blocked"}`);
      }
    });
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive !== false).length;
  const disabledUsers = users.filter((u) => u.isActive === false).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl">Company Info</DialogTitle>
          <DialogDescription>Manage users for {tenantName}</DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2 overflow-y-auto flex-1">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <h4 className="text-sm font-medium text-slate-500 mb-1">
                Total User
              </h4>
              <div className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Users className="w-5 h-5 text-orange-500" />
                {loading ? "-" : totalUsers}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <h4 className="text-sm font-medium text-slate-500 mb-1">
                Active User
              </h4>
              <div className="flex items-center gap-2 text-xl font-bold text-emerald-600">
                <UserCheck className="w-5 h-5" />
                {loading ? "-" : activeUsers}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <h4 className="text-sm font-medium text-slate-500 mb-1">
                Disable User
              </h4>
              <div className="flex items-center gap-2 text-xl font-bold text-red-500">
                <UserX className="w-5 h-5" />
                {loading ? "-" : disabledUsers}
              </div>
            </div>
          </div>

          {/* User List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No users found.</p>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-slate-100">
                      <AvatarImage src={user.image || ""} />
                      <AvatarFallback>
                        <User className="w-5 h-5 text-slate-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">
                        {user.name || "Unnamed User"}
                      </p>
                      {/* Role badge if needed, e.g. Admin */}
                    </div>
                  </div>
                  <Switch
                    checked={user.isActive !== false}
                    onCheckedChange={(checked) =>
                      handleToggleStatus(user.id, checked)
                    }
                    disabled={isPending}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
