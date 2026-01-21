'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Trash2, Plus, X, Filter, RefreshCw, MoreVertical, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAllUsers, createUserWithRole, deleteUser } from '@/app/actions/user';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function UsersTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [activeTab, setActiveTab] = useState('Users Management');

    // Form State
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'USER', // Default 
        password: ''
    });

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

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();

        const res = await createUserWithRole({
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone || '01000000000', // Fallback
            role: newUser.role as any,
            password: newUser.password
        });

        if (res.success) {
            toast.success("User created successfully");
            setIsAdding(false);
            setNewUser({ name: '', email: '', phone: '', role: 'USER', password: '' });
            fetchUsers();
        } else {
            toast.error(res.error || "Failed to create user");
        }
    };

    return (
        <div className="space-y-6 bg-white min-h-screen p-6 rounded-xl">
            {/* Top Navigation / Breadcrumbs style tabs */}
            <div className="flex border-b border-gray-100">
                {['Roles Management', 'Users Management', 'Group Management'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-4 text-sm font-medium transition-colors relative ${activeTab === tab
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900">All Users</h1>
                    <span className="text-sm font-medium text-gray-400">{users.length}</span>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <input
                            type="text"
                            placeholder="Search Here"
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-100 placeholder:text-gray-300"
                        />
                    </div>

                    <Button variant="outline" className="text-gray-500 border-gray-200 hover:bg-gray-50">
                        <Filter className="w-4 h-4 mr-2" /> Filters
                    </Button>
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
                            <th className="p-4 w-10">
                                <div className="w-4 h-4 border border-gray-300 rounded bg-white" />
                            </th>
                            <th className="p-4">Name</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Groups</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 bg-white">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50/50 group transition-colors">
                                <td className="p-4">
                                    <div className="w-4 h-4 border border-gray-200 rounded text-transparent group-hover:border-blue-400 cursor-pointer" />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                            {/* Placeholder Avatar */}
                                            <img
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                                                alt={user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{user.name}</div>
                                            <div className="text-xs text-gray-400">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${user.role === 'SUPER_ADMIN' ? 'bg-gray-100 text-gray-700' :
                                        user.role === 'HUB_ADMIN' ? 'bg-blue-50 text-blue-600' :
                                            'bg-green-50 text-green-600'
                                        }`}>
                                        {user.role === 'SUPER_ADMIN' ? 'Super Admin' :
                                            user.role === 'HUB_ADMIN' ? 'Admin' : 'Contributor'}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500 font-medium">
                                    Falcons, Stallions
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${user.status !== 'Inactive' ? 'bg-green-500' : 'bg-red-400'}`} />
                                        <span className={`text-xs font-bold ${user.status !== 'Inactive' ? 'text-green-600' : 'text-red-400'}`}>
                                            {user.status || 'Active'}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-4 text-gray-400">
                                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors text-xs font-bold">
                                            <RefreshCw className="w-3 h-3" /> Reset Password
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors text-xs font-bold">
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                    <span className="font-medium">Prev</span>
                    <button className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded hover:bg-gray-50 text-gray-600">1</button>
                    <span className="font-medium">Next</span>
                </div>
                <span>Showing {users.length} of {users.length}</span>
            </div>

            {/* Add User Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <Card className="w-full max-w-lg mx-4 bg-white shadow-2xl rounded-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">New User Details</h2>
                            <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Full Name</label>
                                        <Input
                                            placeholder="John Doe"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            required
                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Phone</label>
                                        <Input
                                            placeholder="017..."
                                            value={newUser.phone}
                                            onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                            required
                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="email@company.com"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        required
                                        className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Role</label>
                                        <Select
                                            value={newUser.role}
                                            onValueChange={(val) => setNewUser({ ...newUser, role: val })}
                                        >
                                            <SelectTrigger className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all">
                                                <SelectValue placeholder="Select Role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USER">Contributor</SelectItem>
                                                <SelectItem value="HUB_ADMIN">Admin</SelectItem>
                                                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-700 uppercase">Password</label>
                                        <Input
                                            type="password"
                                            placeholder="••••••"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-gray-700">Cancel</Button>
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                                        Add User
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
