'use client';

import { TenantCard } from './TenantCard';
import { AddCompanyModal } from './AddCompanyModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Tenant } from '@/types/common';

// Extend Tenant to enforce _count presence as provided by the server query
interface DashboardTenant extends Tenant {
    _count: NonNullable<Tenant['_count']>;
}

interface DashboardClientProps {
    tenants: DashboardTenant[];
    plans: {
        id: string;
        slug: string;
        name: string;
        price: number;
        period: string;
        features: Record<string, unknown>;
    }[];
}

export function DashboardClient({ tenants, plans }: DashboardClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredTenants = tenants.filter(tenant => {
        const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPlan = selectedPlan ? tenant.plan === selectedPlan : true;
        return matchesSearch && matchesPlan;
    });

    const currentPlanName = selectedPlan ? plans.find(p => p.slug === selectedPlan)?.name : 'Filter';

    return (
        <div className="p-8 space-y-8 bg-slate-100 min-h-screen font-sans">
            {/* Header Redesign */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-transparent">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        Companies
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-200">
                            {filteredTenants.length}
                        </span>
                    </h1>
                    <p className="text-slate-700 text-sm mt-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Manage and oversee your platform tenants
                    </p>
                </div>

                {mounted && (
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-72 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-slate-700 transition-colors" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search companies..."
                                className="pl-9 bg-white border-slate-200 focus-visible:ring-slate-200 h-10 shadow-sm transition-all focus:w-full"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800 transition-colors">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className={`gap-2 h-10 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm min-w-[100px] justify-between ${selectedPlan ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4" />
                                        <span className="hidden sm:inline truncate max-w-[100px]">{currentPlanName}</span>
                                    </div>
                                    {selectedPlan && <X className="h-3 w-3 opacity-50 hover:opacity-100" onClick={(e) => { e.stopPropagation(); setSelectedPlan(null); }} />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Filter by Plan</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setSelectedPlan(null)} className="cursor-pointer">
                                    All Plans
                                </DropdownMenuItem>
                                {plans.map(plan => (
                                    <DropdownMenuCheckboxItem
                                        key={plan.id}
                                        checked={selectedPlan === plan.slug}
                                        onCheckedChange={() => setSelectedPlan(selectedPlan === plan.slug ? null : plan.slug)}
                                    >
                                        {plan.name}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AddCompanyModal />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTenants.length > 0 ? (
                    filteredTenants.map((tenant) => (
                        <TenantCard key={tenant.id} tenant={tenant} plans={plans} />
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                        <Search className="h-10 w-10 text-slate-200 mb-2" />
                        <p className="text-lg font-medium text-slate-600">No companies found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                        <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedPlan(null); }} className="mt-2 text-emerald-600">Clear all filters</Button>
                    </div>
                )}
            </div>
        </div>
    );
}
