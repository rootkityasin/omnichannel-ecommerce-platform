'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MoreVertical, User, Plus, X, Phone, Mail, Edit, Trash2, Download, Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAllUsers, bulkImportCustomers } from '@/app/actions/user';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
    const [search, setSearch] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadGuide, setShowUploadGuide] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (hasFetched.current) return;
        hasFetched.current = true;

        const fetchUsers = async () => {
            const users = await getAllUsers();
            // Map Prisma users to the UI shape
            const formatted = users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                phone: u.phone || 'N/A',
                orders: 0, // Placeholder
                spent: 0   // Placeholder
            }));
            setCustomers(formatted);
        };
        fetchUsers();
    }, []);

    const [minSpent, setMinSpent] = useState(0);
    const [minOrders, setMinOrders] = useState(0);
    const [sortBy, setSortBy] = useState('newest');

    const filteredCustomers = customers
        .filter(c =>
            (c.name.toLowerCase().includes(search.toLowerCase()) ||
                (c.phone && c.phone.includes(search))) &&
            c.spent >= minSpent &&
            c.orders >= minOrders
        )
        .sort((a, b) => {
            if (sortBy === 'spent_high') return b.spent - a.spent;
            if (sortBy === 'spent_low') return a.spent - b.spent;
            if (sortBy === 'orders_high') return b.orders - a.orders;
            // 'newest' fallback depends on ID or joining date if available. 
            // Since ID is mock 'customer.length + 1' or string, let's assume higher ID = newer or implementation specific.
            // But real users have string IDs. Let's just return 0 for now or rely on array order.
            return 0;
        });

    const handleEdit = (customer: any) => {
        setNewCustomer({ name: customer.name, phone: customer.phone, email: customer.email });
        setEditingId(customer.id);
        setIsAdding(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to remove this customer?')) {
            setCustomers(customers.filter(c => c.id !== id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomer.name || !newCustomer.phone) return;

        if (editingId) {
            // Update existing
            setCustomers(customers.map(c => c.id === editingId ? { ...c, ...newCustomer } : c));
        } else {
            // Add new
            const customer = {
                id: customers.length + 1,
                ...newCustomer,
                orders: 0,
                spent: 0
            };
            setCustomers([...customers, customer]);
        }

        setIsAdding(false);
        setNewCustomer({ name: '', phone: '', email: '' });
        setEditingId(null);
    };

    const handleDownload = () => {
        const headers = ['ID', 'Name', 'Phone', 'Email', 'Orders', 'Spent', 'Points'];
        const csvContent = [
            headers.join(','),
            ...filteredCustomers.map(c => [
                c.id,
                `"${c.name}"`,
                c.phone,
                c.email || '',
                c.orders,
                c.spent,
                Math.floor(c.spent / 10) // Mock points calculation
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `customers_SortedBy_${sortBy}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const text = await file.text();
            toast.info('Parsing your file...');

            // Simple CSV parsing logic
            const lines = text.split('\n').map(line => line.trim()).filter(line => line);
            if (lines.length < 2) {
                toast.error('File must have header row and at least one data row');
                setIsUploading(false);
                return;
            }

            // Parse header - find column indices
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
            const nameIdx = headers.findIndex(h => ['name', 'full name', 'customer name', 'full_name', 'customer_name'].includes(h));
            const phoneIdx = headers.findIndex(h => ['phone', 'mobile', 'contact', 'phone number', 'phone_number'].includes(h));
            const emailIdx = headers.findIndex(h => ['email', 'email address', 'mail'].includes(h));

            if (nameIdx === -1 || phoneIdx === -1) {
                toast.error('File must have "Name" and "Phone" columns');
                setIsUploading(false);
                return;
            }

            // Parse data rows
            const parsed: { name: string; phone: string; email?: string }[] = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
                const name = cols[nameIdx];
                const phone = cols[phoneIdx]?.replace(/\D/g, ''); // Keep only digits
                const email = emailIdx !== -1 ? cols[emailIdx] : '';

                if (name && phone && phone.length >= 10) {
                    parsed.push({ name, phone, email: email || undefined });
                }
            }

            if (parsed.length === 0) {
                toast.error('No valid customers found in file');
                setIsUploading(false);
                return;
            }

            toast.info(`Found ${parsed.length} customers. Importing...`);

            const result = await bulkImportCustomers(parsed);

            if (result.success) {
                toast.success(`Imported ${result.imported} customers, ${result.skipped} skipped (duplicates)`);
                // Refresh list
                hasFetched.current = false;
                const users = await getAllUsers();
                const formatted = users.map(u => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone || 'N/A',
                    orders: 0,
                    spent: 0
                }));
                setCustomers(formatted);
            } else {
                toast.error(result.error || 'Import failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to process file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">👥 Customers</h1>
                    <p className="text-sm text-slate-500">View and manage your customer base.</p>
                </div>
                <div className="flex gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={minSpent > 0 || minOrders > 0 || sortBy !== 'newest' ? "bg-orange-50 border-orange-200 text-orange-700" : ""}>
                                <Filter className="w-4 h-4 mr-2" /> Filter {(minSpent > 0 || minOrders > 0 || sortBy !== 'newest') && '(Active)'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">Filter & Sort</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Refine list for export.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="sort">Sort By</Label>
                                        <Select value={sortBy} onValueChange={setSortBy}>
                                            <SelectTrigger className="col-span-2 h-8">
                                                <SelectValue placeholder="Sort By" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="newest">Newest First</SelectItem>
                                                <SelectItem value="spent_high">Top Spenders (High)</SelectItem>
                                                <SelectItem value="spent_low">Low Spenders</SelectItem>
                                                <SelectItem value="orders_high">Most Orders</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="minSpent">Min. Spent</Label>
                                        <Input
                                            id="minSpent"
                                            type="number"
                                            value={minSpent}
                                            onChange={(e) => setMinSpent(Number(e.target.value))}
                                            className="col-span-2 h-8"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="grid grid-cols-3 items-center gap-4">
                                        <Label htmlFor="minOrders">Min. Orders</Label>
                                        <Input
                                            id="minOrders"
                                            type="number"
                                            value={minOrders}
                                            onChange={(e) => setMinOrders(Number(e.target.value))}
                                            className="col-span-2 h-8"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button variant="outline" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" /> Download CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowUploadGuide(true)}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                        ) : (
                            <><Upload className="w-4 h-4 mr-2" /> Upload Excel</>
                        )}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleUpload}
                        className="hidden"
                    />

                    {/* Upload Guide Dialog */}
                    <Dialog open={showUploadGuide} onOpenChange={setShowUploadGuide}>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                                    Excel Format Guide
                                </DialogTitle>
                                <DialogDescription>
                                    Your file should look like this:
                                </DialogDescription>
                            </DialogHeader>

                            {/* Demo Table */}
                            <div className="border rounded-lg overflow-hidden bg-white">
                                <table className="w-full text-sm">
                                    <thead className="bg-orange-50 border-b">
                                        <tr>
                                            <th className="p-2 text-left font-bold text-orange-800">Name *</th>
                                            <th className="p-2 text-left font-bold text-orange-800">Phone *</th>
                                            <th className="p-2 text-left font-medium text-slate-500">Email</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <tr className="bg-slate-50">
                                            <td className="p-2">Rahim Uddin</td>
                                            <td className="p-2">01712345678</td>
                                            <td className="p-2 text-slate-400">rahim@email.com</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2">Karim Hossain</td>
                                            <td className="p-2">01898765432</td>
                                            <td className="p-2 text-slate-400">-</td>
                                        </tr>
                                        <tr className="bg-slate-50">
                                            <td className="p-2">Fatima Begum</td>
                                            <td className="p-2">01555123456</td>
                                            <td className="p-2 text-slate-400">fatima@mail.com</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="text-xs text-slate-500 space-y-1">
                                <p><span className="text-red-500">*</span> <strong>Name</strong> and <strong>Phone</strong> are required</p>
                                <p>• Column names can be: Name, Full Name, Customer Name</p>
                                <p>• Phone format: 01XXXXXXXXX (11 digits)</p>
                                <p>• Duplicates (same phone) will be automatically skipped</p>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setShowUploadGuide(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-orange-600 hover:bg-orange-700"
                                    onClick={() => {
                                        setShowUploadGuide(false);
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    <Upload className="w-4 h-4 mr-2" /> Select File
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button onClick={() => { setIsAdding(true); setEditingId(null); setNewCustomer({ name: '', phone: '', email: '' }); }} className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add Customer
                    </Button>
                </div>
            </div>

            {/* Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Customer' : 'Add Customer'}</h2>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                                    <Input
                                        placeholder="Customer Name"
                                        value={newCustomer.name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Phone</label>
                                    <Input
                                        placeholder="017..."
                                        value={newCustomer.phone}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Email (Optional)</label>
                                    <Input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={newCustomer.email}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                    {editingId ? 'Save Changes' : 'Save Customer'}
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>
            )}

            <Card className="border-gray-100 shadow-sm">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            type="search"
                            placeholder="Search by name or phone..."
                            className="pl-9 bg-gray-50 border-gray-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto custom-table-scrollbar">
                    <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="bg-gray-50 text-slate-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="p-4 w-4"><input type="checkbox" /></th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Points</th>
                                <th className="p-4">History</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50/50">
                                    <td className="p-4"><input type="checkbox" /></td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">{customer.name}</div>
                                                <div className="text-xs text-slate-400">ID: #{customer.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        <div className="flex items-center gap-2 text-sm"><Phone className="w-3 h-3" /> {customer.phone}</div>
                                        {customer.email && <div className="flex items-center gap-2 text-xs text-slate-400 mt-1"><Mail className="w-3 h-3" /> {customer.email}</div>}
                                    </td>
                                    <td className="p-4">
                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                                            {Math.floor(customer.spent / 10)} pts
                                        </Badge>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">৳{customer.spent.toLocaleString()}</div>
                                        <div className="text-xs text-slate-500">{customer.orders} Orders</div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEdit(customer)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(customer.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No customers found matching "{search}".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
