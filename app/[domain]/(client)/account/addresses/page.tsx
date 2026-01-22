'use client';

import { MapPin, Plus, ArrowLeft, Trash2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Address {
    id: string;
    tag: string; // 'Home', 'Work', 'Other'
    address: string;
    phone: string;
    isDefault?: boolean;
}

export default function AddressesPage() {
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [newTag, setNewTag] = useState('Home');
    const [newAddress, setNewAddress] = useState('');
    const [newPhone, setNewPhone] = useState('');

    useEffect(() => {
        // Load addresses from local storage
        const storedAddresses = localStorage.getItem('crabkhai_addresses');
        if (storedAddresses) {
            setAddresses(JSON.parse(storedAddresses));
        } else {
            // Fallback: Check if user has a profile address and migrate it
            const userProfile = localStorage.getItem('crabkhai_user');
            if (userProfile) {
                try {
                    const parsed = JSON.parse(userProfile);
                    if (parsed.address) {
                        const initial: Address = {
                            id: Date.now().toString(),
                            tag: 'Home',
                            address: parsed.address,
                            phone: parsed.phone || '',
                            isDefault: true
                        };
                        setAddresses([initial]);
                        localStorage.setItem('crabkhai_addresses', JSON.stringify([initial]));
                    }
                } catch (e) {
                    console.error("Error migrating profile address", e);
                }
            }
        }
    }, []);

    const handleSaveAddress = () => {
        if (!newAddress || !newPhone) {
            toast.error("Please fill in all fields");
            return;
        }

        const newAddr: Address = {
            id: Date.now().toString(),
            tag: newTag,
            address: newAddress,
            phone: newPhone,
            isDefault: addresses.length === 0
        };

        const updated = [...addresses, newAddr];
        setAddresses(updated);
        localStorage.setItem('crabkhai_addresses', JSON.stringify(updated));

        setIsAdding(false);
        setNewAddress('');
        setNewPhone('');
        toast.success("Address added successfully!");
    };

    const handleDelete = (id: string) => {
        const updated = addresses.filter(a => a.id !== id);
        setAddresses(updated);
        localStorage.setItem('crabkhai_addresses', JSON.stringify(updated));
        toast.success("Address removed");
    };

    const handleSetDefault = (id: string) => {
        const updated = addresses.map(a => ({
            ...a,
            isDefault: a.id === id
        }));
        setAddresses(updated);
        localStorage.setItem('crabkhai_addresses', JSON.stringify(updated));
        toast.success("Default address updated");
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 relative">
            {/* Header */}
            <div className="p-4 bg-white shadow-sm sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/account" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </Link>
                        <h1 className="text-xl font-bold font-heading text-gray-900">My Addresses</h1>
                    </div>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="p-2 bg-crab-red text-white rounded-full shadow-lg shadow-orange-200 hover:bg-orange-600 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-4">
                {isAdding && (
                    <div className="bg-white p-5 rounded-2xl shadow-lg border border-orange-100 animate-in slide-in-from-top-4 fade-in duration-300">
                        <h3 className="font-bold text-gray-900 mb-4">Add New Address</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Label</label>
                                <div className="flex gap-2">
                                    {['Home', 'Work', 'Other'].map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setNewTag(tag)}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${newTag === tag
                                                ? 'bg-crab-red text-white shadow-md shadow-orange-500/20'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Address Details</label>
                                <textarea
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    placeholder="House, Road, Block, Area..."
                                    className="w-full p-3 bg-gray-50 rounded-xl border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-crab-red/20 focus:bg-white transition-all text-sm font-medium resize-none"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Contact Number</label>
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="+880..."
                                    className="w-full p-3 bg-gray-50 rounded-xl border-0 ring-1 ring-gray-100 focus:ring-2 focus:ring-crab-red/20 focus:bg-white transition-all text-sm font-medium"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveAddress}
                                    className="flex-1 py-3 text-sm font-bold text-white bg-crab-red rounded-xl shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:-translate-y-0.5 transition-all"
                                >
                                    Save Address
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {addresses.length === 0 && !isAdding ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <MapPin className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Addresses Found</h3>
                        <p className="text-gray-500 text-sm mt-1">Add a shipping address to checkout faster.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="mt-6 px-6 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 shadow-sm hover:border-crab-red hover:text-crab-red transition-all"
                        >
                            Add New Address
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {addresses.map((addr) => (
                            <div
                                key={addr.id}
                                onClick={() => handleSetDefault(addr.id)}
                                className={`bg-white p-4 rounded-xl shadow-sm border transition-all cursor-pointer relative group ${addr.isDefault
                                    ? 'border-crab-red/50 ring-1 ring-crab-red/20'
                                    : 'border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                <div className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${addr.tag === 'Home' ? 'bg-green-50 text-green-600' :
                                    addr.tag === 'Work' ? 'bg-blue-50 text-blue-600' :
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                    {addr.tag}
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${addr.isDefault ? 'bg-crab-red text-white shadow-md shadow-orange-500/20' : 'bg-gray-100 text-gray-400'
                                        }`}>
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 pr-16">
                                        <h3 className={`font-bold text-sm ${addr.isDefault ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {addr.address.split(',')[0]} {/* First line guess */}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{addr.address}</p>
                                        <p className="text-xs text-gray-400 mt-1.5 font-medium">{addr.phone}</p>
                                    </div>
                                </div>

                                {addr.isDefault && (
                                    <div className="absolute bottom-4 right-4 flex items-center gap-1 text-crab-red text-xs font-bold">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Default
                                    </div>
                                )}

                                {!addr.isDefault && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(addr.id);
                                        }}
                                        className="absolute bottom-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
