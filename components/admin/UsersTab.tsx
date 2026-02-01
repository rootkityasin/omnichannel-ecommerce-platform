'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Trash2, Plus, X, Filter, RefreshCw, MoreVertical, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAllUsers, createUserWithRole, deleteUser, getUserProfile, updateUser, resetUserPassword, generateImpersonationToken, updateUserStatus } from '@/app/actions/user';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, LogIn, Key, Ban } from 'lucide-react';


export function UsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Permission Modal State
    const [permissionModalOpen, setPermissionModalOpen] = useState(false);
    const [selectedUserForPerms, setSelectedUserForPerms] = useState<any>(null);
    const [tempPermissions, setTempPermissions] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Password Reset State
    const [resetPassModalOpen, setResetPassModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState<any>(null);
    const [newPasswordInput, setNewPasswordInput] = useState("");

    const AVAILABLE_PERMISSIONS = [
        { id: 'VIEW_DASHBOARD', label: 'View Dashboard', color: 'bg-gray-100 text-gray-700 border-gray-200' },
        { id: 'VIEW_ORDERS', label: 'View Orders', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { id: 'MANAGE_ORDERS', label: 'Manage Orders', color: 'bg-orange-50 text-orange-700 border-orange-200' },
        { id: 'VIEW_PRODUCTS', label: 'View Products', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
        { id: 'MANAGE_PRODUCTS', label: 'Manage Products', color: 'bg-pink-50 text-pink-700 border-pink-200' },
        { id: 'MANAGE_INVENTORY', label: 'Manage Inventory', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
        { id: 'VIEW_REPORTS', label: 'View Reports', color: 'bg-purple-50 text-purple-700 border-purple-200' },
        { id: 'MANAGE_SECURITY', label: 'Manage Security', color: 'bg-red-50 text-red-700 border-red-200' },
    ];

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'STAFF',
        hubId: '',
        password: '',
        permissions: [] as string[]
    });

    const togglePermission = (id: string) => {
        setNewUser(prev => ({
            ...prev,
            permissions: prev.permissions.includes(id)
                ? prev.permissions.filter(p => p !== id)
                : [...prev.permissions, id]
        }));
    };

    // Fetch Data
    const fetchUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data);
        } catch (e) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            const res = await deleteUser(id);
            if (res.success) {
                toast.success("User deleted");
                fetchUsers();
            } else {
                toast.error(res.error || "Failed to delete");
            }
        }
    };

    const handleToggleStatus = async (user: any) => {
        const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
        await updateUserStatus(user.id, newStatus);
        fetchUsers();
        toast.success(`User ${newStatus === 'Active' ? 'Activated' : 'Disabled'}`);
    };

    const handleResetPassword = (user: any) => {
        setUserToReset(user);
        setNewPasswordInput("");
        setResetPassModalOpen(true);
    };

    const confirmResetPassword = async () => {
        if (!userToReset) return;
        const res = await resetUserPassword(userToReset.id, newPasswordInput || undefined);
        if (res?.success) {
            toast.success(`Password reset for ${userToReset.name}. New Password: ${res.password}`);
            setResetPassModalOpen(false);
            setUserToReset(null);
        } else {
            toast.error(res?.error || "Failed to reset password");
        }
    };

    const handleLoginAs = async (user: any) => {
        if (!confirm(`Are you sure you want to login as ${user.name}? This will end your current admin session.`)) return;

        const toastId = toast.loading("Switching accounts...");
        const res = await generateImpersonationToken(user.id);

        if (res?.success && res.token) {
            // Sign in using the special impersonation credentials
            const result = await signIn('credentials', {
                phone: `impersonate:${user.id}`,
                password: res.token,
                redirect: false,
                // callbackUrl: '/admin' // Handle redirect manually
            });

            if (result?.error) {
                toast.dismiss(toastId);
                console.error("Login failed:", result.error);
                toast.error("Login failed: " + result.error);
            } else {
                // Success
                toast.success(`Logged in as ${user.name}`);
                window.location.href = '/admin'; // Force reload/redirect
            }
        } else {
            toast.dismiss(toastId);
            toast.error(res?.error || "Failed to generate login token");
        }
    };

    const handleEdit = (user: any) => {
        setNewUser({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: user.role,
            hubId: user.hubId || '',
            password: '', // Don't populate password
            permissions: user.permissions || []
        });
        setEditingId(user.id);
        setIsAdding(true);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();

        let res;
        if (editingId) {
            // Update
            res = await updateUser(editingId, {
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone || '01000000000',
                role: newUser.role as any,
                permissions: newUser.permissions,
                // Fix: convert empty string to null/undefined to avoid FK error
                hubId: newUser.hubId || undefined
            });
        } else {
            // Create
            res = await createUserWithRole({
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone || '01000000000',
                role: newUser.role as any,
                password: newUser.password,
                permissions: newUser.permissions,
                hubId: newUser.hubId || undefined
            });
        }

        if (res.success) {
            toast.success(editingId ? "User updated" : "User created");
            setIsAdding(false);
            setEditingId(null);
            setNewUser({ name: '', email: '', phone: '', role: 'USER', password: '', permissions: [], hubId: '' });
            fetchUsers();
        } else {
            toast.error(res.error || "Failed/Error");
        }
    };

    const handleOpenPermissionModal = (user: any) => {
        setSelectedUserForPerms(user);
        setTempPermissions(user.permissions || []);
        setPermissionModalOpen(true);
    };

    const handleSavePermissions = async () => {
        if (!selectedUserForPerms) return;

        const res = await updateUser(selectedUserForPerms.id, {
            ...selectedUserForPerms, // Keep other fields same
            permissions: tempPermissions
        });

        if (res.success) {
            toast.success("Permissions updated");
            setPermissionModalOpen(false);
            fetchUsers();
        } else {
            toast.error(res.error || "Failed to update");
        }
    };

    const toggleTempPermission = (id: string) => {
        setTempPermissions(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900">All Users</h1>
                    <span className="text-sm font-medium text-gray-400">{users.length}</span>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add New User
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                        <tr>
                            <th className="p-4">Name</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Permissions</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 group transition-colors">
                                <td className="p-4">
                                    <div>
                                        <div className="font-bold text-gray-900">{user.name}</div>
                                        <div className="text-xs text-gray-400">{user.email}</div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                                        {{
                                            'SUPER_ADMIN': 'Super Admin',
                                            'TENANT_ADMIN': 'Shop Admin',
                                            'HUB_ADMIN': 'Hub Manager',
                                            'STAFF': 'Staff'
                                        }[user.role as string] || user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-gray-500 max-w-[250px]">
                                    <div className="flex flex-col gap-2 items-start">
                                        <div className="flex flex-wrap gap-1">
                                            {['SUPER_ADMIN', 'TENANT_ADMIN'].includes(user.role) ? (
                                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">
                                                    Full Access
                                                </Badge>
                                            ) : (
                                                Array.isArray(user.permissions) && user.permissions.length > 0 ? (
                                                    user.permissions.map((perm: string) => {
                                                        const permObj = AVAILABLE_PERMISSIONS.find(p => p.id === perm);
                                                        return (
                                                            <Badge key={perm} variant="outline" className={`${permObj?.color || 'bg-slate-50 text-slate-600 border-slate-200'} font-normal`}>
                                                                {permObj?.label || perm}
                                                            </Badge>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-gray-400 italic">No access</span>
                                                )
                                            )}
                                        </div>
                                        {/* Show permission button for all admin/staff roles */}
                                        {['TENANT_ADMIN', 'HUB_ADMIN', 'STAFF'].includes(user.role) && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-6 w-fit mt-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 justify-center"
                                                onClick={() => handleOpenPermissionModal(user)}
                                                title="Manage Permissions"
                                            >
                                                <Edit className="w-3 h-3 mr-1" /> Manage Access
                                            </Button>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[200px] bg-white border border-gray-100 shadow-xl rounded-lg p-1">
                                            <DropdownMenuItem
                                                onClick={() => handleEdit(user)}
                                                className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded px-2 py-2 text-sm text-gray-700 flex items-center gap-2">
                                                <Edit className="w-4 h-4 text-gray-500" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(user.id)}
                                                className="cursor-pointer hover:bg-red-50 focus:bg-red-50 rounded px-2 py-2 text-sm text-red-600 flex items-center gap-2">
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                            <DropdownMenuItem
                                                onClick={() => handleLoginAs(user)}
                                                className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded px-2 py-2 text-sm text-gray-700 flex items-center gap-2">
                                                <LogIn className="w-4 h-4 text-gray-500" /> Login As Company
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleResetPassword(user)}
                                                className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 rounded px-2 py-2 text-sm text-gray-700 flex items-center gap-2">
                                                <Key className="w-4 h-4 text-gray-500" /> Reset Password
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleToggleStatus(user)}
                                                className="cursor-pointer hover:bg-red-50 focus:bg-red-50 rounded px-2 py-2 text-sm text-red-600 flex items-center gap-2">
                                                <Ban className="w-4 h-4" /> {user.status === 'Inactive' ? 'Enable Login' : 'Login Disable'}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit User Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl mx-4 bg-white shadow-2xl rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit User Details' : 'New User Details'}</h2>
                            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleAddUser} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Role</label>
                                        <Select value={newUser.role} onValueChange={(val) => setNewUser({ ...newUser, role: val })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STAFF">Staff (Worker)</SelectItem>
                                                <SelectItem value="HUB_ADMIN">Hub Admin (Manager)</SelectItem>
                                                <SelectItem value="TENANT_ADMIN">Shop Admin (Owner)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Hub Selector (Only for Hub Admin / Staff) */}
                                    {['HUB_ADMIN', 'STAFF'].includes(newUser.role) && (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-700 uppercase">Assign Hub</label>
                                            <Select value={newUser.hubId} onValueChange={(val) => setNewUser({ ...newUser, hubId: val })}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Hub" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="dhaka-central">Dhaka Central Hub</SelectItem>
                                                    <SelectItem value="khulna-hub">Khulna Hub</SelectItem>
                                                    <SelectItem value="chattogram-hub">Chattogram Hub</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Full Name</label>
                                        <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Email</label>
                                        <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Phone</label>
                                        <Input value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Password</label>
                                        <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                                    </div>
                                </div>

                                {/* Access Control Section */}
                                {['HUB_ADMIN', 'STAFF'].includes(newUser.role) && (
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                            <CheckSquare className="w-4 h-4 text-blue-500" />
                                            Access Control System
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {AVAILABLE_PERMISSIONS.map(perm => (
                                                <div key={perm.id} className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePermission(perm.id)}
                                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newUser.permissions.includes(perm.id)
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'bg-white border-slate-300'
                                                            }`}
                                                    >
                                                        {newUser.permissions.includes(perm.id) && <CheckSquare className="w-3.5 h-3.5" />}
                                                    </button>
                                                    <span className="text-sm text-slate-600">{perm.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200">
                                            {newUser.role === 'HUB_ADMIN'
                                                ? "Shop Admin can control which sections this Hub Admin sees."
                                                : "Hub Admin can control which sections this Staff member sees."}
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                                    <Button type="submit">Create User</Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}

            {/* Dedicated Permission Modal */}
            {permissionModalOpen && selectedUserForPerms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Card className="w-full max-w-md mx-4 bg-white shadow-2xl rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Manage Access</h2>
                                <p className="text-xs text-gray-500">For {selectedUserForPerms.name} ({
                                    {
                                        'SUPER_ADMIN': 'Super Admin',
                                        'TENANT_ADMIN': 'Shop Admin',
                                        'HUB_ADMIN': 'Hub Manager',
                                        'STAFF': 'Staff'
                                    }[selectedUserForPerms.role as string] || selectedUserForPerms.role
                                })</p>
                            </div>
                            <button onClick={() => setPermissionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-3">
                                    {AVAILABLE_PERMISSIONS.map(perm => (
                                        <div key={perm.id}
                                            onClick={() => toggleTempPermission(perm.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${tempPermissions.includes(perm.id)
                                                ? `${perm.color} shadow-sm border-opacity-100`
                                                : 'bg-white border-slate-100 hover:border-slate-300'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${tempPermissions.includes(perm.id)
                                                ? 'bg-current border-current text-white opacity-80' // opacity to soften if needed, or just solid
                                                : 'bg-white border-slate-300'
                                                }`}>
                                                {tempPermissions.includes(perm.id) && <CheckSquare className="w-3.5 h-3.5" />}
                                            </div>
                                            <div>
                                                <span className={`font-medium text-sm ${tempPermissions.includes(perm.id) ? 'text-current' : 'text-slate-700'}`}>
                                                    {perm.label}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-3 border-t border-gray-50 mt-6">
                                <Button variant="outline" onClick={() => setPermissionModalOpen(false)}>Cancel</Button>
                                <Button onClick={handleSavePermissions}>Save Changes</Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Password Reset Modal */}
            {resetPassModalOpen && userToReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Card className="w-full max-w-sm mx-4 bg-white shadow-2xl rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
                                <p className="text-xs text-gray-500">For {userToReset.name}</p>
                            </div>
                            <button onClick={() => { setResetPassModalOpen(false); setUserToReset(null); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase">New Password</label>
                                    <Input
                                        type="password"
                                        value={newPasswordInput}
                                        onChange={(e) => setNewPasswordInput(e.target.value)}
                                        placeholder="Leave blank to auto-generate"
                                        autoFocus
                                    />
                                    <p className="text-[10px] text-gray-400">If blank, a secure random password will be generated.</p>
                                </div>
                                <div className="pt-4 flex justify-end gap-3">
                                    <Button variant="outline" onClick={() => { setResetPassModalOpen(false); setUserToReset(null); }}>Cancel</Button>
                                    <Button onClick={confirmResetPassword} className="bg-red-600 hover:bg-red-700 text-white">
                                        Confirm Reset
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
